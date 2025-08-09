#!/bin/bash

# Production deployment script for PLT Retail Store
# This script handles the storage permission fix deployment

set -e

echo "================================================"
echo "PLT Retail Store - Production Deployment"
echo "Storage Permission Fix"
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker and docker compose are available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    print_error "Docker Compose (plugin) is not installed or not in PATH"
    exit 1
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker compose down || true

# Remove old backend image to force rebuild
print_status "Removing old backend image..."
docker rmi plt-retail-store-backend:latest || true

# Build new images with storage permission fixes
print_status "Building updated backend image..."
docker compose build backend

# Start services
print_status "Starting services..."
docker compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service status
print_status "Checking service status..."
docker compose ps

# Test storage permissions
print_status "Testing storage permissions..."
docker exec plt-backend sh -c "
    echo 'Testing write permissions...'
    touch /app/storage/stores/avatars/test-permission.txt 2>/dev/null && 
    rm /app/storage/stores/avatars/test-permission.txt 2>/dev/null && 
    echo 'SUCCESS: Storage permissions are working correctly!' || 
    echo 'ERROR: Storage permissions are still not working'
"

# Show logs for verification
print_status "Showing recent backend logs..."
docker logs plt-backend --tail 20

print_status "Deployment completed!"
print_status "Your application should now be running with fixed storage permissions."
print_warning "Monitor the logs to ensure file uploads are working correctly."

echo ""
echo "================================================"
echo "Useful commands for monitoring:"
echo "  docker compose logs -f backend    # View backend logs"
echo "  docker compose ps                 # Check service status"
echo "  docker exec plt-backend ls -la /app/storage/  # Check storage permissions"
echo "================================================"
