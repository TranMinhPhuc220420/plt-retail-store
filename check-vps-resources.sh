#!/bin/bash

# Script to check VPS resources and recommend build strategy
# Usage: ./check-vps-resources.sh

echo "================================================"
echo "VPS Resource Checker for Production Build"
echo "================================================"
echo ""

# Check if running with root/sudo
if [ "$EUID" -eq 0 ]; then
    IS_ROOT=true
else
    IS_ROOT=false
fi

# 1. Check Memory
echo "1. Memory Status:"
echo "-------------------"
free -h
echo ""

TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}')
SWAP_MEM=$(free -m | awk '/^Swap:/{print $2}')

echo "Total Memory: ${TOTAL_MEM}MB"
echo "Available Memory: ${AVAILABLE_MEM}MB"
echo "Swap Memory: ${SWAP_MEM}MB"
echo ""

# 2. Check Disk
echo "2. Disk Space:"
echo "-------------------"
df -h /
echo ""

DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')
echo "Available Disk Space: $DISK_AVAILABLE"
echo ""

# 3. Check Docker
echo "3. Docker Status:"
echo "-------------------"
if command -v docker &> /dev/null; then
    echo "Docker is installed"
    docker --version
    echo ""
    echo "Docker disk usage:"
    docker system df
else
    echo "Docker is not installed!"
    exit 1
fi
echo ""

# 4. Check current containers
echo "4. Running Containers:"
echo "-------------------"
RUNNING_CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
if [ -n "$RUNNING_CONTAINERS" ]; then
    echo "$RUNNING_CONTAINERS"
else
    echo "No containers running"
fi
echo ""

# 5. Recommendations
echo "================================================"
echo "BUILD STRATEGY RECOMMENDATIONS"
echo "================================================"
echo ""

if [ $TOTAL_MEM -lt 1024 ]; then
    echo "⚠️  CRITICAL: Very low memory (< 1GB)"
    echo "   Strategy: BUILD LOCALLY (build-production-local.bat)"
    echo "   - Your VPS cannot build Vite projects"
    echo "   - Build on your local machine"
    echo "   - Copy dist folder to VPS"
    echo "   - Use docker-compose.prebuilt.yml"
    echo ""
    
elif [ $TOTAL_MEM -lt 2048 ]; then
    echo "⚠️  WARNING: Low memory (1-2GB)"
    if [ $SWAP_MEM -lt 2048 ]; then
        echo "   Strategy: ADD SWAP MEMORY FIRST"
        echo ""
        echo "   Run these commands:"
        if [ "$IS_ROOT" = true ]; then
            echo "   fallocate -l 4G /swapfile"
            echo "   chmod 600 /swapfile"
            echo "   mkswap /swapfile"
            echo "   swapon /swapfile"
            echo "   echo '/swapfile none swap sw 0 0' >> /etc/fstab"
        else
            echo "   sudo fallocate -l 4G /swapfile"
            echo "   sudo chmod 600 /swapfile"
            echo "   sudo mkswap /swapfile"
            echo "   sudo swapon /swapfile"
            echo "   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab"
        fi
        echo ""
        echo "   Then run: make prod-build-low-memory"
    else
        echo "   Strategy: USE LOW-MEMORY BUILD"
        echo "   Run: make prod-build-low-memory"
    fi
    echo ""
    
elif [ $TOTAL_MEM -lt 4096 ]; then
    echo "✓ OK: Moderate memory (2-4GB)"
    if [ $SWAP_MEM -lt 2048 ]; then
        echo "   Strategy: ADD SWAP for safety, then use optimized build"
        echo "   1. Add 2GB swap (optional but recommended)"
        echo "   2. Run: make prod-build-clean"
    else
        echo "   Strategy: USE OPTIMIZED BUILD"
        echo "   Run: make prod-build-clean"
    fi
    echo ""
    
else
    echo "✓ EXCELLENT: High memory (>4GB)"
    echo "   Strategy: USE STANDARD BUILD"
    echo "   Run: make prod-build-clean"
    echo "   Or: docker compose build --no-cache"
    echo ""
fi

# 6. Quick commands reference
echo "================================================"
echo "QUICK COMMANDS REFERENCE"
echo "================================================"
echo ""
echo "Clean Docker resources:"
echo "  docker system prune -af"
echo ""
echo "Monitor memory during build:"
echo "  watch -n 1 'free -h'"
echo ""
echo "Check build logs:"
echo "  docker compose logs frontend"
echo ""
echo "Stop all containers:"
echo "  docker compose down"
echo ""

# 7. Check if swap exists and offer to create
if [ $SWAP_MEM -eq 0 ] && [ $TOTAL_MEM -lt 4096 ]; then
    echo "================================================"
    echo "CREATE SWAP MEMORY?"
    echo "================================================"
    echo ""
    echo "Your system has no swap memory."
    echo "This is recommended for building on low-memory VPS."
    echo ""
    read -p "Do you want to create a 4GB swap file now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ "$IS_ROOT" = true ]; then
            echo "Creating swap file..."
            fallocate -l 4G /swapfile
            chmod 600 /swapfile
            mkswap /swapfile
            swapon /swapfile
            echo '/swapfile none swap sw 0 0' >> /etc/fstab
            echo "✓ Swap file created successfully!"
            free -h
        else
            echo "Creating swap file (requires sudo)..."
            sudo fallocate -l 4G /swapfile
            sudo chmod 600 /swapfile
            sudo mkswap /swapfile
            sudo swapon /swapfile
            echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
            echo "✓ Swap file created successfully!"
            free -h
        fi
    fi
fi

echo ""
echo "================================================"
echo "Check complete! Follow the recommendations above."
echo "================================================"
