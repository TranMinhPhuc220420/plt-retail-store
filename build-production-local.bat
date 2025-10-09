@echo off
REM Build frontend locally then deploy to VPS
REM Use this if your VPS has limited RAM

echo ====================================
echo Building Frontend Locally
echo ====================================

cd frontend-plt

echo Installing dependencies...
call npm ci

echo Building application...
call npm run build

if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

echo ====================================
echo Build successful!
echo ====================================
echo.
echo Next steps:
echo 1. Copy the 'dist' folder to your VPS
echo 2. Run: scp -r dist/ user@your-vps:/path/to/project/frontend-plt/
echo 3. On VPS, build only backend: docker compose build --no-cache backend
echo 4. Deploy: docker compose up -d
echo.

cd ..
pause
