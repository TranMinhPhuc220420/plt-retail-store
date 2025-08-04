@REM Open two command prompts
@REM cd to backend-plt-2 and frontend-plt
@REM run npm commands "npm run dev" in each
@echo off

start cmd /k "cd backend-plt-2 && npm run dev"
start cmd /k "cd frontend-plt && npm run dev"

@echo on
echo Both servers are now running.
