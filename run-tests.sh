#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}PLT Retail Store - Test Suite Runner${NC}"
echo -e "${YELLOW}========================================${NC}"
echo

# Backend Tests
echo -e "${YELLOW}Running Backend Tests...${NC}"
cd backend-plt-2

if npm test; then
    echo -e "${GREEN}✅ Backend tests passed!${NC}"
    BACKEND_RESULT=0
else
    echo -e "${RED}❌ Backend tests failed!${NC}"
    BACKEND_RESULT=1
fi

echo
cd ..

# Frontend Tests
echo -e "${YELLOW}Running Frontend Tests...${NC}"
cd frontend-plt

if npm test; then
    echo -e "${GREEN}✅ Frontend tests passed!${NC}"
    FRONTEND_RESULT=0
else
    echo -e "${RED}❌ Frontend tests failed!${NC}"
    FRONTEND_RESULT=1
fi

cd ..

# Summary
echo
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Results Summary${NC}"
echo -e "${YELLOW}========================================${NC}"

if [ $BACKEND_RESULT -eq 0 ]; then
    echo -e "Backend:  ${GREEN}✅ PASSED${NC}"
else
    echo -e "Backend:  ${RED}❌ FAILED${NC}"
fi

if [ $FRONTEND_RESULT -eq 0 ]; then
    echo -e "Frontend: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Frontend: ${RED}❌ FAILED${NC}"
fi

echo

# Exit with error if any tests failed
if [ $BACKEND_RESULT -ne 0 ] || [ $FRONTEND_RESULT -ne 0 ]; then
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
else
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
fi
