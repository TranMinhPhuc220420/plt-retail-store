@echo off
setlocal enabledelayedexpansion

REM Full test suite with coverage
echo [96m========================================[0m
echo [96mPLT Retail Store - Full Test Suite[0m
echo [96m========================================[0m
echo.

echo [93mStarting comprehensive test suite with coverage...[0m
echo.

REM Backend Tests with Coverage
echo [93m[1/3] Backend Tests with Coverage...[0m
cd backend-plt-2
call npm run test:coverage
set BACKEND_RESULT=%ERRORLEVEL%
echo.

REM Frontend Tests with Coverage
echo [93m[2/3] Frontend Tests with Coverage...[0m
cd ..\frontend-plt
call npm run test:coverage
set FRONTEND_RESULT=%ERRORLEVEL%
echo.

REM Generate Combined Coverage Report
echo [93m[3/3] Generating Combined Coverage Report...[0m
cd ..

REM Create coverage summary
echo [96m========================================[0m > test-results.txt
echo PLT Retail Store - Test Results Summary >> test-results.txt
echo Generated on: %date% %time% >> test-results.txt
echo [96m========================================[0m >> test-results.txt
echo. >> test-results.txt

if %BACKEND_RESULT% equ 0 (
    echo Backend Tests: PASSED >> test-results.txt
) else (
    echo Backend Tests: FAILED >> test-results.txt
)

if %FRONTEND_RESULT% equ 0 (
    echo Frontend Tests: PASSED >> test-results.txt
) else (
    echo Frontend Tests: FAILED >> test-results.txt
)

echo. >> test-results.txt
echo Coverage Reports Generated: >> test-results.txt
echo - Backend: backend-plt-2/coverage/ >> test-results.txt
echo - Frontend: frontend-plt/coverage/ >> test-results.txt

REM Display results
echo [96m========================================[0m
echo [96mFull Test Suite Results[0m
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
echo [96mCoverage Reports:[0m
echo - Backend:  backend-plt-2/coverage/lcov-report/index.html
echo - Frontend: frontend-plt/coverage/index.html

echo.
if %BACKEND_RESULT% equ 0 if %FRONTEND_RESULT% equ 0 (
    echo [92m🎉 All tests passed with coverage reports generated![0m
    echo [92m📊 Review coverage reports for quality insights.[0m
) else (
    echo [91m🔧 Some tests failed. Check logs and fix issues.[0m
)

echo.
echo [93mTest results summary saved to: test-results.txt[0m

REM Open coverage reports if all tests passed
if %BACKEND_RESULT% equ 0 if %FRONTEND_RESULT% equ 0 (
    echo.
    set /p open_coverage="Open coverage reports? (y/N): "
    if /i "!open_coverage!"=="y" (
        start backend-plt-2\coverage\lcov-report\index.html
        start frontend-plt\coverage\index.html
    )
)

exit /b 0
