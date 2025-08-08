@echo off
REM Docker cleanup script for PLT Retail Store Development

set COMPOSE_FILE=docker-compose.dev.yml

echo PLT Retail Store Docker Cleanup
echo.

echo Stopping and removing containers...
docker-compose -f %COMPOSE_FILE% down

echo Removing unused Docker resources...
docker system prune -f

echo Removing development images...
docker-compose -f %COMPOSE_FILE% down --rmi all

echo.
echo Cleanup completed!
echo.
pause
