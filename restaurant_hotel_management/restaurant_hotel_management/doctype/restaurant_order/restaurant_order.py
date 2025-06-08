import frappe
from frappe.model.document import Document
from frappe import _
import json

class RestaurantOrder(Document):
    def validate(self):
        self.calculate_totals()
        self.validate_order_type()
        
    def calculate_totals(self):
        total = 0
        for item in self.items:
            item.amount = item.qty * item.rate
            total += item.amount
        
        self.total_amount = total
        self.outstanding_amount = self.total_amount - (self.paid_amount or 0)
    
    def validate_order_type(self):
        if self.order_type == "Dine In" and not self.table_number:
            frappe.throw(_("Table Number is required for Dine In orders"))
        
        if self.order_type == "Room Service" and not self.room_number:
            frappe.throw(_("Room Number is required for Room Service orders"))
    
    def on_submit(self):
        # Create Sales Invoice
        self.create_sales_invoice()
        
    def create_sales_invoice(self):
        if self.sales_invoice:
            return
            
        # Create Sales Invoice
        sales_invoice = frappe.new_doc("Sales Invoice")
        sales_invoice.customer = self.customer or "Walking Customer"
        sales_invoice.posting_date = self.order_date
        sales_invoice.posting_time = self.order_time
        sales_invoice.due_date = self.order_date
        sales_invoice.is_pos = 1
        
        # Add custom fields
        sales_invoice.order_type = self.order_type
        sales_invoice.table_number = self.table_number
        sales_invoice.room_number = self.room_number
        sales_invoice.waiter = self.waiter
        sales_invoice.kitchen_notes = self.kitchen_notes
        
        # Add items
        for item in self.items:
            sales_invoice.append("items", {
                "item_code": item.item,
                "item_name": item.item_name,
                "qty": item.qty,
                "rate": item.rate,
                "amount": item.amount
            })
        
        sales_invoice.save()
        
        # Update reference
        self.db_set("sales_invoice", sales_invoice.name)
        
        frappe.msgprint(_("Sales Invoice {0} created successfully").format(sales_invoice.name))

@frappe.whitelist()
def update_order_status(name, status):
    """Update order status"""
    doc = frappe.get_doc("Restaurant Order", name)
    doc.status = status
    doc.save()
    
    # Broadcast update to kitchen display
    frappe.publish_realtime(
        event="order_status_update",
        message={
            "order_id": name,
            "status": status,
            "order_type": doc.order_type
        },
        room="kitchen_display"
    )
    
    return {"status": "success"}

@frappe.whitelist()
def get_kitchen_orders():
    """Get orders for kitchen display"""
    orders = frappe.get_all(
        "Restaurant Order",
        filters={"status": ["in", ["Pending", "Preparing"]]},
        fields=["name", "order_time", "status", "priority", "order_type", 
                "table_number", "room_number", "kitchen_notes", "total_amount"],
        order_by="priority desc, order_time asc"
    )
    
    for order in orders:
        # Get order items
        items = frappe.get_all(
            "Restaurant Order Item",
            filters={"parent": order.name},
            fields=["item", "item_name", "qty", "rate", "amount"]
        )
        order["items"] = items
    
    return orders

@frappe.whitelist()
def get_waiter_orders(waiter=None):
    """Get orders for waiter display"""
    filters = {"status": ["not in", ["Cancelled", "Served"]]}
    if waiter:
        filters["waiter"] = waiter
    
    orders = frappe.get_all(
        "Restaurant Order",
        filters=filters,
        fields=["name", "order_time", "status", "priority", "order_type", 
                "table_number", "room_number", "customer_name", "total_amount"],
        order_by="order_time desc"
    )
    
    return orders

@frappe.whitelist()
def create_order_from_pos(items, customer_info, order_details):
    """Create restaurant order from POS"""
    try:
        items = json.loads(items) if isinstance(items, str) else items
        customer_info = json.loads(customer_info) if isinstance(customer_info, str) else customer_info
        order_details = json.loads(order_details) if isinstance(order_details, str) else order_details
        
        # Create new order
        order = frappe.new_doc("Restaurant Order")
        order.customer_name = customer_info.get("customer_name")
        order.mobile_no = customer_info.get("mobile_no")
        order.order_type = order_details.get("order_type", "Dine In")
        order.table_number = order_details.get("table_number")
        order.room_number = order_details.get("room_number")
        order.waiter = order_details.get("waiter")
        order.kitchen_notes = order_details.get("kitchen_notes")
        order.special_instructions = order_details.get("special_instructions")
        
        # Add items
        for item in items:
            order.append("items", {
                "item": item.get("item_code"),
                "item_name": item.get("item_name"),
                "qty": item.get("qty"),
                "rate": item.get("rate")
            })
        
        order.save()
        
        # Broadcast to kitchen
        frappe.publish_realtime(
            event="new_order",
            message={
                "order_id": order.name,
                "order_type": order.order_type,
                "table_number": order.table_number,
                "room_number": order.room_number
            },
            room="kitchen_display"
        )
        
        return {"status": "success", "order_id": order.name}
        
    except Exception as e:
        frappe.log_error(f"Error creating order from POS: {str(e)}")
        return {"status": "error", "message": str(e)}