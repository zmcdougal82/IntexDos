#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

AZURE_URL=""
EMAIL=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      AZURE_URL="$2"
      shift 2
      ;;
    --email)
      EMAIL="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check if required parameters are provided
if [[ -z "$AZURE_URL" ]]; then
  echo -e "${YELLOW}No Azure URL provided. Using default: https://cineniche.azurewebsites.net${NC}"
  AZURE_URL="https://cineniche.azurewebsites.net"
fi

if [[ -z "$EMAIL" ]]; then
  echo -e "${YELLOW}No email provided. Please enter the email address to test:${NC}"
  read EMAIL
  
  if [[ -z "$EMAIL" ]]; then
    echo -e "${RED}Email is required. Exiting.${NC}"
    exit 1
  fi
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  TESTING PASSWORD RESET ON AZURE DEPLOYMENT    ${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}Azure URL:${NC} $AZURE_URL"
echo -e "${YELLOW}Email:${NC} $EMAIL"
echo ""

# Install node-fetch if not already installed
echo -e "${YELLOW}Installing required npm packages...${NC}"
npm install --prefix ./MoviesApp/Backend node-fetch

# Running the forgot password test with environment variables
echo -e "${GREEN}Sending forgot password request...${NC}"
API_URL=$AZURE_URL EMAIL=$EMAIL node MoviesApp/Backend/test-forgot-password.js

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}              NEXT STEPS                        ${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}1. Check your email inbox (including spam folder) for the reset link${NC}"
echo -e "${YELLOW}2. Once you receive the email, extract the token from the reset link${NC}"
echo -e "${YELLOW}   The token is the part after 'token=' and before '&email=' in the URL${NC}"
echo ""
echo -e "${YELLOW}3. Run the reset-password script with:${NC}"
echo -e "${GREEN}   API_URL=$AZURE_URL EMAIL=$EMAIL TOKEN=your-token-here NEW_PASSWORD=YourNewPassword123 node MoviesApp/Backend/test-reset-password.js${NC}"
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}            TROUBLESHOOTING                     ${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}If you don't receive an email:${NC}"
echo -e "1. Check the Azure application logs for errors"
echo -e "2. Verify SparkPost settings in your Azure configuration"
echo -e "3. Ensure 'AppSettings:BaseUrl' is correctly set to '$AZURE_URL'"
echo -e "4. Verify the mail.cineniche.co domain is properly configured in SparkPost"
echo ""
echo -e "${YELLOW}If you can't reset your password:${NC}"
echo -e "1. Make sure you're using the correct token from the email"
echo -e "2. Ensure the token hasn't expired (tokens are valid for 1 hour)"
echo -e "3. Check that the email address matches the one you requested the reset for"
echo ""
