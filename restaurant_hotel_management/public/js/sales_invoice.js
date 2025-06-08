// Sales Invoice customizations for Restaurant/Hotel Management
frappe.ui.form.on('Sales Invoice', {
    refresh: function(frm) {
        // Add restaurant-specific buttons if this is a restaurant order
        if (frm.doc.custom_order_type) {
            frm.add_custom_button(__('View Kitchen Display'), function() {
                frappe.set_route('kitchen-display');
            });
            
            if (frm.doc.custom_order_type === 'Room Service') {
                frm.add_custom_button(__('Room Service Details'), function() {
                    show_room_service_details(frm);
                });
            }
        }
        
        // Show order status if available
        if (frm.doc.custom_order_status) {
            frm.set_indicator(frm.doc.custom_order_status, get_status_color(frm.doc.custom_order_status));
        }
    },
    
    custom_order_type: function(frm) {
        // Show/hide fields based on order type
        toggle_order_type_fields(frm);
    }
});

function toggle_order_type_fields(frm) {
    const order_type = frm.doc.custom_order_type;
    
    if (order_type === 'Dine In') {
        frm.toggle_display('custom_table_number', true);
        frm.toggle_display('custom_room_number', false);
        frm.set_df_property('custom_table_number', 'reqd', 1);
        frm.set_df_property('custom_room_number', 'reqd', 0);
    } else if (order_type === 'Room Service') {
        frm.toggle_display('custom_table_number', false);
        frm.toggle_display('custom_room_number', true);
        frm.set_df_property('custom_table_number', 'reqd', 0);
        frm.set_df_property('custom_room_number', 'reqd', 1);
    } else {
        frm.toggle_display('custom_table_number', false);
        frm.toggle_display('custom_room_number', false);
        frm.set_df_property('custom_table_number', 'reqd', 0);
        frm.set_df_property('custom_room_number', 'reqd', 0);
    }
}

function show_room_service_details(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Room Service Details'),
        fields: [
            {
                fieldtype: 'Data',
                fieldname: 'room_number',
                label: __('Room Number'),
                default: frm.doc.custom_room_number,
                read_only: 1
            },
            {
                fieldtype: 'Link',
                fieldname: 'guest',
                label: __('Guest'),
                options: 'Customer',
                default: frm.doc.customer,
                read_only: 1
            },
            {
                fieldtype: 'Small Text',
                fieldname: 'special_instructions',
                label: __('Special Instructions'),
                default: frm.doc.custom_kitchen_notes,
                read_only: 1
            },
            {
                fieldtype: 'Section Break'
            },
            {
                fieldtype: 'Small Text',
                fieldname: 'delivery_notes',
                label: __('Delivery Notes'),
                description: __('Additional notes for room service delivery')
            }
        ],
        primary_action: function() {
            let values = dialog.get_values();
            
            // Update delivery notes
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'Sales Invoice',
                    name: frm.doc.name,
                    fieldname: 'custom_delivery_notes',
                    value: values.delivery_notes
                },
                callback: function(r) {
                    frappe.show_alert(__('Delivery notes updated'));
                    dialog.hide();
                    frm.reload_doc();
                }
            });
        },
        primary_action_label: __('Update Notes')
    });
    
    dialog.show();
}

function get_status_color(status) {
    const colors = {
        'Pending': 'orange',
        'Preparing': 'blue',
        'Ready': 'green',
        'Served': 'purple',
        'Cancelled': 'red'
    };
    return colors[status] || 'gray';
}