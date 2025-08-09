@echo off
echo ================================================
echo PLT Retail Store - Production Deployment
echo Storage Permission Fix
echo ================================================

echo [INFO] Stopping existing containers...
docker-compose down

echo [INFO] Removing old backend image...
docker rmi plt-retail-store-backend:latest 2>nul

echo [INFO] Building updated backend image...
docker-compose build backend

echo [INFO] Starting services...
docker-compose up -d

echo [INFO] Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

echo [INFO] Checking service status...
docker-compose ps

echo [INFO] Testing storage permissions...
docker exec plt-backend sh -c "touch /app/storage/stores/avatars/test-permission.txt 2>/dev/null && rm /app/storage/stores/avatars/test-permission.txt 2>/dev/null && echo 'SUCCESS: Storage permissions are working correctly!' || echo 'ERROR: Storage permissions are still not working'"

echo [INFO] Showing recent backend logs...
docker logs plt-backend --tail 20

echo [INFO] Deployment completed!
echo [INFO] Your application should now be running with fixed storage permissions.
echo [WARNING] Monitor the logs to ensure file uploads are working correctly.

echo.
echo ================================================
echo Useful commands for monitoring:
echo   docker-compose logs -f backend    # View backend logs
echo   docker-compose ps                 # Check service status
echo   docker exec plt-backend ls -la /app/storage/  # Check storage permissions
echo ================================================
pause
