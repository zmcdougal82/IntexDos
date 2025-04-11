#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}     SPARKPOST EMAIL DIAGNOSTICS & TESTING      ${NC}"
echo -e "${BLUE}================================================${NC}"

# Install dependencies if needed
echo -e "${YELLOW}Checking for required npm packages...${NC}"
npm list node-fetch || npm install --prefix ./MoviesApp/Backend node-fetch

# Function to run the main diagnostic tool
run_diagnostics() {
  echo ""
  echo -e "${YELLOW}Enter your email address for testing:${NC}"
  read email_address
  
  if [[ -z "$email_address" ]]; then
    echo -e "${RED}Email is required. Exiting.${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Would you like verbose output? (y/n)${NC}"
  read verbose
  
  if [[ "$verbose" == "y" || "$verbose" == "Y" ]]; then
    verbose_flag="--verbose"
  else
    verbose_flag=""
  fi
  
  echo -e "${GREEN}Running SparkPost diagnostics...${NC}"
  echo ""
  node MoviesApp/Backend/sparkpost-diagnostic.js --email "$email_address" $verbose_flag
}

# Function to try an alternative domain
try_alternative_domain() {
  echo ""
  echo -e "${GREEN}Running alternative domain test tool...${NC}"
  echo ""
  node MoviesApp/Backend/try-alternative-domain.js
}

# Function to restore the original email service
restore_email_service() {
  echo ""
  echo -e "${GREEN}Restoring original email service configuration...${NC}"
  echo ""
  node MoviesApp/Backend/try-alternative-domain.js --restore
}

# Main menu
show_menu() {
  echo ""
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}                AVAILABLE TESTS                 ${NC}"
  echo -e "${BLUE}================================================${NC}"
  echo "1) Run SparkPost Diagnostics"
  echo "2) Try Alternative Domain"
  echo "3) Restore Original Email Configuration"
  echo "4) Read Troubleshooting Guide"
  echo "5) Exit"
  echo ""
  echo -e "${YELLOW}Enter your choice [1-5]:${NC}"
  read choice
  
  case $choice in
    1) run_diagnostics; show_menu ;;
    2) try_alternative_domain; show_menu ;;
    3) restore_email_service; show_menu ;;
    4) 
      if command -v less >/dev/null 2>&1; then
        less MoviesApp/Backend/TROUBLESHOOTING_SPARKPOST.md
      else
        cat MoviesApp/Backend/TROUBLESHOOTING_SPARKPOST.md | more
      fi
      show_menu 
      ;;
    5) echo "Exiting."; exit 0 ;;
    *) echo -e "${RED}Invalid option. Please try again.${NC}"; show_menu ;;
  esac
}

# Check for command line arguments
if [[ "$1" == "diagnostics" ]]; then
  run_diagnostics
elif [[ "$1" == "alternative" ]]; then
  try_alternative_domain
elif [[ "$1" == "restore" ]]; then
  restore_email_service
else
  # No arguments, show the menu
  show_menu
fi
