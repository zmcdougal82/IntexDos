#!/bin/bash
# Script to test the complete password reset flow using Mailgun

# ANSI color codes for output formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}      MAILGUN PASSWORD RESET TEST SCRIPT          ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "${YELLOW}This script will:${NC}"
echo -e "1. Start the API in development mode"
echo -e "2. Run the forgot password test"
echo -e "3. Provide instructions for completing the reset process"
echo ""

# Prompt for email to test
read -p "Enter email address to test: " EMAIL

# Check if email was provided
if [ -z "$EMAIL" ]; then
    echo -e "${YELLOW}No email provided. Using default: test@example.com${NC}"
    EMAIL="test@example.com"
fi

echo -e "\n${GREEN}Starting API in development mode...${NC}"
echo -e "${YELLOW}(Keep this terminal window open)${NC}\n"

# Start the API server in a new terminal window/tab
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && cd MoviesApp/Backend/MoviesApp.API && ASPNETCORE_ENVIRONMENT=Development dotnet run\""
else
    # Linux/WSL
    gnome-terminal -- bash -c "cd $(pwd)/MoviesApp/Backend/MoviesApp.API && ASPNETCORE_ENVIRONMENT=Development dotnet run; read -p 'Press enter to close...'"
fi

# Wait for the API to start
echo -e "${YELLOW}Waiting for API to start (15 seconds)...${NC}"
sleep 15

# Run the forgot password test
echo -e "\n${GREEN}Running forgot password test...${NC}"
node MoviesApp/Backend/test-mailgun-forgot-password.js "$EMAIL"

echo -e "\n${GREEN}Password reset initiated!${NC}"
echo -e "${YELLOW}Instructions:${NC}"
echo -e "1. Check the API terminal for the reset link (in development mode)"
echo -e "2. Copy the token from the reset link"
echo -e "3. Run the following command to complete the reset:"
echo -e "${BLUE}   node MoviesApp/Backend/test-mailgun-reset-password.js $EMAIL your-token-here your-new-password${NC}"
echo -e "\n${YELLOW}Note: The reset token is valid for 1 hour${NC}"
