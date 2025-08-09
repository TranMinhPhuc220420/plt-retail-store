#!/bin/bash

# Fix SKU Index Issue on Production
# This script will run the migration to fix the SKU duplicate key error

echo "🚀 Starting SKU index fix on production..."

# Check if running in production environment
if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  MONGODB_URI not set, using default production values"
    export MONGODB_URI="mongodb://admin:password123@plt-mongodb:27017/retail_store_plt?authSource=admin"
fi

# Run the migration script inside the backend container
echo "📝 Running SKU index fix migration..."

docker exec -it plt-backend node fix-sku-simple.js

if [ $? -eq 0 ]; then
    echo "✅ SKU index fix completed successfully!"
    echo "🔄 You may want to restart the backend service:"
    echo "   docker-compose restart plt-backend"
else
    echo "❌ SKU index fix failed!"
    echo "📋 Please check the logs above for details"
    exit 1
fi
