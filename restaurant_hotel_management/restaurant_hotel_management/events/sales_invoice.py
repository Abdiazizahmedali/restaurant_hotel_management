import frappe

def on_submit(doc, method):
    """Handle sales invoice submission for restaurant orders"""
    if hasattr(doc, 'custom_order_type') and doc.custom_order_type:
        # Update linked restaurant order if exists
        restaurant_orders = frappe.get_all(
            'Restaurant Order',
            filters={'sales_invoice': doc.name},
            fields=['name']
        )
        
        for order in restaurant_orders:
            # Update payment status
            restaurant_order = frappe.get_doc('Restaurant Order', order.name)
            restaurant_order.paid_amount = doc.grand_total
            restaurant_order.save()
            
            # Notify kitchen about payment completion
            frappe.publish_realtime(
                event="order_paid",
                message={
                    "order_id": order.name,
                    "invoice_id": doc.name,
                    "amount": doc.grand_total
                },
                room="kitchen_display"
            )