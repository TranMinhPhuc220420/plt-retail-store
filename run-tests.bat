@echo off
setlocal enabledelayedexpansion

echo ========================================
echo PLT Retail Store - Test Suite Runner
echo ========================================
echo.

REM Backend Tests
echo Running Backend Tests...
cd backend-plt-2

call npm test
set BACKEND_RESULT=%ERRORLEVEL%

if %BACKEND_RESULT% equ 0 (
    echo [92m✅ Backend tests passed![0m
) else (
    echo [91m❌ Backend tests failed![0m
)

echo.
cd ..

REM Frontend Tests
echo Running Frontend Tests...
cd frontend-plt

call npm test
set FRONTEND_RESULT=%ERRORLEVEL%

if %FRONTEND_RESULT% equ 0 (
    echo [92m✅ Frontend tests passed![0m
) else (
    echo [91m❌ Frontend tests failed![0m
)

cd ..

REM Summary
echo.
echo ========================================
echo Test Results Summary
echo ========================================

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

REM Exit with error if any tests failed
if %BACKEND_RESULT% neq 0 goto :failed
if %FRONTEND_RESULT% neq 0 goto :failed

echo [92m🎉 All tests passed![0m
exit /b 0

:failed
echo [91m❌ Some tests failed![0m
exit /b 1
