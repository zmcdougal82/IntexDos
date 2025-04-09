// This script adds a button to the AdminMoviesPage that triggers displaying all TMDB search results
// when using Auto-Fill instead of automatically loading the first result

// Import dependencies
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to AdminMoviesPage.tsx
const adminPagePath = path.join(__dirname, 'src', 'pages', 'AdminMoviesPage.tsx');

try {
  // Read the file
  console.log(`Reading file: ${adminPagePath}`);
  const content = fs.readFileSync(adminPagePath, 'utf8');
  
  // =================== MODIFICATION 1: ADD NEW FILM AUTO-FILL ===================
  // Find the section where we decide whether to show the selection modal for Add New Film
  const addNewFilmAutoFillSection = content.match(
    /if \(!response\.results \|\| response\.results\.length === 0\) \{\s+alert\('No results found for this title'\);\s+setLoading\(false\);\s+return;\s+\}\s+\s+\/\/ Store total pages for pagination[\s\S]+?\/\/ If multiple results, show selection modal\s+if \(response\.results\.length > 1\) \{[\s\S]+?\/\/ If only one result, use it directly\s+const result = response\.results\[0\];/
  );

  if (!addNewFilmAutoFillSection) {
    throw new Error("Could not find Add New Film Auto-Fill section");
  }

  // Replace the section to always show the search results modal
  const modifiedAddNewFilmAutoFill = content.replace(
    /if \(!response\.results \|\| response\.results\.length === 0\) \{\s+alert\('No results found for this title'\);\s+setLoading\(false\);\s+return;\s+\}\s+\s+\/\/ Store total pages for pagination[\s\S]+?\/\/ If only one result, use it directly\s+const result = response\.results\[0\];/,
    `if (!response.results || response.results.length === 0) {
                          alert('No results found for this title');
                          setLoading(false);
                          return;
                        }
                        
                        // Store total pages for pagination
                        setSearchResultsTotalPages(response.total_pages || 1);
                        
                        // Always show selection modal
                        setSearchResults(response.results);
                        setIsEditMode(false); // We're in Add mode
                        setShowSearchResultsModal(true);
                        setLoading(false);
                        return;`
  );

  // =================== MODIFICATION 2: EDIT FILM AUTO-FILL ===================
  // Find the section where we decide whether to show the selection modal for Edit Film
  const editFilmAutoFillSection = modifiedAddNewFilmAutoFill.match(
    /if \(!searchResults\.results \|\| searchResults\.results\.length === 0\) \{\s+alert\('No results found for this title'\);\s+setLoading\(false\);\s+return;\s+\}\s+\s+\/\/ Get the first result\s+const result = searchResults\.results\[0\];/
  );

  if (!editFilmAutoFillSection) {
    throw new Error("Could not find Edit Film Auto-Fill section");
  }

  // Replace the section to always show search results for edit mode too
  const finalContent = modifiedAddNewFilmAutoFill.replace(
    /if \(!searchResults\.results \|\| searchResults\.results\.length === 0\) \{\s+alert\('No results found for this title'\);\s+setLoading\(false\);\s+return;\s+\}\s+\s+\/\/ Get the first result\s+const result = searchResults\.results\[0\];/,
    `if (!searchResults.results || searchResults.results.length === 0) {
                          alert('No results found for this title');
                          setLoading(false);
                          return;
                        }
                        
                        // Always show the search results modal, even for a single result
                        setSearchResults(searchResults.results);
                        setIsEditMode(true); // We're in Edit mode
                        setShowSearchResultsModal(true);
                        setLoading(false);
                        return;`
  );

  // Write the updated content back to the file
  fs.writeFileSync(adminPagePath, finalContent, 'utf8');
  console.log('Successfully updated AdminMoviesPage.tsx to always show search results for Auto-Fill');
  
  console.log("\nInstructions for running the update script:");
  console.log("----------------------------------------------");
  console.log("1. Navigate to the movies-client directory:");
  console.log("   cd MoviesApp/Frontend/movies-client");
  console.log("2. Run the script with Node.js:");
  console.log("   node update-autofill-modal.js");
  console.log("3. This will update the AdminMoviesPage.tsx file to ensure");
  console.log("   Auto-Fill always shows options instead of automatically loading data");
  
} catch (error) {
  console.error('Error updating file:', error);
}
