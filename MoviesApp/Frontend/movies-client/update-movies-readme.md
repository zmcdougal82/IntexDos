# Movie Records Batch Update Script

This script automatically updates incomplete movie records in your database by fetching missing data from The Movie Database (TMDB) API.

## Features

- Creates a backup of your database before making any changes (for safety)
- Scans your entire movie database for records with missing information
- Only updates empty/missing fields (preserves existing data)
- Updates multiple fields: country, rating, duration, poster URL, cast, and director
- Handles both movies and TV shows with appropriate API calls
- Includes throttling to prevent API rate limiting
- Creates detailed logs of all operations
- Provides a summary of updates at the end

## Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn
- Access to your MoviesApp API
- A TMDB API key (already included in the script)

## Important Note About ES Modules

This project is configured to use ES Modules (has "type": "module" in package.json), so the scripts have been written accordingly. If you see errors about "require is not defined", that means you're trying to use CommonJS syntax in an ES Module.

## Setup Instructions

1. Navigate to the `movies-client` directory in your terminal:
   ```
   cd MoviesApp/Frontend/movies-client
   ```

2. Install the required dependencies:
   ```
   npm install axios
   ```

3. Set up authentication (if required):
   - If your API requires authentication, you'll need to provide a JWT token
   - Option 1: Set it as an environment variable:
     ```
     export JWT_TOKEN=your_jwt_token_here
     ```
   - Option 2: Edit the script to add your token directly:
     ```javascript
     const JWT_TOKEN = 'your_jwt_token_here';
     ```

4. Check the API URL in the script:
   - The default is set to: `https://moviesapp-api-fixed.azurewebsites.net/api`
   - If your API is hosted elsewhere, update the `API_URL` variable

## Running the Script

1. Before running the update script, it's recommended to create a backup:
   ```
   node backup-and-restore.js backup
   ```
   This will create a timestamped JSON backup of your entire movie database.

2. From the `movies-client` directory, run the update script:
   ```
   node update-movie-records.js
   ```

3. The script will:
   - Create another backup automatically before making any changes
   - Fetch all movies from your database
   - Check each one for missing information
   - Search TMDB for matching titles
   - Update your database with the missing information
   - Log all activities to the console and a log file

4. Monitor the log output in the console to track progress

5. If anything goes wrong, you can restore from a backup:
   ```
   node backup-and-restore.js list
   node backup-and-restore.js restore movies-backup-2025-04-09T01-30-00.000Z.json
   ```

6. When complete, the script will display a summary of updates

## Log File

A detailed log is automatically created at:
```
MoviesApp/Frontend/movies-client/update-records-log.txt
```

This log contains:
- Timestamp for each operation
- Details of each movie processed
- Which fields were updated for each movie
- Any errors encountered
- Final summary statistics

## Configuration Options

You can modify the following settings in the script:

- `THROTTLE_MS`: Time to wait between API calls (default: 1000ms)
- `LOG_FILE`: Path to the log file
- Fields to check/update in the `needsUpdate()` function

## Troubleshooting

- **API Rate Limiting**: If you encounter TMDB API rate limiting, increase the `THROTTLE_MS` value
- **Authentication Issues**: Check that your JWT token is valid and properly set
- **No Updates**: Verify the API URLs and that your movies have titles that match TMDB entries
- **ES Module Issues**: If you see "require is not defined" errors, make sure you're using the correct import syntax for ES modules

## Important Notes

- The script only updates fields that are empty or null - it will not overwrite existing data
- For movies with ambiguous titles, it uses the first search result from TMDB
- TV show episodes' duration is based on the first episode runtime
