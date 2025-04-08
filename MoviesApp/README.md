# Movies Application

A full-stack application for browsing and rating movies, built with .NET 8 API backend, React frontend, and SQL database, with Azure hosting and GitHub Actions CI/CD.

## Project Overview

This solution provides a complete movie browsing and rating system with:

- **Backend**: .NET 8 RESTful API with Entity Framework Core
- **Frontend**: React with TypeScript using Vite for development
- **Database**: SQL database (local development uses SQLite, production uses Azure SQL)
- **CI/CD**: GitHub Actions workflows for automatic deployment
- **Hosting**: Microsoft Azure (App Service for backend, Static Web App for frontend)

## Directory Structure

```
MoviesApp/
├── .github/             # GitHub Actions CI/CD workflows
│   └── workflows/       
│       ├── backend-ci-cd.yml
│       └── frontend-ci-cd.yml
├── Backend/             # .NET 8 API
│   └── MoviesApp.API/
│       ├── Controllers/ # API endpoints
│       ├── Data/        # Database context
│       ├── Models/      # Entity models
│       └── ...
└── Frontend/            # React frontend
    └── movies-client/
        ├── src/
        │   ├── components/  # Reusable UI components
        │   ├── pages/       # Page components
        │   ├── services/    # API services
        │   └── ...
        └── ...
```

## Local Development Setup

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)

### Backend Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd MoviesApp/Backend/MoviesApp.API
   ```

2. Restore dependencies
   ```bash
   dotnet restore
   ```

3. Update the connection string in `appsettings.json` (if needed)

4. Run the application
   ```bash
   dotnet run
   ```
   
   The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory
   ```bash
   cd MoviesApp/Frontend/movies-client
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Update the API URL in `src/services/api.ts` if needed

4. Start the development server
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`

## Database Migration

To migrate from SQLite to Azure SQL Database:

1. Create an Azure SQL Database instance in Azure Portal

2. Update the connection string in `appsettings.json` to use your Azure SQL connection string

3. Run Entity Framework Core migrations
   ```bash
   cd MoviesApp/Backend/MoviesApp.API
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

4. Use a tool like [SQLite to SQL Server](https://github.com/ErikEJ/SqlCeToolbox) to migrate data

## Azure Deployment

### Backend Deployment (Azure App Service)

1. Create an Azure App Service in the Azure Portal
   - Runtime stack: .NET 8
   - Operating System: Linux or Windows

2. Configure connection strings in the Azure App Service Configuration

3. Set up deployment using GitHub Actions (see CI/CD setup)

### Frontend Deployment (Azure Static Web Apps)

1. Create an Azure Static Web App in the Azure Portal

2. Link to your GitHub repository during creation

3. Configure build details:
   - App location: `/MoviesApp/Frontend/movies-client`
   - API location: (leave empty)
   - Output location: `dist`

4. Set environment variables for API URL

## GitHub Actions CI/CD Setup

This repository includes GitHub Actions workflows for CI/CD:

### Setup Secrets

In your GitHub repository settings, add these secrets:

- `AZURE_WEBAPP_PUBLISH_PROFILE`: Your Azure App Service publish profile
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: Your Azure Static Web App deployment token

### Workflow Details

- **Backend Workflow**: `.github/workflows/backend-ci-cd.yml`
  - Triggered on push/PR to main branch affecting Backend code
  - Builds, tests, and deploys to Azure App Service

- **Frontend Workflow**: `.github/workflows/frontend-ci-cd.yml`
  - Triggered on push/PR to main branch affecting Frontend code
  - Builds and deploys to Azure Static Web App

## Technologies Used

- **Backend**:
  - .NET 8
  - ASP.NET Core Web API
  - Entity Framework Core
  - SQL Server / SQLite

- **Frontend**:
  - React 18
  - TypeScript
  - React Router
  - Axios
  - Vite

- **DevOps**:
  - GitHub Actions
  - Azure App Service
  - Azure Static Web Apps
  - Azure SQL Database

## License

[MIT](LICENSE)
