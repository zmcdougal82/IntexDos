# How the Movie Recommendation System Works

This document explains the technical details of the movie recommendation system's algorithms and architecture.

## System Architecture

The recommendation system is built as a complete solution that can be:
1. Executed directly from the Jupyter notebook
2. Run as a standalone service via the notebook implementation 
3. Integrated with the .NET backend and React frontend

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  React Frontend │      │  .NET Backend   │      │ Recommendation  │
│  (Home Page)    │ <─── │  (RESTful API)  │ <─── │ Service (Python)│
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                          │
                                                          ▼
                                                  ┌─────────────────┐
                                                  │  Azure SQL DB   │
                                                  │  (User Ratings) │
                                                  └─────────────────┘
```

## Data Model

The recommendation system works with the following data:

1. **Users** - User profiles with IDs and demographic information
2. **Movies** - Movie data including title, genres, release year, and other metadata
3. **Ratings** - User ratings for movies (1-5 scale)

## Database Schema

The system expects the following tables in the Azure SQL database:

- `movies_users`: Contains user information (user_id, name, email, gender, age)
- `movies_titles`: Contains movie information with genre columns (show_id, title, director, etc.)
- `movies_ratings`: Contains user ratings (user_id, show_id, rating, timestamp)

## Algorithm Implementations

### 1. Collaborative Filtering

This approach recommends movies based on what similar users like. The implementation uses user-based collaborative filtering with cosine similarity.

```python
# High-level algorithm
1. Find users with similar rating patterns using cosine similarity
2. Identify highly-rated movies (4+ stars) from these similar users
3. Filter out movies the active user has already rated
4. Recommend the most frequently occurring movies among similar users
```

Key Aspects:
- Uses cosine similarity to find users with similar taste profiles
- Considers only high ratings (4 and above) from similar users
- Excludes movies the active user has already rated
- Ranks by frequency (how many similar users rated the movie highly)

### 2. Content-Based Filtering

This approach recommends movies similar to ones the user has already rated highly, using movie attributes like genre and release year.

```python
# High-level algorithm
1. Create feature vectors for all movies using genres and metadata
2. Build a user profile by averaging the features of movies they've rated highly
3. Calculate similarity between the user profile and all movies
4. Filter out movies the user has already rated
5. Recommend movies with the highest similarity scores
```

Key Aspects:
- Builds a user profile based on features of movies they've rated highly
- Features include genre indicators and release year (standardized)
- Uses cosine similarity to find movies with similar feature vectors
- Ranks by similarity score to the user's profile

### 3. Genre-Based Recommendations

This approach provides specialized recommendations by genre, focusing on the user's most preferred genres.

```python
# High-level algorithm
1. Calculate the user's genre preferences based on their rating history
2. Identify the user's top genres (or use a specific requested genre)
3. For each top genre, find unwatched movies with high genre strength
4. Recommend the strongest movies in each genre category
```

Key Aspects:
- Calculates genre preferences by averaging ratings for movies in each genre
- Identifies user's favorite genres based on rating history
- Recommends movies with strong genre association that user hasn't seen
- Can focus on a specific genre or present recommendations across multiple genres

## Dynamic Updates

The system updates recommendations in two key scenarios:

1. **User Login**: Recommendations are fetched from the API or from a pre-generated JSON file
2. **New Rating**: When a user submits a new rating, the backend sends a request to refresh the user's recommendations

## Fallback Mechanism

For reliability, the system includes a fallback mechanism:

1. The frontend first attempts to fetch personalized recommendations from the API
2. If the API is unavailable, it falls back to pre-generated recommendations stored in a static JSON file

## Performance Considerations

- Pre-computed recommendation files are generated to improve performance
- The user-item matrix is built at startup and kept in memory
- Recommendations are updated asynchronously after ratings to avoid blocking the UI
- Background tasks in FastAPI handle recommendation updates without delaying responses
