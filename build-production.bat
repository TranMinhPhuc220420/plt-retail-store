@echo off
REM Production build script with automatic cleanup for Windows

echo 🔄 Starting production build with cleanup...

REM Function to cleanup Docker resources
echo 🧹 Cleaning up Docker resources...

REM Stop and remove containers
docker compose -f docker-compose.yml down --remove-orphans

REM Remove unused Docker resources but keep some cache
docker system prune -f --volumes

REM Remove only dangling images
docker image prune -f

echo ✅ Docker cleanup completed

REM Check available memory (Windows)
echo 💾 Checking system resources...
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:list

REM Build with no-cache to avoid cache issues
echo 🚀 Building with no-cache...
docker compose -f docker-compose.yml build --no-cache

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build successful!
    echo 🚀 Starting services...
    docker compose -f docker-compose.yml up -d
) else (
    echo ❌ Build failed. Trying full cleanup and rebuild...
    
    REM Full cleanup
    docker compose -f docker-compose.yml down --rmi all
    docker system prune -af
    
    REM Retry build
    echo 🔄 Retrying build after full cleanup...
    docker compose -f docker-compose.yml build --no-cache
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Build successful after cleanup!
        docker compose -f docker-compose.yml up -d
    ) else (
        echo 💥 Build failed even after full cleanup
        exit /b 1
    )
)

echo 🎉 Production deployment completed!
