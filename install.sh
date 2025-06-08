#!/bin/bash

# Restaurant Hotel Management Installation Script for ERPNext

echo "Installing Restaurant Hotel Management System..."

# Check if we're in a bench directory
if [ ! -f "sites/common_site_config.json" ]; then
    echo "Error: Please run this script from your ERPNext bench directory"
    exit 1
fi

# Get the site name
echo "Please enter your site name (e.g., mysite.localhost):"
read SITE_NAME

if [ -z "$SITE_NAME" ]; then
    echo "Error: Site name cannot be empty"
    exit 1
fi

# Install the app
echo "Installing restaurant_hotel_management app..."
bench --site $SITE_NAME install-app restaurant_hotel_management

# Run migrations
echo "Running database migrations..."
bench --site $SITE_NAME migrate

# Build assets
echo "Building assets..."
bench build --app restaurant_hotel_management

# Clear cache
echo "Clearing cache..."
bench --site $SITE_NAME clear-cache

# Restart bench
echo "Restarting bench..."
bench restart

echo "Installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Login to your ERPNext site"
echo "2. Go to User and Role Management to assign roles"
echo "3. Configure POS Profile for restaurant settings"
echo "4. Create menu items in Item Master"
echo "5. Access Kitchen Display via: Restaurant Management > Kitchen Display"
echo "6. Access Waiter Display via: Restaurant Management > Waiter Display"