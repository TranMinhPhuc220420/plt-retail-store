@echo off
echo === PLT Retail Store - Production Route Fix Deployment ===
echo Fixing 404 errors for avatar images...

REM Step 1: Stop existing services
echo 🛑 Stopping existing services...
docker-compose down

REM Step 2: Remove old backend image to force rebuild
echo 🗑️ Removing old backend image...
docker rmi plt-retail-store-backend:latest 2>nul

REM Step 3: Build new backend image with fixes
echo 🔨 Building new backend image...
docker-compose build backend

REM Step 4: Check storage volume
echo 📁 Checking storage volume...
docker volume ls | find "plt_storage" >nul || echo Creating new storage volume...

REM Step 5: Start services
echo 🚀 Starting services...
docker-compose up -d

REM Step 6: Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Step 7: Check service health
echo 🔍 Checking service health...
docker-compose ps

REM Step 8: Check backend logs for any errors
echo 📋 Backend logs (last 10 lines):
docker logs plt-backend --tail 10

echo.
echo ✅ Deployment completed!
echo.
echo 🔧 Route fixes applied:
echo    - Removed conflicting static route in app.js
echo    - All /p/* routes now go through API handlers
echo    - Static files served via sendFile() with proper error handling
echo.
echo 🧪 To test the fix:
echo    1. Check if existing images load: curl https://lionking.vn/p/stores/[filename]
echo    2. Upload a new avatar and verify it's accessible
echo    3. Check backend logs: docker logs plt-backend
echo.
echo 💡 If 404 errors persist, check:
echo    - File exists in storage volume: docker exec plt-backend ls -la /app/storage/stores/avatars/
echo    - Database has image record: Check Image collection in MongoDB
echo    - Container permissions: docker exec plt-backend whoami

pause
