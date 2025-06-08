from . import __version__ as app_version

app_name = "restaurant_hotel_management"
app_title = "Restaurant Hotel Management"
app_publisher = "Your Company"
app_description = "Comprehensive Restaurant and Hotel Management System for ERPNext"
app_email = "support@yourcompany.com"
app_license = "MIT"

# Includes in <head>
app_include_css = "/assets/restaurant_hotel_management/css/restaurant_hotel.css"
app_include_js = "/assets/restaurant_hotel_management/js/restaurant_hotel.js"

# include js, css files in header of desk.html
# app_include_css = "/assets/restaurant_hotel_management/css/restaurant_hotel.css"
# app_include_js = "/assets/restaurant_hotel_management/js/restaurant_hotel.js"

# include js, css files in header of web template
# web_include_css = "/assets/restaurant_hotel_management/css/restaurant_hotel.css"
# web_include_js = "/assets/restaurant_hotel_management/js/restaurant_hotel.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "restaurant_hotel_management/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
    "Sales Invoice": "public/js/sales_invoice.js",
    "POS Profile": "public/js/pos_profile.js"
}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ---------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "restaurant_hotel_management.utils.jinja_methods",
# 	"filters": "restaurant_hotel_management.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "restaurant_hotel_management.install.before_install"
# after_install = "restaurant_hotel_management.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "restaurant_hotel_management.uninstall.before_uninstall"
# after_uninstall = "restaurant_hotel_management.uninstall.after_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "restaurant_hotel_management.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
    "Sales Invoice": {
        "on_submit": "restaurant_hotel_management.restaurant_hotel_management.events.sales_invoice.on_submit"
    }
}

# Scheduled Tasks
# ---------------

scheduler_events = {
    "cron": {
        "*/5 * * * *": [
            "restaurant_hotel_management.restaurant_hotel_management.api.update_order_status"
        ]
    }
}

# Testing
# -------

# before_tests = "restaurant_hotel_management.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "restaurant_hotel_management.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "restaurant_hotel_management.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]


# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"restaurant_hotel_management.auth.validate"
# ]

fixtures = [
    {
        "doctype": "Custom Field",
        "filters": [
            [
                "name",
                "in",
                [
                    "Sales Invoice-order_type",
                    "Sales Invoice-table_number",
                    "Sales Invoice-room_number",
                    "Sales Invoice-waiter",
                    "Sales Invoice-kitchen_notes"
                ]
            ]
        ]
    }
]