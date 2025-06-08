frappe.pages['kitchen-display'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Kitchen Display System',
        single_column: true
    });
    
    // Add refresh button
    page.add_menu_item(__('Refresh'), function() {
        load_kitchen_orders();
    });
    
    // Add auto-refresh toggle
    page.add_menu_item(__('Auto Refresh: ON'), function() {
        toggle_auto_refresh();
    });
    
    // Create main container
    page.main = $('<div class="kitchen-display-container">').appendTo(page.body);
    
    // Load initial orders
    load_kitchen_orders();
    
    // Set up real-time updates
    frappe.realtime.on("order_status_update", function(data) {
        update_order_status(data);
    });
    
    frappe.realtime.on("new_order", function(data) {
        load_kitchen_orders();
    });
    
    // Auto refresh every 30 seconds
    let auto_refresh_interval = setInterval(load_kitchen_orders, 30000);
    
    function toggle_auto_refresh() {
        if (auto_refresh_interval) {
            clearInterval(auto_refresh_interval);
            auto_refresh_interval = null;
            page.menu.find('a:contains("Auto Refresh")').text(__('Auto Refresh: OFF'));
        } else {
            auto_refresh_interval = setInterval(load_kitchen_orders, 30000);
            page.menu.find('a:contains("Auto Refresh")').text(__('Auto Refresh: ON'));
        }
    }
    
    function load_kitchen_orders() {
        frappe.call({
            method: 'restaurant_hotel_management.restaurant_hotel_management.doctype.restaurant_order.restaurant_order.get_kitchen_orders',
            callback: function(r) {
                if (r.message) {
                    render_kitchen_orders(r.message);
                }
            }
        });
    }
    
    function render_kitchen_orders(orders) {
        page.main.empty();
        
        if (orders.length === 0) {
            page.main.html('<div class="text-center text-muted" style="margin-top: 100px; font-size: 18px;">No pending orders</div>');
            return;
        }
        
        // Group orders by status
        let pending_orders = orders.filter(order => order.status === 'Pending');
        let preparing_orders = orders.filter(order => order.status === 'Preparing');
        
        let html = `
            <div class="row kitchen-board">
                <div class="col-md-6">
                    <div class="kitchen-column pending-column">
                        <h3 class="kitchen-column-title">
                            <i class="fa fa-clock-o"></i> Pending Orders (${pending_orders.length})
                        </h3>
                        <div class="order-cards-container">
                            ${pending_orders.map(order => render_order_card(order)).join('')}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="kitchen-column preparing-column">
                        <h3 class="kitchen-column-title">
                            <i class="fa fa-fire"></i> Preparing Orders (${preparing_orders.length})
                        </h3>
                        <div class="order-cards-container">
                            ${preparing_orders.map(order => render_order_card(order)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        page.main.html(html);
        
        // Add click handlers for status updates
        page.main.find('.order-card').on('click', function() {
            let order_id = $(this).data('order-id');
            let current_status = $(this).data('status');
            show_status_update_dialog(order_id, current_status);
        });
    }
    
    function render_order_card(order) {
        let priority_class = order.priority === 'High' ? 'high-priority' : 
                           order.priority === 'Urgent' ? 'urgent-priority' : '';
        
        let order_type_icon = get_order_type_icon(order.order_type);
        let location_info = get_location_info(order);
        
        return `
            <div class="order-card ${priority_class}" data-order-id="${order.name}" data-status="${order.status}">
                <div class="order-header">
                    <div class="order-id">${order.name}</div>
                    <div class="order-time">${moment(order.order_time, 'HH:mm:ss').format('h:mm A')}</div>
                </div>
                <div class="order-info">
                    <div class="order-type">
                        <i class="${order_type_icon}"></i> ${order.order_type}
                    </div>
                    <div class="order-location">${location_info}</div>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span class="item-qty">${item.qty}x</span>
                            <span class="item-name">${item.item_name}</span>
                        </div>
                    `).join('')}
                </div>
                ${order.kitchen_notes ? `<div class="kitchen-notes"><i class="fa fa-sticky-note"></i> ${order.kitchen_notes}</div>` : ''}
                <div class="order-actions">
                    ${order.status === 'Pending' ? 
                        '<button class="btn btn-primary btn-sm start-preparing">Start Preparing</button>' :
                        '<button class="btn btn-success btn-sm mark-ready">Mark Ready</button>'
                    }
                </div>
            </div>
        `;
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
    
    function show_status_update_dialog(order_id, current_status) {
        let next_status = current_status === 'Pending' ? 'Preparing' : 'Ready';
        
        frappe.confirm(
            `Mark order ${order_id} as ${next_status}?`,
            function() {
                update_order_status_api(order_id, next_status);
            }
        );
    }
    
    function update_order_status_api(order_id, status) {
        frappe.call({
            method: 'restaurant_hotel_management.restaurant_hotel_management.doctype.restaurant_order.restaurant_order.update_order_status',
            args: {
                name: order_id,
                status: status
            },
            callback: function(r) {
                if (r.message && r.message.status === 'success') {
                    frappe.show_alert(__('Order status updated'));
                    load_kitchen_orders();
                }
            }
        });
    }
    
    function update_order_status(data) {
        // Real-time status update
        let order_card = page.main.find(`[data-order-id="${data.order_id}"]`);
        if (order_card.length) {
            // Animate the status change
            order_card.addClass('status-updated').delay(2000).queue(function() {
                load_kitchen_orders();
                $(this).dequeue();
            });
        }
    }
};