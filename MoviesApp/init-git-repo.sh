#!/bin/bash
# Initialize Git repository and prepare for GitHub integration

# Make script executable
chmod +x deploy-to-azure.sh

# Create .gitignore file
cat > .gitignore << EOL
# .NET Core
*.swp
*.user
*.userosscache
*.sln.docstates
*.dll
*.exe
*.pdb
*.dll.config
*.cache
*.suo
.vs/
bin/
obj/
_ReSharper*/
_TeamCity*
*.dotCover
*.dbmdl
*.jfm
nupkg/
artifacts/
project.lock.json
**/*.nuget.targets
**/*.nuget.props
*.nupkg
*.snupkg
.ionide/

# Node.js
node_modules/
npm-debug.log
yarn-error.log
yarn-debug.log
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
/coverage
/build
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
EOL

# Initialize Git repository
git init

# Add files to Git
git add .

# Initial commit
git commit -m "Initial commit: MoviesApp with .NET 8 backend and React frontend"

echo "Git repository initialized!"
echo "Next steps:"
echo "1. Create a GitHub repository"
echo "2. Run the following commands to push your code to GitHub:"
echo "   git remote add origin <YOUR_GITHUB_REPO_URL>"
echo "   git push -u origin main"
echo "3. After pushing to GitHub, run ./deploy-to-azure.sh to deploy to Azure"
echo ""
echo "Note: The GitHub Actions workflows are already set up. Once you push to GitHub,"
echo "      they will automatically deploy your changes when you push to the main branch."
