 pull#!/bin/bash
# Script to remove sensitive data from Git history
# IMPORTANT: This script will rewrite Git history! Make sure you understand the implications.

# ANSI color codes for output formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==================================================${NC}"
echo -e "${YELLOW}      GIT HISTORY CLEANUP SCRIPT                  ${NC}"
echo -e "${YELLOW}==================================================${NC}"
echo -e "${RED}WARNING: This script will rewrite Git history!${NC}"
echo -e "${RED}All collaborators will need to re-clone the repository.${NC}"
echo -e ""
echo -e "This script will remove the Mailgun API key from all commits."
echo -e ""

read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    exit 1
fi

echo -e "\n${GREEN}Starting Git history cleanup...${NC}"

# Store the API key to replace
API_KEY="7366e6734f1c23f0db1fee6d258575cd-2b77fbb2-d23dd854"
PLACEHOLDER="MAILGUN_API_KEY"

# Move to the repository root
cd $(git rev-parse --show-toplevel)

# Use git filter-branch to remove the API key from all files in all commits
git filter-branch --force --index-filter \
  "git ls-files -z | xargs -0 sed -i '' 's/$API_KEY/$PLACEHOLDER/g'" \
  --prune-empty --tag-name-filter cat -- --all

echo -e "\n${GREEN}Cleanup completed.${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Force push the changes with: ${GREEN}git push origin --force${NC}"
echo -e "2. Tell collaborators to re-clone the repository."
echo -e "3. Make sure to use environment variables for API keys in the future."
