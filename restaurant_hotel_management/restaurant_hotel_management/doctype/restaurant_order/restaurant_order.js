frappe.ui.form.on('Restaurant Order', {
    refresh: function(frm) {
        // Add custom buttons
        if (!frm.doc.__islocal) {
            frm.add_custom_button(__('Update Status'), function() {
                show_status_dialog(frm);
            });
            
            if (frm.doc.status !== 'Served' && frm.doc.status !== 'Cancelled') {
                frm.add_custom_button(__('Mark as Ready'), function() {
                    update_status(frm, 'Ready');
                }, __('Status'));
                
                frm.add_custom_button(__('Mark as Served'), function() {
                    update_status(frm, 'Served');
                }, __('Status'));
                
                frm.add_custom_button(__('Cancel Order'), function() {
                    update_status(frm, 'Cancelled');
                }, __('Status'));
            }
        }
        
        // Set color based on status
        set_status_color(frm);
    },
    
    order_type: function(frm) {
        // Show/hide fields based on order type
        if (frm.doc.order_type === 'Dine In') {
            frm.set_df_property('table_number', 'reqd', 1);
            frm.set_df_property('room_number', 'reqd', 0);
        } else if (frm.doc.order_type === 'Room Service') {
            frm.set_df_property('room_number', 'reqd', 1);
            frm.set_df_property('table_number', 'reqd', 0);
        } else {
            frm.set_df_property('table_number', 'reqd', 0);
            frm.set_df_property('room_number', 'reqd', 0);
        }
    },
    
    paid_amount: function(frm) {
        calculate_outstanding(frm);
    }
});

frappe.ui.form.on('Restaurant Order Item', {
    qty: function(frm, cdt, cdn) {
        calculate_item_amount(frm, cdt, cdn);
    },
    
    rate: function(frm, cdt, cdn) {
        calculate_item_amount(frm, cdt, cdn);
    },
    
    items_remove: function(frm) {
        calculate_total(frm);
    }
});

function calculate_item_amount(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    row.amount = row.qty * row.rate;
    refresh_field('amount', cdn, 'items');
    calculate_total(frm);
}

function calculate_total(frm) {
    let total = 0;
    frm.doc.items.forEach(function(item) {
        total += item.amount || 0;
    });
    frm.set_value('total_amount', total);
    calculate_outstanding(frm);
}

function calculate_outstanding(frm) {
    let outstanding = (frm.doc.total_amount || 0) - (frm.doc.paid_amount || 0);
    frm.set_value('outstanding_amount', outstanding);
}

function show_status_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Update Order Status'),
        fields: [
            {
                fieldtype: 'Select',
                fieldname: 'status',
                label: __('Status'),
                options: 'Pending\nPreparing\nReady\nServed\nCancelled',
                default: frm.doc.status,
                reqd: 1
            }
        ],
        primary_action: function() {
            let values = dialog.get_values();
            update_status(frm, values.status);
            dialog.hide();
        },
        primary_action_label: __('Update')
    });
    dialog.show();
}

function update_status(frm, status) {
    frappe.call({
        method: 'restaurant_hotel_management.restaurant_hotel_management.doctype.restaurant_order.restaurant_order.update_order_status',
        args: {
            name: frm.doc.name,
            status: status
        },
        callback: function(r) {
            if (r.message && r.message.status === 'success') {
                frm.reload_doc();
                frappe.show_alert(__('Order status updated successfully'));
            }
        }
    });
}

function set_status_color(frm) {
    const status_colors = {
        'Pending': 'orange',
        'Preparing': 'blue',
        'Ready': 'green',
        'Served': 'purple',
        'Cancelled': 'red'
    };
    
    if (status_colors[frm.doc.status]) {
        frm.set_indicator(frm.doc.status, status_colors[frm.doc.status]);
    }
}