# Restaurant & Hotel Management System for ERPNext

A comprehensive restaurant and hotel management system built as an ERPNext v15 module. This system provides complete order management, kitchen display systems, waiter interfaces, and detailed reporting capabilities.

## Features

### Core Functionality
- **Order Management**: Complete order lifecycle from creation to service
- **Kitchen Display System**: Real-time order tracking for kitchen staff
- **Waiter Display**: Order status monitoring for service staff
- **POS Integration**: Seamless integration with ERPNext POS system
- **Multiple Order Types**: Dine In, Take Away, Delivery, Room Service

### Restaurant Management
- Real-time kitchen display with order prioritization
- Waiter assignment and performance tracking
- Table management for dine-in orders
- Order status tracking (Pending → Preparing → Ready → Served)

### Hotel Management
- Room service order management
- Guest management integration
- Room-based ordering system
- Hotel-specific reporting and analytics

### Reporting & Analytics
- Daily sales summaries
- Order type analysis
- Waiter performance reports
- Revenue analytics
- Customer satisfaction tracking

## Installation

1. Navigate to your ERPNext bench directory:
```bash
cd frappe-bench
```

2. Get the app:
```bash
bench get-app https://github.com/yourusername/restaurant_hotel_management.git
```

3. Install the app on your site:
```bash
bench --site yoursite.com install-app restaurant_hotel_management
```

4. Run migrations:
```bash
bench --site yoursite.com migrate
```

## Configuration

### 1. Setup User Roles
Create and assign the following roles:
- **Restaurant Manager**: Full access to restaurant operations
- **Kitchen User**: Access to kitchen display and order management
- **Waiter**: Access to waiter display and order serving
- **Hotel Manager**: Full access to hotel operations

### 2. Configure POS Profile
1. Go to **POS Profile** in ERPNext
2. Click on **Configure Restaurant Settings**
3. Enable kitchen display integration
4. Set default order types and waiters
5. Configure auto-refresh intervals

### 3. Setup Items
1. Create food and beverage items in **Item Master**
2. Set appropriate item groups (Food, Beverages, etc.)
3. Configure standard rates
4. Add item images for better presentation

## Usage

### Kitchen Display System
- Access via: **Restaurant Management > Kitchen Display**
- Shows pending and preparing orders
- Real-time updates when new orders arrive
- Click orders to update status
- Color-coded priority system

### Waiter Display
- Access via: **Restaurant Management > Waiter Display**
- Shows orders ready for service
- Filter by assigned waiter
- One-click order completion
- Customer and table information

### POS Integration
- Use standard ERPNext POS with enhanced features
- Select order type (Dine In, Take Away, etc.)
- Add table/room numbers
- Assign waiters
- Add kitchen notes
- Allow orders without immediate payment

### Order Management
- Create orders via **Restaurant Order** doctype
- Track order status throughout lifecycle
- Generate sales invoices automatically
- Handle payments flexibly

## Customization

### Adding New Order Types
1. Modify the `order_type` field options in **Restaurant Order** doctype
2. Update POS integration code in `public/js/restaurant_hotel.js`
3. Add appropriate logic in order processing

### Custom Reports
Create custom reports using ERPNext's report builder:
1. Go to **Report Builder**
2. Select **Restaurant Order** or **Sales Invoice**
3. Add filters for date ranges, order types, etc.
4. Save and share with team

### Workflow Customization
Modify the order workflow:
1. Go to **Workflow** in ERPNext
2. Create custom workflow for **Restaurant Order**
3. Define states, transitions, and permissions
4. Apply workflow to doctype

## API Endpoints

### Get Menu Items
```
GET /api/method/restaurant_hotel_management.api.restaurant_api.get_menu_items
```

### Create Online Order
```
POST /api/method/restaurant_hotel_management.api.restaurant_api.create_online_order
```

### Get Order Status
```
GET /api/method/restaurant_hotel_management.api.restaurant_api.get_order_status
```

### Daily Summary
```
GET /api/method/restaurant_hotel_management.api.restaurant_api.get_daily_summary
```

## Real-time Features

The system uses Frappe's real-time capabilities for:
- Kitchen display updates
- Order status notifications
- New order alerts
- Payment confirmations

## Troubleshooting

### Kitchen Display Not Updating
1. Check if SocketIO is enabled in ERPNext
2. Verify browser WebSocket connections
3. Check real-time settings in site_config.json

### Orders Not Appearing in Kitchen
1. Verify order status is "Pending" or "Preparing"
2. Check kitchen display permissions
3. Refresh the kitchen display page

### POS Integration Issues
1. Clear browser cache
2. Check POS Profile configuration
3. Verify custom field installations

## Support

For support and customizations:
- Email: support@yourcompany.com
- Documentation: [Link to documentation]
- GitHub Issues: [Link to GitHub repository]

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## Changelog

### Version 1.0.0
- Initial release
- Basic order management
- Kitchen and waiter displays
- POS integration
- Reporting system