// Extend POS Profile for Restaurant features
frappe.ui.form.on('POS Profile', {
    refresh: function(frm) {
        // Add restaurant-specific settings
        frm.add_custom_button(__('Configure Restaurant Settings'), function() {
            show_restaurant_settings_dialog(frm);
        });
    }
});

function show_restaurant_settings_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Restaurant Settings'),
        fields: [
            {
                fieldtype: 'Section Break',
                label: __('Order Management')
            },
            {
                fieldtype: 'Check',
                fieldname: 'enable_kitchen_display',
                label: __('Enable Kitchen Display Integration'),
                default: 1
            },
            {
                fieldtype: 'Check',
                fieldname: 'allow_order_without_payment',
                label: __('Allow Orders Without Immediate Payment'),
                default: 1,
                description: __('Useful for dine-in and room service orders')
            },
            {
                fieldtype: 'Section Break',
                label: __('Default Settings')
            },
            {
                fieldtype: 'Select',
                fieldname: 'default_order_type',
                label: __('Default Order Type'),
                options: 'Dine In\nTake Away\nDelivery\nRoom Service',
                default: 'Dine In'
            },
            {
                fieldtype: 'Link',
                fieldname: 'default_waiter',
                label: __('Default Waiter'),
                options: 'Employee'
            },
            {
                fieldtype: 'Section Break',
                label: __('Kitchen Settings')
            },
            {
                fieldtype: 'Int',
                fieldname: 'auto_refresh_interval',
                label: __('Auto Refresh Interval (seconds)'),
                default: 30,
                description: __('How often kitchen display should refresh')
            }
        ],
        primary_action: function() {
            let values = dialog.get_values();
            
            // Save settings as custom fields
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'POS Profile',
                    name: frm.doc.name,
                    fieldname: {
                        'custom_enable_kitchen_display': values.enable_kitchen_display,
                        'custom_allow_order_without_payment': values.allow_order_without_payment,
                        'custom_default_order_type': values.default_order_type,
                        'custom_default_waiter': values.default_waiter,
                        'custom_auto_refresh_interval': values.auto_refresh_interval
                    }
                },
                callback: function(r) {
                    frappe.show_alert(__('Restaurant settings saved successfully'));
                    dialog.hide();
                    frm.reload_doc();
                }
            });
        },
        primary_action_label: __('Save Settings')
    });
    
    dialog.show();
}