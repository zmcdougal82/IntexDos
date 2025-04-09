// Database Backup and Restore Utility for MoviesApp
// This script provides functions to:
// 1. Backup all movies to a local JSON file before making updates
// 2. Restore from that backup if needed

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = 'https://moviesapp-api-fixed.azurewebsites.net/api'; // Replace with your API URL if needed
const BACKUP_FOLDER = path.join(__dirname, 'backups');
const BACKUP_FILENAME = `movies-backup-${new Date().toISOString().replace(/:/g, '-')}.json`;
const BACKUP_PATH = path.join(BACKUP_FOLDER, BACKUP_FILENAME);

// Optional JWT token for authenticated API calls
const JWT_TOKEN = process.env.JWT_TOKEN || ''; // Set this as an environment variable or replace with a valid token

// Create backup folder if it doesn't exist
if (!fs.existsSync(BACKUP_FOLDER)) {
  fs.mkdirSync(BACKUP_FOLDER, { recursive: true });
}

// Helper function to log messages
function log(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}`;
  console.log(logMessage);
}

// Function to fetch all movies from our API
async function fetchAllMovies() {
  try {
    // Create headers with token if available
    const headers = {};
    if (JWT_TOKEN) {
      headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
    }
    
    let page = 1;
    const pageSize = 100; // Fetch in larger batches
    let allMovies = [];
    let hasMorePages = true;
    
    while (hasMorePages) {
      log(`Fetching movies page ${page}...`);
      const response = await axios.get(`${API_URL}/movies?page=${page}&pageSize=${pageSize}`, { headers });
      
      if (response.data && response.data.length > 0) {
        allMovies = [...allMovies, ...response.data];
        if (response.data.length < pageSize) {
          hasMorePages = false;
        } else {
          page++;
        }
      } else {
        hasMorePages = false;
      }
    }
    
    log(`Successfully fetched ${allMovies.length} movies in total.`);
    return allMovies;
  } catch (error) {
    log(`Error fetching movies: ${error.message}`);
    throw error;
  }
}

// Function to update a movie in our database (for restore)
async function updateMovie(movie) {
  try {
    const headers = {};
    if (JWT_TOKEN) {
      headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
    }
    
    await axios.put(`${API_URL}/movies/${movie.showId}`, movie, { headers });
    log(`Successfully restored movie: ${movie.title} (ID: ${movie.showId})`);
    return true;
  } catch (error) {
    log(`Error restoring movie "${movie.title}" (ID: ${movie.showId}): ${error.message}`);
    return false;
  }
}

// Function to create a backup of all movies
async function createBackup() {
  try {
    log('Starting database backup process...');
    
    // Fetch all movies
    const movies = await fetchAllMovies();
    
    // Write to backup file
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(movies, null, 2));
    
    log(`Backup successfully created at: ${BACKUP_PATH}`);
    log(`Total movies backed up: ${movies.length}`);
    
    return BACKUP_PATH;
  } catch (error) {
    log(`Backup process failed: ${error.message}`);
    throw error;
  }
}

// Function to restore from a specific backup file
async function restoreFromBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    log(`Starting restore from backup: ${backupPath}`);
    
    // Read the backup file
    const backupData = fs.readFileSync(backupPath, 'utf8');
    const movies = JSON.parse(backupData);
    
    log(`Found ${movies.length} movies in backup file.`);
    
    // Counters for tracking
    let successCount = 0;
    let errorCount = 0;
    
    // Restore each movie
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      log(`[${i+1}/${movies.length}] Restoring: ${movie.title} (ID: ${movie.showId})`);
      
      const success = await updateMovie(movie);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final summary
    log('\n====== RESTORE SUMMARY ======');
    log(`Total movies processed: ${movies.length}`);
    log(`Successfully restored: ${successCount}`);
    log(`Failed to restore: ${errorCount}`);
    log('============================');
    
    return { successCount, errorCount, total: movies.length };
  } catch (error) {
    log(`Restore process failed: ${error.message}`);
    throw error;
  }
}

// Function to list all available backups
function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_FOLDER)) {
      log('No backups folder found.');
      return [];
    }
    
    const files = fs.readdirSync(BACKUP_FOLDER)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        filename: file,
        path: path.join(BACKUP_FOLDER, file),
        created: fs.statSync(path.join(BACKUP_FOLDER, file)).birthtime,
        size: fs.statSync(path.join(BACKUP_FOLDER, file)).size
      }))
      .sort((a, b) => b.created - a.created); // Sort by date, newest first
    
    log(`Found ${files.length} backup files:`);
    files.forEach((file, index) => {
      log(`${index + 1}. ${file.filename}`);
      log(`   Created: ${file.created.toLocaleString()}`);
      log(`   Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    });
    
    return files;
  } catch (error) {
    log(`Error listing backups: ${error.message}`);
    return [];
  }
}

// Command-line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'backup':
      await createBackup();
      break;
      
    case 'restore':
      const backupFile = args[1];
      if (!backupFile) {
        log('Error: Please specify a backup file to restore from.');
        log('Usage: node backup-and-restore.js restore <backup-file>');
        listBackups();
        break;
      }
      
      const backupPath = backupFile.includes(path.sep) 
        ? backupFile 
        : path.join(BACKUP_FOLDER, backupFile);
        
      await restoreFromBackup(backupPath);
      break;
      
    case 'list':
      listBackups();
      break;
      
    default:
      log('MoviesApp Database Backup & Restore Utility');
      log('------------------------------------------');
      log('Usage:');
      log('  node backup-and-restore.js backup              Create a new backup');
      log('  node backup-and-restore.js list                List all available backups');
      log('  node backup-and-restore.js restore <filename>  Restore from a backup file');
      log('');
      log('Examples:');
      log('  node backup-and-restore.js backup');
      log('  node backup-and-restore.js restore movies-backup-2025-04-09T01-30-00.000Z.json');
  }
}

// Export functions for use in other scripts
export {
  createBackup,
  restoreFromBackup,
  listBackups,
  fetchAllMovies
};

// If this module is being run directly, execute the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`Error: ${error.message}`);
    process.exit(1);
  });
}

// To run this script independently:
// 1. Create a backup: node backup-and-restore.js backup
// 2. List backups: node backup-and-restore.js list
// 3. Restore from backup: node backup-and-restore.js restore <filename>
