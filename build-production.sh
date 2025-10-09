#!/bin/bash

# Production build script with automatic cleanup and enhanced monitoring
echo "🔄 Starting production build with cleanup and optimization..."

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

# Function to check system resources
check_resources() {
    echo "💾 Checking system resources..."
    
    # Check available memory
    if command -v free &> /dev/null; then
        free -h
        
        # Get available memory in MB
        available_mem=$(free -m | awk '/^Mem:/{print $7}')
        
        if [ "$available_mem" -lt 10240 ]; then
            echo "⚠️  WARNING: Available memory is less than 10GB ($available_mem MB)"
            echo "   Recommended: 12-16GB RAM for optimal build performance"
            echo "   The build may fail due to insufficient memory"
            read -p "   Continue anyway? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        else
            echo "✅ Sufficient memory available: $available_mem MB"
        fi
    fi
    
    # Check disk space
    echo "💿 Disk space:"
    df -h . | tail -1
    
    # Check Docker info
    echo "🐳 Docker system info:"
    docker system df || echo "Docker system df not available"
}

# Function to build with retry and better error handling
build_with_retry() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo ""
        echo "🚀 Build attempt $attempt/$max_attempts"
        echo "================================================"
        
        # Enable BuildKit for better caching and performance
        export DOCKER_BUILDKIT=1
        export COMPOSE_DOCKER_CLI_BUILD=1
        
        # Record start time
        start_time=$(date +%s)
        
        # Try to build with no-cache for clean build
        if docker compose -f docker-compose.yml build --no-cache; then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            
            echo ""
            echo "================================================"
            echo "✅ Build successful on attempt $attempt"
            echo "⏱️  Build duration: $duration seconds"
            echo "================================================"
            
            # Show image sizes
            echo ""
            echo "📦 Image sizes:"
            docker images | grep -E "plt-(frontend|backend)" || echo "Images not found"
            
            return 0
        else
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            
            echo ""
            echo "================================================"
            echo "❌ Build failed on attempt $attempt"
            echo "⏱️  Failed after: $duration seconds"
            echo "================================================"
            
            # Check for OOM killer
            if dmesg | tail -20 | grep -i "killed process" > /dev/null 2>&1; then
                echo "💥 DETECTED: Process killed by OOM (Out of Memory) killer"
                echo "   See DOCKER_BUILD_OPTIMIZATION.md for solutions"
            fi
            
            if [ $attempt -lt $max_attempts ]; then
                echo ""
                echo "🔄 Cleaning up before retry..."
                cleanup_docker
                
                echo "⏳ Waiting 15 seconds before retry..."
                sleep 15
            fi
            
            ((attempt++))
        fi
    done
    
    echo ""
    echo "💥 Build failed after $max_attempts attempts"
    echo "📖 Please review DOCKER_BUILD_OPTIMIZATION.md for troubleshooting"
    return 1
}

# Main execution
echo "================================================"
echo "  PLT Retail Store - Production Build"
echo "================================================"
echo ""

# Check resources first
check_resources

echo ""
echo "🧹 Initial cleanup..."
cleanup_docker

echo ""
echo "🏗️  Starting build process..."

# Build with retry mechanism
if build_with_retry; then
    echo ""
    echo "================================================"
    echo "🎉 Production build completed successfully!"
    echo "================================================"
    echo ""
    echo "🚀 Starting services..."
    
    if docker compose -f docker-compose.yml up -d; then
        echo ""
        echo "✅ Services started successfully"
        echo ""
        echo "🔍 Service status:"
        docker compose -f docker-compose.yml ps
        echo ""
        echo "📊 To view logs: docker compose -f docker-compose.yml logs -f"
        echo "🛑 To stop: docker compose -f docker-compose.yml down"
    else
        echo "❌ Failed to start services"
        exit 1
    fi
else
    echo ""
    echo "================================================"
    echo "💥 Production build failed after all retries"
    echo "================================================"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check DOCKER_BUILD_OPTIMIZATION.md"
    echo "2. Verify system has 12-16GB RAM available"
    echo "3. Check Docker logs: docker compose logs frontend"
    echo "4. Review system logs: dmesg | grep -i kill"
    exit 1
fi
