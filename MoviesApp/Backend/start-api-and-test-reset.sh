#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Movies API for password reset testing...${NC}"
echo -e "${BLUE}Make sure you have Node.js installed for the test scripts.${NC}"
echo ""

# Install node-fetch if not already installed
echo -e "${YELLOW}Installing required npm packages...${NC}"
npm install --prefix ./MoviesApp/Backend node-fetch

# Ask user for test email
echo ""
echo -e "${YELLOW}Enter email address to test password reset:${NC}"
read email_address

# Update the test file with the provided email
sed -i '' "s/test@example.com/$email_address/g" ./MoviesApp/Backend/test-forgot-password.js

# Set environment to Development to see the reset token in console
export ASPNETCORE_ENVIRONMENT=Development

# Start the API in the background
echo -e "${YELLOW}Starting API server...${NC}"
cd MoviesApp/Backend/MoviesApp.API
dotnet run &
api_pid=$!

# Wait for the API to start up
echo -e "${YELLOW}Waiting for API to start (15 seconds)...${NC}"
sleep 15

# Run the forgot password test
echo -e "${GREEN}Running forgot password test...${NC}"
cd ../../..
node MoviesApp/Backend/test-forgot-password.js

echo ""
echo -e "${YELLOW}Check the above output for the password reset link.${NC}"
echo -e "${YELLOW}If you received a reset token, you can use test-reset-password.js to complete the process.${NC}"
echo -e "${YELLOW}Edit the script and replace 'your-token-here' with the actual token from the email/console.${NC}"

# Ask if user wants to stop the API
echo ""
echo -e "${YELLOW}Press any key to stop the API server or Ctrl+C to leave it running...${NC}"
read -n 1

# Kill the API process
kill $api_pid
echo -e "${GREEN}API server stopped.${NC}"
