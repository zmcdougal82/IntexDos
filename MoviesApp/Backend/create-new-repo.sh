#!/bin/bash
# Script to create a new clean repository without sensitive data in the history

# ANSI color codes for output formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==================================================${NC}"
echo -e "${YELLOW}      CREATE CLEAN REPOSITORY SCRIPT              ${NC}"
echo -e "${YELLOW}==================================================${NC}"
echo -e "${YELLOW}This script will create a fresh repository without any${NC}"
echo -e "${YELLOW}sensitive data in the Git history.${NC}"
echo -e ""

read -p "Enter the name for your new GitHub repository: " REPO_NAME
if [ -z "$REPO_NAME" ]; then
    echo -e "${RED}Error: Repository name cannot be empty.${NC}"
    exit 1
fi

read -p "Enter your GitHub username: " GITHUB_USER
if [ -z "$GITHUB_USER" ]; then
    echo -e "${RED}Error: GitHub username cannot be empty.${NC}"
    exit 1
fi

# Get current directory
CURRENT_DIR=$(pwd)
PARENT_DIR=$(dirname "$CURRENT_DIR")
TEMP_DIR="/tmp/clean-${REPO_NAME}"

echo -e "\n${GREEN}Step 1: Create a temporary directory for the new repository${NC}"
mkdir -p $TEMP_DIR
if [ ! -d "$TEMP_DIR" ]; then
    echo -e "${RED}Error: Failed to create temporary directory.${NC}"
    exit 1
fi

echo -e "\n${GREEN}Step 2: Copy files to the new directory (excluding .git)${NC}"
# First, clean up any previous rsync operations to this directory
rm -rf $TEMP_DIR/*

# Copy files, excluding .git and any other unnecessary files
rsync -av --exclude='.git' --exclude='node_modules' --exclude='bin' --exclude='obj' $CURRENT_DIR/ $TEMP_DIR/

echo -e "\n${GREEN}Step 3: Initialize a new Git repository${NC}"
cd $TEMP_DIR
git init

echo -e "\n${GREEN}Step 4: Add and commit the files${NC}"
git add .
git commit -m "Initial commit - Clean repository"

echo -e "\n${GREEN}Step 5: Create a new repository on GitHub${NC}"
echo -e "${YELLOW}Please go to GitHub and manually create a new empty private repository named: ${REPO_NAME}${NC}"
echo -e "${YELLOW}Do NOT initialize it with a README, .gitignore, or license.${NC}"
read -p "Press Enter once you've created the repository on GitHub... "

echo -e "\n${GREEN}Step 6: Add the GitHub repository as a remote and push${NC}"
git remote add origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git

echo -e "${YELLOW}You will be prompted to enter your GitHub credentials.${NC}"
git push -u origin main || git push -u origin master

echo -e "\n${GREEN}Step 7: Update your local repository${NC}"
cd $CURRENT_DIR
read -p "Do you want to update your original repository to point to the new one? (y/N) " -n 1 -r

if [[ $REPLY =~ ^[Yy]$ ]]; then
    git remote set-url origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git
    echo -e "\n${GREEN}Updated remote URL to point to the new repository.${NC}"
else
    echo -e "\n${GREEN}Keeping original remote configuration.${NC}"
fi

echo -e "\n${GREEN}All done! Your clean repository is available at:${NC}"
echo -e "https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo -e "\n${YELLOW}You can now clone this repository in place of your original one:${NC}"
echo -e "git clone https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
