frappe.pages['waiter-display'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Waiter Display',
        single_column: true
    });
    
    // Add filter by waiter
    page.add_field({
        fieldname: 'waiter_filter',
        fieldtype: 'Link',
        options: 'Employee',
        label: __('Filter by Waiter'),
        change: function() {
            load_waiter_orders();
        }
    });
    
    // Add refresh button
    page.add_menu_item(__('Refresh'), function() {
        load_waiter_orders();
    });
    
    // Create main container
    page.main = $('<div class="waiter-display-container">').appendTo(page.body);
    
    // Load initial orders
    load_waiter_orders();
    
    // Set up real-time updates
    frappe.realtime.on("order_status_update", function(data) {
        load_waiter_orders();
    });
    
    frappe.realtime.on("new_order", function(data) {
        load_waiter_orders();
    });
    
    function load_waiter_orders() {
        let waiter = page.fields_dict.waiter_filter.get_value();
        
        frappe.call({
            method: 'restaurant_hotel_management.restaurant_hotel_management.doctype.restaurant_order.restaurant_order.get_waiter_orders',
            args: {
                waiter: waiter
            },
            callback: function(r) {
                if (r.message) {
                    render_waiter_orders(r.message);
                }
            }
        });
    }
    
    function render_waiter_orders(orders) {
        page.main.empty();
        
        if (orders.length === 0) {
            page.main.html('<div class="text-center text-muted" style="margin-top: 100px; font-size: 18px;">No active orders</div>');
            return;
        }
        
        // Group orders by status
        let ready_orders = orders.filter(order => order.status === 'Ready');
        let other_orders = orders.filter(order => order.status !== 'Ready');
        
        let html = `
            <div class="waiter-board">
                ${ready_orders.length > 0 ? `
                    <div class="alert alert-success ready-orders-alert">
                        <strong><i class="fa fa-bell"></i> ${ready_orders.length} Orders Ready for Service!</strong>
                    </div>
                ` : ''}
                
                <div class="row">
                    <div class="col-md-12">
                        <div class="orders-grid">
                            ${orders.map(order => render_waiter_order_card(order)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        page.main.html(html);
        
        // Add click handlers
        page.main.find('.serve-order-btn').on('click', function() {
            let order_id = $(this).data('order-id');
            serve_order(order_id);
        });
    }
    
    function render_waiter_order_card(order) {
        let status_class = order.status.toLowerCase().replace(' ', '-');
        let status_icon = get_status_icon(order.status);
        let order_type_icon = get_order_type_icon(order.order_type);
        let location_info = get_location_info(order);
        
        return `
            <div class="waiter-order-card ${status_class}-status" data-order-id="${order.name}">
                <div class="order-card-header">
                    <div class="order-id">${order.name}</div>
                    <div class="order-status">
                        <i class="${status_icon}"></i> ${order.status}
                    </div>
                </div>
                <div class="order-details">
                    <div class="order-meta">
                        <div class="order-time">
                            <i class="fa fa-clock-o"></i> ${moment(order.order_time, 'HH:mm:ss').format('h:mm A')}
                        </div>
                        <div class="order-type">
                            <i class="${order_type_icon}"></i> ${order.order_type}
                        </div>
                    </div>
                    ${location_info ? `<div class="order-location"><i class="fa fa-map-marker"></i> ${location_info}</div>` : ''}
                    ${order.customer_name ? `<div class="customer-name"><i class="fa fa-user"></i> ${order.customer_name}</div>` : ''}
                    <div class="order-total">
                        <strong>Total: ${format_currency(order.total_amount)}</strong>
                    </div>
                </div>
                <div class="order-actions">
                    ${order.status === 'Ready' ? 
                        `<button class="btn btn-success serve-order-btn" data-order-id="${order.name}">
                            <i class="fa fa-check"></i> Mark as Served
                        </button>` : 
                        `<span class="text-muted">Waiting for kitchen...</span>`
                    }
                </div>
            </div>
        `;
    }
    
    function get_status_icon(status) {
        const icons = {
            'Pending': 'fa fa-clock-o text-warning',
            'Preparing': 'fa fa-fire text-primary',
            'Ready': 'fa fa-check-circle text-success',
            'Served': 'fa fa-smile-o text-success'
        };
        return icons[status] || 'fa fa-question-circle';
    }
    
    function get_order_type_icon(order_type) {
        const icons = {
            'Dine In': 'fa fa-cutlery',
            'Take Away': 'fa fa-shopping-bag',
            'Delivery': 'fa fa-truck',
            'Room Service': 'fa fa-bed'
        };
        return icons[order_type] || 'fa fa-cutlery';
    }
    
    function get_location_info(order) {
        if (order.order_type === 'Dine In' && order.table_number) {
            return `Table ${order.table_number}`;
        } else if (order.order_type === 'Room Service' && order.room_number) {
            return `Room ${order.room_number}`;
        }
        return '';
    }
    
    function serve_order(order_id) {
        frappe.confirm(
            `Mark order ${order_id} as served?`,
            function() {
                frappe.call({
                    method: 'restaurant_hotel_management.restaurant_hotel_management.doctype.restaurant_order.restaurant_order.update_order_status',
                    args: {
                        name: order_id,
                        status: 'Served'
                    },
                    callback: function(r) {
                        if (r.message && r.message.status === 'success') {
                            frappe.show_alert(__('Order marked as served'));
                            load_waiter_orders();
                        }
                    }
                });
            }
        );
    }
};