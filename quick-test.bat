@echo off
setlocal enabledelayedexpansion

REM Quick test runner for development
echo [96m========================================[0m
echo [96mPLT Retail Store - Quick Test Runner[0m
echo [96m========================================[0m
echo.

REM Check if specific test type is requested
if "%1"=="backend" goto :backend_only
if "%1"=="frontend" goto :frontend_only
if "%1"=="unit" goto :unit_only
if "%1"=="watch" goto :watch_mode

REM Default: Run all tests quickly
echo [93mRunning quick test suite...[0m
echo.

REM Backend Tests (unit only for speed)
echo [93m[1/2] Backend Unit Tests...[0m
cd backend-plt-2
call npm run test:unit -- --silent
set BACKEND_RESULT=%ERRORLEVEL%
cd ..

REM Frontend Tests
echo [93m[2/2] Frontend Tests...[0m
cd frontend-plt
call npm test -- --run --reporter=basic
set FRONTEND_RESULT=%ERRORLEVEL%
cd ..

goto :summary

:backend_only
echo [93mRunning Backend Tests Only...[0m
cd backend-plt-2
call npm test
cd ..
goto :end

:frontend_only
echo [93mRunning Frontend Tests Only...[0m
cd frontend-plt
call npm test -- --run
cd ..
goto :end

:unit_only
echo [93mRunning Unit Tests Only...[0m
cd backend-plt-2
call npm run test:unit
cd ..
goto :end

:watch_mode
echo [93mStarting Watch Mode...[0m
echo [93mChoose: [1] Backend [2] Frontend[0m
set /p choice="Enter choice: "
if "%choice%"=="1" (
    cd backend-plt-2
    call npm run test:watch
) else (
    cd frontend-plt
    call npm test
)
goto :end

:summary
echo.
echo [96m========================================[0m
echo [96mQuick Test Results[0m
echo [96m========================================[0m

if %BACKEND_RESULT% equ 0 (
    echo Backend:  [92m✅ PASSED[0m
) else (
    echo Backend:  [91m❌ FAILED[0m
)

if %FRONTEND_RESULT% equ 0 (
    echo Frontend: [92m✅ PASSED[0m
) else (
    echo Frontend: [91m❌ FAILED[0m
)

echo.
if %BACKEND_RESULT% equ 0 if %FRONTEND_RESULT% equ 0 (
    echo [92m🚀 All tests passed! Ready to commit.[0m
) else (
    echo [91m🔧 Some tests failed. Please fix before committing.[0m
)

:end
echo.
echo [96mUsage: quick-test.bat [backend|frontend|unit|watch][0m
exit /b 0
