#!/bin/bash

# PLT Retail Store Production Deployment Script
# Server: retail-store-plt-ceca (103.90.227.74)
# Domain: https://retail-store.server.plt.pro.vn

set -e

echo "🚀 Starting PLT Retail Store Production Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your production values before continuing."
    echo "   Pay special attention to:"
    echo "   - MONGO_ROOT_PASSWORD"
    echo "   - SESSION_SECRET"
    echo "   - JWT_SECRET"
    echo "   - Google OAuth credentials (if using)"
    read -p "Press Enter after editing .env file..."
fi

# Source environment variables
source .env

# Validate required environment variables
required_vars=("MONGO_ROOT_PASSWORD" "SESSION_SECRET" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set in .env"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Create backup directory
mkdir -p /opt/backups

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Pull latest images and build
echo "🔨 Building Docker images..."
docker-compose build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check backend health
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend health
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

# Check MongoDB health
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB is healthy"
else
    echo "❌ MongoDB health check failed"
    docker-compose logs mongodb
    exit 1
fi

echo "🎉 Deployment successful!"
echo ""
echo "📋 Service Information:"
echo "   - Frontend: http://localhost:8080"
echo "   - Backend API: http://localhost:5000"
echo "   - MongoDB: localhost:27017"
echo ""
echo "🌐 Public URLs (after nginx setup):"
echo "   - Website: https://retail-store.server.plt.pro.vn"
echo "   - API: https://retail-store.server.plt.pro.vn/api"
echo ""
echo "📊 Check status with:"
echo "   docker-compose ps"
echo "   docker-compose logs -f"
echo ""
echo "⚠️  Remember to:"
echo "   1. Set up nginx reverse proxy for SSL"
echo "   2. Configure firewall (ports 80, 443)"
echo "   3. Set up SSL certificates with Let's Encrypt"
echo "   4. Configure automated backups"
echo ""
echo "📖 See PRODUCTION_DEPLOYMENT_PLT.md for detailed instructions"
