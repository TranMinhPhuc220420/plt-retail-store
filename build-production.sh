#!/bin/bash

# Production build script with automatic cleanup
echo "🔄 Starting production build with cleanup..."

# Function to cleanup Docker resources
cleanup_docker() {
    echo "🧹 Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker compose -f docker-compose.yml down --remove-orphans
    
    # Remove unused Docker resources but keep some cache
    docker system prune -f --volumes
    
    # Remove only dangling images (not all images)
    docker image prune -f
    
    echo "✅ Docker cleanup completed"
}

# Function to build with retry
build_with_retry() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "🚀 Build attempt $attempt/$max_attempts"
        
        # Try to build
        if docker compose -f docker-compose.yml build --no-cache; then
            echo "✅ Build successful on attempt $attempt"
            return 0
        else
            echo "❌ Build failed on attempt $attempt"
            
            if [ $attempt -lt $max_attempts ]; then
                echo "🔄 Cleaning up before retry..."
                cleanup_docker
                sleep 10
            fi
            
            ((attempt++))
        fi
    done
    
    echo "❌ Build failed after $max_attempts attempts"
    return 1
}

# Check available memory
echo "💾 Checking system resources..."
free -h || echo "Memory check not available"

# Cleanup first
cleanup_docker

# Build with retry mechanism
if build_with_retry; then
    echo "🎉 Production build completed successfully!"
    echo "🚀 Starting services..."
    docker compose -f docker-compose.yml up -d
else
    echo "💥 Production build failed after all retries"
    exit 1
fi
