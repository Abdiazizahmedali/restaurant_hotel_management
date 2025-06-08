// Global Restaurant Hotel Management Functions

frappe.ready(function() {
    // Initialize real-time connections
    if (frappe.boot.socketio_port) {
        frappe.realtime.init();
    }
});

// POS Integration Functions
if (typeof erpnext !== 'undefined' && erpnext.PointOfSale) {
    // Extend POS functionality
    erpnext.PointOfSale.Controller = class extends erpnext.PointOfSale.Controller {
        async init_pos_app() {
            await super.init_pos_app();
            this.init_restaurant_features();
        }
        
        init_restaurant_features() {
            // Add order type selector
            this.add_order_type_selector();
            
            // Add table/room number fields
            this.add_location_fields();
            
            // Modify payment behavior
            this.modify_payment_behavior();
        }
        
        add_order_type_selector() {
            const order_type_html = `
                <div class="pos-order-type-selector">
                    <div class="order-type-btn active" data-type="Dine In">
                        <i class="fa fa-cutlery"></i><br>Dine In
                    </div>
                    <div class="order-type-btn" data-type="Take Away">
                        <i class="fa fa-shopping-bag"></i><br>Take Away
                    </div>
                    <div class="order-type-btn" data-type="Delivery">
                        <i class="fa fa-truck"></i><br>Delivery
                    </div>
                    <div class="order-type-btn" data-type="Room Service">
                        <i class="fa fa-bed"></i><br>Room Service
                    </div>
                </div>
            `;
            
            $(order_type_html).insertAfter(this.pos_app.$('.cart-container .cart-header'));
            
            // Handle order type selection
            this.pos_app.$('.order-type-btn').on('click', (e) => {
                this.pos_app.$('.order-type-btn').removeClass('active');
                $(e.currentTarget).addClass('active');
                this.selected_order_type = $(e.currentTarget).data('type');
                this.toggle_location_fields();
            });
            
            this.selected_order_type = 'Dine In';
        }
        
        add_location_fields() {
            const location_fields_html = `
                <div class="order-details-form">
                    <div class="form-group table-number-group">
                        <label>Table Number</label>
                        <input type="text" class="table-number-input" placeholder="Enter table number">
                    </div>
                    <div class="form-group room-number-group" style="display: none;">
                        <label>Room Number</label>
                        <input type="text" class="room-number-input" placeholder="Enter room number">
                    </div>
                    <div class="form-group">
                        <label>Waiter</label>
                        <select class="waiter-select">
                            <option value="">Select Waiter</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Kitchen Notes</label>
                        <textarea class="kitchen-notes-input" rows="2" placeholder="Special instructions for kitchen..."></textarea>
                    </div>
                </div>
            `;
            
            $(location_fields_html).insertAfter(this.pos_app.$('.pos-order-type-selector'));
            
            // Load waiters
            this.load_waiters();
        }
        
        toggle_location_fields() {
            const $table_group = this.pos_app.$('.table-number-group');
            const $room_group = this.pos_app.$('.room-number-group');
            
            if (this.selected_order_type === 'Dine In') {
                $table_group.show();
                $room_group.hide();
            } else if (this.selected_order_type === 'Room Service') {
                $table_group.hide();
                $room_group.show();
            } else {
                $table_group.hide();
                $room_group.hide();
            }
        }
        
        async load_waiters() {
            try {
                const waiters = await frappe.call({
                    method: 'frappe.client.get_list',
                    args: {
                        doctype: 'Employee',
                        filters: {
                            department: ['in', ['Restaurant', 'Hotel']]
                        },
                        fields: ['name', 'employee_name']
                    }
                });
                
                const $waiter_select = this.pos_app.$('.waiter-select');
                waiters.message.forEach(waiter => {
                    $waiter_select.append(`<option value="${waiter.name}">${waiter.employee_name}</option>`);
                });
            } catch (error) {
                console.error('Error loading waiters:', error);
            }
        }
        
        modify_payment_behavior() {
            // Override the payment submission to allow orders without immediate payment
            const original_submit_order = this.submit_order;
            
            this.submit_order = async function() {
                // Create restaurant order first
                await this.create_restaurant_order();
                
                // Skip payment if not required for this order type
                if (this.should_skip_payment()) {
                    return this.finalize_order_without_payment();
                }
                
                return original_submit_order.call(this);
            };
        }
        
        async create_restaurant_order() {
            const items = this.get_cart_items();
            const customer_info = this.get_customer_info();
            const order_details = this.get_order_details();
            
            try {
                const response = await frappe.call({
                    method: 'restaurant_hotel_management.restaurant_hotel_management.doctype.restaurant_order.restaurant_order.create_order_from_pos',
                    args: {
                        items: items,
                        customer_info: customer_info,
                        order_details: order_details
                    }
                });
                
                if (response.message && response.message.status === 'success') {
                    this.restaurant_order_id = response.message.order_id;
                    frappe.show_alert({
                        message: `Order ${this.restaurant_order_id} created successfully`,
                        indicator: 'green'
                    });
                }
            } catch (error) {
                console.error('Error creating restaurant order:', error);
                frappe.throw('Failed to create restaurant order');
            }
        }
        
        get_cart_items() {
            return this.pos_app.cart.items.map(item => ({
                item_code: item.item_code,
                item_name: item.item_name,
                qty: item.qty,
                rate: item.rate
            }));
        }
        
        get_customer_info() {
            return {
                customer_name: this.pos_app.$('.customer-name-input').val() || 'Walk-in Customer',
                mobile_no: this.pos_app.$('.mobile-number-input').val()
            };
        }
        
        get_order_details() {
            return {
                order_type: this.selected_order_type,
                table_number: this.pos_app.$('.table-number-input').val(),
                room_number: this.pos_app.$('.room-number-input').val(),
                waiter: this.pos_app.$('.waiter-select').val(),
                kitchen_notes: this.pos_app.$('.kitchen-notes-input').val(),
                special_instructions: this.pos_app.$('.kitchen-notes-input').val()
            };
        }
        
        should_skip_payment() {
            // Allow orders without immediate payment for dine-in and room service
            return ['Dine In', 'Room Service'].includes(this.selected_order_type);
        }
        
        async finalize_order_without_payment() {
            // Create a draft sales invoice for later payment
            frappe.show_alert({
                message: 'Order created successfully. Payment can be processed later.',
                indicator: 'blue'
            });
            
            // Clear the cart
            this.pos_app.cart.reset();
            this.pos_app.render();
        }
    };
}

// Utility Functions
window.restaurant_utils = {
    format_currency: function(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: frappe.defaults.get_default('currency') || 'USD'
        }).format(amount);
    },
    
    format_time: function(time_str) {
        return moment(time_str, 'HH:mm:ss').format('h:mm A');
    },
    
    get_status_badge: function(status) {
        const badges = {
            'Pending': '<span class="badge badge-warning">Pending</span>',
            'Preparing': '<span class="badge badge-primary">Preparing</span>',
            'Ready': '<span class="badge badge-success">Ready</span>',
            'Served': '<span class="badge badge-info">Served</span>',
            'Cancelled': '<span class="badge badge-danger">Cancelled</span>'
        };
        return badges[status] || status;
    },
    
    play_notification_sound: function() {
        // Play notification sound for new orders
        if (typeof Audio !== 'undefined') {
            const audio = new Audio('/assets/restaurant_hotel_management/sounds/notification.mp3');
            audio.play().catch(e => console.log('Could not play notification sound'));
        }
    }
};

// Real-time notifications
frappe.realtime.on('new_order', function(data) {
    // Show notification for new orders
    frappe.show_alert({
        message: `New ${data.order_type} order received: ${data.order_id}`,
        indicator: 'green'
    });
    
    window.restaurant_utils.play_notification_sound();
});

frappe.realtime.on('order_status_update', function(data) {
    // Show notification for status updates
    frappe.show_alert({
        message: `Order ${data.order_id} status updated to ${data.status}`,
        indicator: 'blue'
    });
});