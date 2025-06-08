import frappe
from frappe import _
import json
from datetime import datetime, timedelta

@frappe.whitelist(allow_guest=True)
def get_menu_items():
    """Get menu items for online ordering"""
    items = frappe.get_all(
        'Item',
        filters={
            'disabled': 0,
            'is_sales_item': 1,
            'item_group': ['like', '%Food%']
        },
        fields=['name', 'item_name', 'image', 'description', 'standard_rate'],
        order_by='item_name'
    )
    
    # Group by item group
    menu = {}
    for item in items:
        item_group = frappe.db.get_value('Item', item.name, 'item_group')
        if item_group not in menu:
            menu[item_group] = []
        menu[item_group].append(item)
    
    return menu

@frappe.whitelist()
def create_online_order(order_data):
    """Create order from online ordering system"""
    try:
        order_data = json.loads(order_data) if isinstance(order_data, str) else order_data
        
        # Create Restaurant Order
        order = frappe.new_doc('Restaurant Order')
        order.customer_name = order_data.get('customer_name')
        order.mobile_no = order_data.get('mobile_no')
        order.order_type = order_data.get('order_type', 'Take Away')
        order.special_instructions = order_data.get('special_instructions')
        
        # Add items
        for item_data in order_data.get('items', []):
            order.append('items', {
                'item': item_data.get('item_code'),
                'qty': item_data.get('qty'),
                'rate': item_data.get('rate')
            })
        
        order.save()
        
        # Send notification
        frappe.publish_realtime(
            event="new_online_order",
            message={
                "order_id": order.name,
                "order_type": order.order_type,
                "customer_name": order.customer_name
            },
            room="kitchen_display"
        )
        
        return {
            "status": "success",
            "order_id": order.name,
            "message": "Order placed successfully"
        }
        
    except Exception as e:
        frappe.log_error(f"Error creating online order: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def get_order_status(order_id):
    """Get order status for tracking"""
    try:
        order = frappe.get_doc('Restaurant Order', order_id)
        return {
            "status": "success",
            "order_status": order.status,
            "order_details": {
                "name": order.name,
                "order_time": order.order_time,
                "total_amount": order.total_amount,
                "items": [
                    {
                        "item_name": item.item_name,
                        "qty": item.qty,
                        "rate": item.rate
                    }
                    for item in order.items
                ]
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def get_daily_summary(date=None):
    """Get daily sales summary for reporting"""
    if not date:
        date = frappe.utils.today()
    
    # Get orders for the day
    orders = frappe.get_all(
        'Restaurant Order',
        filters={
            'order_date': date,
            'docstatus': ['!=', 2]  # Not cancelled
        },
        fields=['name', 'status', 'order_type', 'total_amount', 'order_time']
    )
    
    # Calculate summary
    summary = {
        'date': date,
        'total_orders': len(orders),
        'total_revenue': sum(order.total_amount for order in orders),
        'order_types': {},
        'status_breakdown': {},
        'hourly_breakdown': {}
    }
    
    for order in orders:
        # Order type breakdown
        if order.order_type not in summary['order_types']:
            summary['order_types'][order.order_type] = {'count': 0, 'revenue': 0}
        summary['order_types'][order.order_type]['count'] += 1
        summary['order_types'][order.order_type]['revenue'] += order.total_amount
        
        # Status breakdown
        if order.status not in summary['status_breakdown']:
            summary['status_breakdown'][order.status] = 0
        summary['status_breakdown'][order.status] += 1
        
        # Hourly breakdown
        hour = datetime.strptime(str(order.order_time), '%H:%M:%S').hour
        if hour not in summary['hourly_breakdown']:
            summary['hourly_breakdown'][hour] = {'count': 0, 'revenue': 0}
        summary['hourly_breakdown'][hour]['count'] += 1
        summary['hourly_breakdown'][hour]['revenue'] += order.total_amount
    
    return summary

def update_order_status():
    """Scheduled task to update order status"""
    # Auto-mark old pending orders as cancelled after 2 hours
    cutoff_time = datetime.now() - timedelta(hours=2)
    
    old_orders = frappe.get_all(
        'Restaurant Order',
        filters={
            'status': 'Pending',
            'creation': ['<', cutoff_time]
        },
        fields=['name']
    )
    
    for order in old_orders:
        doc = frappe.get_doc('Restaurant Order', order.name)
        doc.status = 'Cancelled'
        doc.add_comment('Comment', 'Auto-cancelled due to timeout')
        doc.save()
        
        frappe.publish_realtime(
            event="order_cancelled",
            message={
                "order_id": order.name,
                "reason": "timeout"
            },
            room="kitchen_display"
        )