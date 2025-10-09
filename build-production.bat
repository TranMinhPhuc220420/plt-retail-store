@echo off
REM Production build script with automatic cleanup and enhanced monitoring for Windows
setlocal enabledelayedexpansion

echo ================================================
echo   PLT Retail Store - Production Build
echo ================================================
echo.

REM Function to cleanup Docker resources
:cleanup_docker
echo 🧹 Cleaning up Docker resources...

REM Stop and remove containers
docker compose -f docker-compose.yml down --remove-orphans

REM Remove unused Docker resources but keep some cache
docker system prune -f --volumes

REM Remove only dangling images
docker image prune -f

echo ✅ Docker cleanup completed
goto :eof

REM Check system resources
echo 💾 Checking system resources...
echo.
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:list
echo.

REM Check disk space
echo 💿 Disk space:
wmic logicaldisk get caption,freespace,size /format:list | findstr /i "C:"
echo.

REM Initial cleanup
call :cleanup_docker
echo.

REM Enable BuildKit for better caching
set DOCKER_BUILDKIT=1
set COMPOSE_DOCKER_CLI_BUILD=1

echo 🏗️  Starting build process...
echo ================================================
echo.

REM Build attempt 1
echo 🚀 Build attempt 1/3
set BUILD_START=%time%
docker compose -f docker-compose.yml build --no-cache

if %ERRORLEVEL% EQU 0 (
    set BUILD_END=%time%
    echo.
    echo ================================================
    echo ✅ Build successful!
    echo ⏱️  Build completed at: !BUILD_END!
    echo ================================================
    echo.
    
    echo 📦 Image sizes:
    docker images | findstr "plt-"
    echo.
    
    echo 🚀 Starting services...
    docker compose -f docker-compose.yml up -d
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ Services started successfully
        echo.
        echo 🔍 Service status:
        docker compose -f docker-compose.yml ps
        echo.
        echo 📊 To view logs: docker compose -f docker-compose.yml logs -f
        echo 🛑 To stop: docker compose -f docker-compose.yml down
        goto :end_success
    ) else (
        echo ❌ Failed to start services
        exit /b 1
    )
) else (
    echo.
    echo ================================================
    echo ❌ Build failed on attempt 1
    echo ================================================
    echo.
    
    echo 🔄 Trying full cleanup and rebuild...
    echo.
    
    REM Full cleanup
    docker compose -f docker-compose.yml down --rmi all
    docker system prune -af
    
    echo ⏳ Waiting 15 seconds before retry...
    timeout /t 15 /nobreak >nul
    echo.
    
    REM Build attempt 2
    echo 🚀 Build attempt 2/3
    docker compose -f docker-compose.yml build --no-cache
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ================================================
        echo ✅ Build successful after cleanup!
        echo ================================================
        echo.
        
        docker compose -f docker-compose.yml up -d
        
        if %ERRORLEVEL% EQU 0 (
            echo ✅ Services started successfully
            goto :end_success
        ) else (
            echo ❌ Failed to start services
            exit /b 1
        )
    ) else (
        echo.
        echo ================================================
        echo 💥 Build failed after 2 attempts
        echo ================================================
        echo.
        echo Troubleshooting steps:
        echo 1. Check DOCKER_BUILD_OPTIMIZATION.md
        echo 2. Verify system has 12-16GB RAM available
        echo 3. Check Docker Desktop settings - increase memory limit
        echo 4. Review Docker logs: docker compose logs frontend
        echo 5. Restart Docker Desktop and try again
        echo.
        exit /b 1
    )
)

:end_success
echo.
echo ================================================
echo 🎉 Production deployment completed!
echo ================================================
exit /b 0
