# How the Movie Recommendation System Works

The recommendation system is generating personalized movie recommendations for you through a sophisticated multi-algorithm approach. Here's a detailed breakdown of the process:

## 1. Data Collection & Processing

When you log in or make a new rating, the system:

- Connects to the Azure SQL database to retrieve all user ratings, movie data, and user profiles
- Organizes this data into matrices for efficient processing:
  - User-Item Matrix: Maps which users rated which movies and their scores
  - Movie-Genre Matrix: Identifies which genres each movie belongs to
  - Movie Features Matrix: Combines genre data with other attributes like release year

## 2. Three Parallel Recommendation Techniques

The system then uses three different algorithms to generate distinct recommendation lists:

### Collaborative Filtering
- **What it does**: Finds "movie neighbors" by identifying users similar to you
- **How it works**:
  1. Identifies users with similar taste patterns to yours using cosine similarity
  2. Looks at the highly-rated movies (4+ stars) from these similar users
  3. Filters out movies you've already seen
  4. Ranks the remaining movies by how many similar users enjoyed them
  5. Returns the top 10 recommendations

### Content-Based Filtering
- **What it does**: Recommends movies with similar characteristics to those you've enjoyed
- **How it works**:
  1. Creates a "taste profile" by analyzing the features of movies you've rated highly
  2. Weights this profile toward genres, directors, and attributes you prefer
  3. Compares your taste profile against all movies in the database
  4. Filters out movies you've already seen
  5. Returns the top 10 movies with the highest similarity to your preferences

### Genre-Based Recommendations
- **What it does**: Creates specialized lists for your favorite genres
- **How it works**:
  1. Analyzes your ratings to determine your top 3 preferred genres
  2. For each genre, finds the most representative movies you haven't seen yet
  3. Returns up to 5 recommendations per genre

## 3. Dynamic Updates

The system ensures recommendations remain fresh by:
- Updating immediately when you log in (pulling your latest data)
- Refreshing after you submit a new rating
- Maintaining a fallback recommendations file for when the live service isn't available

## 4. From Backend to Frontend

When you visit the homepage:
1. The HomeRecommender component extracts your user ID
2. It sends a request to the recommendation API at http://localhost:8001/recommendations/{userId}
3. The API processes your request and returns the three types of recommendations
4. The frontend organizes these into visually distinct sections:
   - "Movies Similar Users Enjoyed" (collaborative)
   - "Based on Your Taste" (content-based)
   - "Recommended in [Genre]" (genre-specific recommendations)

The logs you're seeing show the system successfully generating all three types of recommendations for user ID 605 and returning them to the frontend for display.
