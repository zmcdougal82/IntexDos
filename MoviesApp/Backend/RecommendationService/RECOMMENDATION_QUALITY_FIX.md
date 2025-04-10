# Recommendation Quality Fix

## Problem Overview

The recommendation system had a critical issue where low-rated movies like "The Club Friday" were appearing in the "Movies Similar Users Enjoyed" section. This happened because the collaborative filtering algorithm was only comparing rating patterns between users without considering if the ratings were actually positive.

## Changes Made

We've updated the recommendation algorithms to ensure only positively-rated movies (3.5 stars or higher) are included in recommendations. Specifically:

1. **Collaborative Filtering Algorithm**: Added a filter to only include movies with ratings ≥ 3.5
2. **Popular Movies Algorithm**: Now considers both popularity (number of ratings) AND average rating score
3. **Genre-Based Recommendations**: Now joins with a subquery to only include well-rated movies

## Testing The Fix

To apply and test these changes:

### On MacOS/Linux:
```bash
# Make the script executable
chmod +x restart_and_regenerate.sh

# Run the restart script
./restart_and_regenerate.sh
```

### On Windows:
```powershell
# Run the PowerShell restart script
.\Restart-AndRegenerate.ps1
```

This will:
1. Stop any running recommendation service
2. Start the updated recommendation service
3. Regenerate all recommendation data
4. Apply the quality filtering to ensure only well-rated movies appear

## Technical Details

The primary issue was in the collaborative filtering query, which originally looked at users with similar rating patterns but didn't filter for the actual rating values:

### Before:
```sql
SELECT TOP (?) r2.show_id
FROM movies_ratings r1
JOIN movies_ratings r2 ON r1.user_id != r2.user_id 
    AND r1.show_id = r2.show_id 
    AND ABS(r1.rating - r2.rating) <= 1
WHERE r1.user_id = ?
    AND r2.show_id NOT IN (
        SELECT show_id FROM movies_ratings WHERE user_id = ?
    )
GROUP BY r2.show_id
ORDER BY COUNT(*) DESC
```

### After:
```sql
SELECT TOP (?) r2.show_id
FROM movies_ratings r1
JOIN movies_ratings r2 ON r1.user_id != r2.user_id 
    AND r1.show_id = r2.show_id 
    AND ABS(r1.rating - r2.rating) <= 1
    AND r2.rating >= 3.5 -- Only include positively rated movies
WHERE r1.user_id = ?
    AND r2.show_id NOT IN (
        SELECT show_id FROM movies_ratings WHERE user_id = ?
    )
GROUP BY r2.show_id
ORDER BY COUNT(*) DESC
```

Similar changes were made to the popular movies and genre-based recommendations to ensure only quality content is recommended to users.
