#!/bin/bash
# Script to download and run BFG Repo-Cleaner to remove sensitive data

# ANSI color codes for output formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==================================================${NC}"
echo -e "${YELLOW}      BFG REPO-CLEANER INSTALLATION               ${NC}"
echo -e "${YELLOW}==================================================${NC}"

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo -e "${RED}Error: Java is required to run BFG but was not found.${NC}"
    echo -e "Please install Java and try again."
    exit 1
fi

# Download BFG Repo-Cleaner
echo -e "\n${GREEN}Downloading BFG Repo-Cleaner...${NC}"
curl -L -o bfg.jar https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

if [ ! -f bfg.jar ]; then
    echo -e "${RED}Error: Failed to download BFG Repo-Cleaner.${NC}"
    exit 1
fi

echo -e "${GREEN}BFG Repo-Cleaner downloaded successfully.${NC}"
echo -e "\n${YELLOW}To clean sensitive data from your repository:${NC}"
echo -e "1. Create a text file called 'sensitive-data.txt' with the API key to remove:"
echo -e "   echo '7366e6734f1c23f0db1fee6d258575cd-2b77fbb2-d23dd854' > sensitive-data.txt"
echo -e "2. Run this command from the repository root directory:"
echo -e "   java -jar bfg.jar --replace-text sensitive-data.txt"
echo -e "3. Force push to update the remote repository:"
echo -e "   git push origin --force"
