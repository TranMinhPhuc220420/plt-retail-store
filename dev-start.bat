@echo off
REM Development Docker Management Script for PLT Retail Store

set COMPOSE_FILE=docker-compose.dev.yml

echo Starting PLT Retail Store Development Environment...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Stop any existing containers
echo Stopping existing containers...
docker-compose -f %COMPOSE_FILE% down

REM Build images
echo Building development images...
docker-compose -f %COMPOSE_FILE% build

REM Start services
echo Starting services...
docker-compose -f %COMPOSE_FILE% up -d

REM Show status
echo.
echo Services status:
docker-compose -f %COMPOSE_FILE% ps

echo.
echo Development environment is starting up...
echo.
echo Services will be available at:
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:5000
echo - MongoDB:  mongodb://localhost:27017
echo.
echo To view logs: docker-compose -f %COMPOSE_FILE% logs -f
echo To stop:      docker-compose -f %COMPOSE_FILE% down
echo.
pause
