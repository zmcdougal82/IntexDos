import os
import json
import logging
import random
from datetime import datetime

# Configure logging
logger = logging.getLogger('recommendation_service')

# Try to import pyodbc, but handle import error gracefully
try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError as e:
    logger.warning(f"pyodbc import failed: {e}. SQL database functionality will be unavailable.")
    PYODBC_AVAILABLE = False

def get_connection():
    """Create and return a connection to the database"""
    if not PYODBC_AVAILABLE:
        logger.warning("pyodbc not available, can't connect to database")
        return None
        
    # Get connection parameters from environment or use defaults
    server = os.getenv('SQL_SERVER', 'moviesapp-sql-79427.database.windows.net')
    database = os.getenv('SQL_DATABASE', 'MoviesDB')
    username = os.getenv('SQL_USERNAME', 'sqladmin')
    password = os.getenv('SQL_PASSWORD', 'P@ssw0rd123!')
    driver = os.getenv('SQL_DRIVER', 'ODBC Driver 18 for SQL Server')
    
    connection_string = f'DRIVER={driver};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=yes;TrustServerCertificate=no;'
    try:
        conn = pyodbc.connect(connection_string)
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        # We'll use sample data as fallback if connection fails
        return None


class NotebookRecommendationService:
    """
    Recommendation service that connects to SQL database.
    Falls back to sample data if database connection fails.
    """
    
    def __init__(self):
        """Initialize the recommendation service."""
        self.conn = None
        
        if PYODBC_AVAILABLE:
            try:
                self.conn = get_connection()
                if self.conn:
                    logger.info("Successfully connected to SQL database")
                else:
                    logger.warning("Failed to connect to database, using fallback sample data")
            except Exception as e:
                logger.error(f"Error initializing database connection: {e}")
        else:
            logger.info("Using sample data (pyodbc not available)")
            
        # Fallback sample data if database connection fails - using database IDs only
        self.sample_movies = [
            "s1", "s2", "s3", "s4", "s5", 
            "s6", "s7", "s8", "s9", "s10",
            "s11", "s12", "s13", "s14", "s15",
            "s16", "s17", "s18", "s19", "s20",
            "s21", "s22", "s23", "s24", "s25",
            "s26", "s27", "s28", "s29", "s30",
            "s31", "s32", "s33", "s34", "s35",
            "s36", "s37", "s38", "s39", "s40"
        ]
        # Ensure we're only using database IDs - NO TMDB IDs
        self.genres = [
            "Action", "Comedy", "Drama", "Horror", "SciFi", 
            "Thriller", "Romance", "Animation", "Documentary"
        ]
        logger.info("Recommendation service initialized")
    
    def __del__(self):
        """Close database connection when object is destroyed"""
        if self.conn:
            try:
                self.conn.close()
                logger.info("Database connection closed")
            except Exception as e:
                logger.error(f"Error closing database connection: {e}")

    def get_user_ratings(self, user_id):
        """Get all ratings for a specific user"""
        if not self.conn:
            # If no database connection, return empty dict
            return {}
            
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT show_id, rating FROM movies_ratings WHERE user_id = ?", (user_id,))
            ratings = {row.show_id: row.rating for row in cursor.fetchall()}
            cursor.close()
            logger.info(f"Retrieved {len(ratings)} ratings for user {user_id}")
            return ratings
        except Exception as e:
            logger.error(f"Error retrieving user ratings: {e}")
            return {}
    
    def get_movie_ids(self, limit=100):
        """Get a list of movie IDs from the database"""
        if not self.conn:
            # If no database connection, return sample movies
            return self.sample_movies
            
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT TOP (?) show_id FROM movies_titles", (limit,))
            # Ensure all IDs are in the 's' prefix format
            movie_ids = []
            for row in cursor.fetchall():
                # Get the ID and ensure it's in the correct format (starting with 's')
                show_id = row.show_id
                if not show_id.startswith('s'):
                    # If it's a TMDB ID (starts with 'tt'), extract the numeric part
                    if show_id.startswith('tt'):
                        show_id = f"s{show_id[2:]}"
                    else:
                        # For any other format, just ensure it has 's' prefix
                        show_id = f"s{show_id}"
                movie_ids.append(show_id)
            
            cursor.close()
            logger.info(f"Retrieved {len(movie_ids)} movie IDs from database")
            return movie_ids
        except Exception as e:
            logger.error(f"Error retrieving movie IDs: {e}")
            return self.sample_movies
            
    def validate_movie_ids(self, movie_ids):
        """
        Filter out movie IDs that don't exist in the database
        
        Args:
            movie_ids (list): List of movie IDs to validate
            
        Returns:
            list: Filtered list containing only valid movie IDs
        """
        if not self.conn or not movie_ids:
            return movie_ids
            
        try:
            # Convert list to tuple for SQL query
            ids_tuple_str = ','.join(f"'{id}'" for id in movie_ids)
            
            cursor = self.conn.cursor()
            query = f"""
            SELECT show_id
            FROM movies_titles
            WHERE show_id IN ({ids_tuple_str})
            """
            cursor.execute(query)
            
            # Get all valid IDs from the database
            valid_ids = [row.show_id for row in cursor.fetchall()]
            cursor.close()
            
            # Log how many IDs were filtered out
            filtered_count = len(movie_ids) - len(valid_ids)
            if filtered_count > 0:
                logger.warning(f"Filtered out {filtered_count} non-existent movie IDs")
                
            return valid_ids
        except Exception as e:
            logger.error(f"Error validating movie IDs: {e}")
            return movie_ids  # Return original list on error
    
    def get_genre_movies(self, genre, limit=20, offset=0):
        """Get movies for a specific genre with good ratings with pagination support"""
        if not self.conn:
            # If no database connection, return sample movies
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
            
        try:
            cursor = self.conn.cursor()
            # Use the genre column name directly from the database
            # Note: This assumes the genre names match column names in the database
            # We need to sanitize the genre name to ensure it's a valid column name
            sanitized_genre = ''.join(c for c in genre if c.isalnum())
            query = f"""
            SELECT m.show_id 
            FROM movies_titles m
            JOIN (
                SELECT show_id, AVG(CAST(rating AS FLOAT)) as avg_rating
                FROM movies_ratings
                GROUP BY show_id
                HAVING AVG(CAST(rating AS FLOAT)) >= 3.5
            ) r ON m.show_id = r.show_id
            WHERE [{sanitized_genre}] > 0
            ORDER BY r.avg_rating DESC
            OFFSET ? ROWS
            FETCH NEXT ? ROWS ONLY
            """
            cursor.execute(query, (offset, limit))
            
            # Ensure all IDs are in the 's' prefix format
            genre_movies = []
            for row in cursor.fetchall():
                # Get the ID and ensure it's in the correct format (starting with 's')
                show_id = row.show_id
                if not show_id.startswith('s'):
                    # If it's a TMDB ID (starts with 'tt'), extract the numeric part
                    if show_id.startswith('tt'):
                        show_id = f"s{show_id[2:]}"
                    else:
                        # For any other format, just ensure it has 's' prefix
                        show_id = f"s{show_id}"
                genre_movies.append(show_id)
                
            cursor.close()
            
            if not genre_movies:
                # Fallback if no movies found for this genre
                return random.sample(self.get_movie_ids(), min(limit, len(self.sample_movies)))
                
            logger.info(f"Retrieved {len(genre_movies)} movies for genre {genre}")
            return genre_movies
        except Exception as e:
            logger.error(f"Error retrieving genre movies: {e}")
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
    
    def get_collaborative_recommendations(self, user_id, limit=20, offset=0):
        """Get collaborative filtering recommendations for a user with pagination"""
        if not self.conn:
            # If no database connection, return sample movies
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
            
        try:
            # Calculate the tier based on offset to progressively relax constraints
            # This allows us to generate more recommendations as the user scrolls
            tier = min(4, offset // 40)  # Tier increases every 40 movies (8 pages of 5)
            
            # Print debug info
            logger.info(f"Getting collaborative recommendations for user {user_id} with limit={limit}, offset={offset}, tier={tier}")
            
            # First try with strict collaborative filtering
            if tier == 0:
                recommendations = self.get_strict_collaborative_recommendations(user_id, limit, offset)
                if recommendations and len(recommendations) > 0:
                    logger.info(f"Retrieved {len(recommendations)} strict collaborative recommendations")
                    return recommendations
            
            # If we've already gone through initial tiers or strict recommendations returned nothing
            if tier >= 1 or not recommendations or len(recommendations) == 0:
                recommendations = self.get_extended_collaborative_recommendations(user_id, limit, offset, tier)
                if recommendations and len(recommendations) > 0:
                    logger.info(f"Retrieved {len(recommendations)} extended recommendations (tier {tier})")
                    return recommendations
            
            # Final fallback to popular and genre-based recommendations
            logger.info(f"No suitable collaborative recommendations found for user {user_id}, using fallbacks")
            return self.get_recommendation_fallbacks(user_id, limit)
            
        except Exception as e:
            logger.error(f"Error retrieving collaborative recommendations: {e}")
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
    
    def get_strict_collaborative_recommendations(self, user_id, limit=20, offset=0):
        """Get strict collaborative filtering recommendations (users with very similar ratings)"""
        if not self.conn:
            return []
            
        try:
            cursor = self.conn.cursor()
            # Rewritten strict collaborative filtering query to avoid ORDER BY in CTE
            strict_query = """
            SELECT show_id
            FROM (
                SELECT r2.show_id, COUNT(*) as similarity_count
                FROM movies_ratings r1
                JOIN movies_ratings r2 ON r1.user_id != r2.user_id 
                    AND r1.show_id = r2.show_id 
                    AND ABS(r1.rating - r2.rating) <= 1
                    AND r2.rating >= 3.5
                WHERE r1.user_id = ?
                    AND r2.show_id NOT IN (
                        SELECT show_id FROM movies_ratings WHERE user_id = ?
                    )
                GROUP BY r2.show_id
            ) as recs
            ORDER BY similarity_count DESC
            OFFSET ? ROWS
            FETCH NEXT ? ROWS ONLY
            """
            cursor.execute(strict_query, (user_id, user_id, offset, limit))
            
            # Ensure all IDs are in the 's' prefix format
            collaborative = []
            for row in cursor.fetchall():
                show_id = row.show_id
                if not show_id.startswith('s'):
                    if show_id.startswith('tt'):
                        show_id = f"s{show_id[2:]}"
                    else:
                        show_id = f"s{show_id}"
                collaborative.append(show_id)
            
            cursor.close()
            return collaborative
        except Exception as e:
            logger.error(f"Error retrieving strict collaborative recommendations: {e}")
            return []
    
    def get_extended_collaborative_recommendations(self, user_id, limit=20, offset=0, tier=1):
        """Get extended collaborative recommendations using progressively relaxed criteria"""
        if not self.conn:
            return []
            
        try:
            cursor = self.conn.cursor()
            
            # Calculate offset within the relaxed tier (resetting for each tier)
            tier_offset = max(0, offset - (tier * 40))
            
            # Get the user's rated genres to find similar movies
            user_genres = self.get_user_preferred_genres(user_id)
            
            # Generate the genre conditions dynamically based on user preferences
            genre_conditions = ""
            if user_genres and len(user_genres) > 0:
                genre_clauses = []
                for genre in user_genres:
                    genre_clauses.append(f"m2.[{genre}] > 0")
                genre_conditions = "AND (" + " OR ".join(genre_clauses) + ")"
            else:
                # Fallback if no user genres found
                genre_conditions = "AND (m2.[Action] > 0 OR m2.[Comedies] > 0 OR m2.[Dramas] > 0)"
            
            # Relaxed parameters for different tiers
            rating_difference = 1 + (tier * 0.5)  # 1, 1.5, 2, 2.5
            min_rating = max(2.5, 4 - (tier * 0.5))  # 4, 3.5, 3, 2.5
            
            # Completely rewritten query to avoid nested subqueries and ORDER BY issues
            # First get the user's rated movies and their details in a temporary table
            user_rated_query = f"""
            -- First, get a subset of movies rated by the user
            SELECT TOP 50 m1.show_id, r1.rating, m1.Action, m1.Comedies, m1.Dramas, m1.Thrillers, m1.HorrorMovies
            INTO #user_rated_movies
            FROM movies_ratings r1
            JOIN movies_titles m1 ON r1.show_id = m1.show_id
            WHERE r1.user_id = ? AND r1.rating >= {min_rating}
            ORDER BY r1.rating DESC;

            -- Get the movies that match the user's preferred genres
            SELECT TOP {limit + offset} m2.show_id,
                AVG(CAST(m2.Action + m2.Comedies + m2.Dramas + m2.Thrillers + m2.HorrorMovies AS FLOAT) *
                    (1 - ABS(ur.rating - {min_rating})/5)) as genre_similarity_score
            FROM #user_rated_movies ur
            JOIN movies_titles m2 ON m2.show_id != ur.show_id
                {genre_conditions}
            WHERE m2.show_id NOT IN (
                SELECT show_id FROM movies_ratings WHERE user_id = ?
            )
            GROUP BY m2.show_id
            ORDER BY genre_similarity_score DESC
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY;
            
            -- Drop the temporary table
            DROP TABLE #user_rated_movies;
            """
            
            cursor.execute(user_rated_query, (user_id, user_id, tier_offset, limit))
            
            # Ensure all IDs are in the 's' prefix format
            extended = []
            for row in cursor.fetchall():
                show_id = row.show_id
                if not show_id.startswith('s'):
                    if show_id.startswith('tt'):
                        show_id = f"s{show_id[2:]}"
                    else:
                        show_id = f"s{show_id}"
                extended.append(show_id)
            
            cursor.close()
            return extended
        except Exception as e:
            logger.error(f"Error retrieving extended collaborative recommendations: {e}")
            return []
    
    def get_user_preferred_genres(self, user_id):
        """Get a user's preferred genres based on their highly-rated movies"""
        if not self.conn:
            return self.genres[:3]
            
        try:
            cursor = self.conn.cursor()
            
            # Find genres for movies the user has rated highly
            query = """
            SELECT 
                SUM(m.Action) as Action, 
                SUM(m.Adventure) as Adventure,
                SUM(m.Comedies) as Comedies, 
                SUM(m.Dramas) as Dramas,
                SUM(m.HorrorMovies) as HorrorMovies, 
                SUM(m.Thrillers) as Thrillers,
                SUM(m.Documentaries) as Documentaries
            FROM movies_ratings r
            JOIN movies_titles m ON r.show_id = m.show_id
            WHERE r.user_id = ? AND r.rating >= 3.5
            """
            
            cursor.execute(query, (user_id,))
            row = cursor.fetchone()
            cursor.close()
            
            if not row:
                return []
            
            # Get the top 3 genres with non-zero values
            genre_scores = [
                ("Action", row.Action or 0),
                ("Adventure", row.Adventure or 0),
                ("Comedies", row.Comedies or 0),
                ("Dramas", row.Dramas or 0),
                ("HorrorMovies", row.HorrorMovies or 0),
                ("Thrillers", row.Thrillers or 0),
                ("Documentaries", row.Documentaries or 0)
            ]
            
            # Sort by score (descending) and filter out zero scores
            sorted_genres = [genre for genre, score in sorted(genre_scores, key=lambda x: x[1], reverse=True) if score > 0]
            
            # Return top 3 or all if less than 3
            return sorted_genres[:3] if len(sorted_genres) > 3 else sorted_genres
            
        except Exception as e:
            logger.error(f"Error getting user preferred genres: {e}")
            return []
            
    def get_recommendation_fallbacks(self, user_id, limit=20):
        """Get fallback recommendations when collaborative filtering runs out"""
        fallbacks = []
        
        # First try: Get popular movies
        try:
            popular = self.get_popular_movies(limit)
            if popular and len(popular) > 0:
                fallbacks.extend(popular)
        except Exception as e:
            logger.error(f"Error getting popular movie fallbacks: {e}")
        
        # Second try: Get top-rated movies
        try:
            if len(fallbacks) < limit:
                top_rated = self.get_top_rated_movies(limit)
                
                # Filter out duplicates
                for movie_id in top_rated:
                    if movie_id not in fallbacks and len(fallbacks) < limit:
                        fallbacks.append(movie_id)
        except Exception as e:
            logger.error(f"Error getting top-rated movie fallbacks: {e}")
        
        # Third try: Get genre recommendations
        try:
            if len(fallbacks) < limit:
                # Get user's preferred genres
                preferred_genres = self.get_user_preferred_genres(user_id)
                
                # If no preferred genres, use default set
                if not preferred_genres or len(preferred_genres) == 0:
                    preferred_genres = ["Action", "Comedies", "Dramas"]
                
                # Get recommendations for each genre until we have enough
                for genre in preferred_genres:
                    if len(fallbacks) >= limit:
                        break
                    
                    genre_movies = self.get_genre_movies(genre, limit)
                    
                    # Filter out duplicates
                    for movie_id in genre_movies:
                        if movie_id not in fallbacks and len(fallbacks) < limit:
                            fallbacks.append(movie_id)
        except Exception as e:
            logger.error(f"Error getting genre movie fallbacks: {e}")
        
        # Last resort: Random sampling from available movies
        if len(fallbacks) < limit:
            try:
                all_movies = self.get_movie_ids(limit * 2)
                random.shuffle(all_movies)
                
                # Filter out duplicates
                for movie_id in all_movies:
                    if movie_id not in fallbacks and len(fallbacks) < limit:
                        fallbacks.append(movie_id)
            except Exception as e:
                logger.error(f"Error getting random movie fallbacks: {e}")
        
        logger.info(f"Generated {len(fallbacks)} fallback recommendations for user {user_id}")
        return fallbacks[:limit]  # Limit to requested number
    
    def get_content_based_recommendations(self, user_id, limit=20, offset=0):
        """Get content-based recommendations for a user with pagination"""
        if not self.conn:
            # If no database connection, return sample movies
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
            
        try:
            cursor = self.conn.cursor()
            # Find movies similar to ones the user has rated highly
            # This is a simplified content-based approach
            query = """
            SELECT m2.show_id
            FROM movies_ratings r
            JOIN movies_titles m1 ON r.show_id = m1.show_id
            JOIN movies_titles m2 ON m1.show_id != m2.show_id
                AND (
                    (m1.Action > 0 AND m2.Action > 0) OR
                    (m1.Comedies > 0 AND m2.Comedies > 0) OR
                    (m1.Dramas > 0 AND m2.Dramas > 0) OR
                    (m1.Thrillers > 0 AND m2.Thrillers > 0)
                )
            WHERE r.user_id = ? AND r.rating >= 4
                AND m2.show_id NOT IN (
                    SELECT show_id FROM movies_ratings WHERE user_id = ?
                )
            GROUP BY m2.show_id
            ORDER BY COUNT(*) DESC
            OFFSET ? ROWS
            FETCH NEXT ? ROWS ONLY
            """
            cursor.execute(query, (user_id, user_id, offset, limit))
            
            # Ensure all IDs are in the 's' prefix format
            content_based = []
            for row in cursor.fetchall():
                # Get the ID and ensure it's in the correct format (starting with 's')
                show_id = row.show_id
                if not show_id.startswith('s'):
                    # If it's a TMDB ID (starts with 'tt'), extract the numeric part
                    if show_id.startswith('tt'):
                        show_id = f"s{show_id[2:]}"
                    else:
                        # For any other format, just ensure it has 's' prefix
                        show_id = f"s{show_id}"
                content_based.append(show_id)
            
            cursor.close()
            
            if not content_based:
                # Fallback if no content-based recommendations found
                logger.info(f"No content-based recommendations found for user {user_id}, using top rated movies")
                return self.get_top_rated_movies(limit)
                
            logger.info(f"Retrieved {len(content_based)} content-based recommendations for user {user_id}")
            return content_based
        except Exception as e:
            logger.error(f"Error retrieving content-based recommendations: {e}")
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
    
    def get_popular_movies(self, limit=10):
        """Get popular movies based on rating count and average rating"""
        if not self.conn:
            # If no database connection, return sample movies
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
            
        try:
            cursor = self.conn.cursor()
            query = """
            SELECT TOP (?) show_id
            FROM movies_ratings
            GROUP BY show_id
            HAVING AVG(CAST(rating AS FLOAT)) >= 3.5 -- Only include well-rated movies
            ORDER BY COUNT(*) DESC
            """
            cursor.execute(query, (limit,))
            
            # Ensure all IDs are in the 's' prefix format
            popular = []
            for row in cursor.fetchall():
                # Get the ID and ensure it's in the correct format (starting with 's')
                show_id = row.show_id
                if not show_id.startswith('s'):
                    # If it's a TMDB ID (starts with 'tt'), extract the numeric part
                    if show_id.startswith('tt'):
                        show_id = f"s{show_id[2:]}"
                    else:
                        # For any other format, just ensure it has 's' prefix
                        show_id = f"s{show_id}"
                popular.append(show_id)
            
            cursor.close()
            
            if not popular:
                # Fallback if no popular movies found
                return random.sample(self.get_movie_ids(), min(limit, len(self.sample_movies)))
                
            logger.info(f"Retrieved {len(popular)} popular movies")
            return popular
        except Exception as e:
            logger.error(f"Error retrieving popular movies: {e}")
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
    
    def get_top_rated_movies(self, limit=10):
        """Get top rated movies based on average rating"""
        if not self.conn:
            # If no database connection, return sample movies
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
            
        try:
            cursor = self.conn.cursor()
            query = """
            SELECT TOP (?) show_id
            FROM movies_ratings
            GROUP BY show_id
            HAVING COUNT(*) >= 3
            ORDER BY AVG(CAST(rating AS FLOAT)) DESC
            """
            cursor.execute(query, (limit,))
            
            # Ensure all IDs are in the 's' prefix format
            top_rated = []
            for row in cursor.fetchall():
                # Get the ID and ensure it's in the correct format (starting with 's')
                show_id = row.show_id
                if not show_id.startswith('s'):
                    # If it's a TMDB ID (starts with 'tt'), extract the numeric part
                    if show_id.startswith('tt'):
                        show_id = f"s{show_id[2:]}"
                    else:
                        # For any other format, just ensure it has 's' prefix
                        show_id = f"s{show_id}"
                top_rated.append(show_id)
            
            cursor.close()
            
            if not top_rated:
                # Fallback if no top rated movies found
                return random.sample(self.get_movie_ids(), min(limit, len(self.sample_movies)))
                
            logger.info(f"Retrieved {len(top_rated)} top rated movies")
            return top_rated
        except Exception as e:
            logger.error(f"Error retrieving top rated movies: {e}")
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
    
    def get_available_genres(self):
        """Get available genres from database"""
        if not self.conn:
            # If no database connection, return sample genres
            return self.genres
            
        # These are the genre columns in the movies_titles table
        return [
            "Action", "Adventure", "Comedies", "Dramas", 
            "HorrorMovies", "Thrillers", "Documentaries"
        ]
    
    def generate_recommendations(self, user_id, page=0, limit=20):
        """
        Generate recommendations for a specific user with pagination.
        
        Args:
            user_id (str): The user ID to generate recommendations for.
            page (int): The page number for pagination (default: 0).
            limit (int): The number of items per page (default: 20).
            
        Returns:
            dict: A dictionary containing collaborative, content-based, and genre recommendations.
        """
        logger.info(f"Generating recommendations for user {user_id}, page {page}, limit {limit}")
        
        # Calculate offset based on page and limit for pagination
        offset = page * limit
        
        # Get recommendations from database if connection is available
        if self.conn:
            # Get collaborative filtering recommendations with proper pagination
            collaborative = self.get_collaborative_recommendations(user_id, limit=limit, offset=offset)
            logger.info(f"Found {len(collaborative)} collaborative recommendations with offset {offset}")
            
            # Validate movie IDs to ensure they exist in the database
            collaborative = self.validate_movie_ids(collaborative)
            logger.info(f"After validation: {len(collaborative)} collaborative recommendations remain")
            
            # Get content-based recommendations with proper pagination
            content_based = self.get_content_based_recommendations(user_id, limit=limit, offset=offset)
            logger.info(f"Found {len(content_based)} content-based recommendations with offset {offset}")
            
            # Validate movie IDs
            content_based = self.validate_movie_ids(content_based)
            logger.info(f"After validation: {len(content_based)} content-based recommendations remain")
            
            # Get genre-based recommendations
            genres_dict = {}
            available_genres = self.get_available_genres()
            selected_genres = random.sample(available_genres, min(3, len(available_genres)))
            
            for genre in selected_genres:
                # Get twice as many recommendations as needed to ensure we have enough after validation
                genre_movies = self.get_genre_movies(genre, limit=20, offset=offset)
                # Validate genre movie IDs
                genre_movies = self.validate_movie_ids(genre_movies)
                if genre_movies and len(genre_movies) > 0:  # Only add genres that have valid movies
                    # Limit to requested number after validation
                    genres_dict[genre] = genre_movies[:limit]
                    logger.info(f"Genre {genre}: {len(genre_movies)} valid recommendations found")
                else:
                    logger.warning(f"No valid movies found for genre {genre}")
            
        else:
            # Fallback to random recommendations if no database connection
            # Generate fixed but deterministic recommendations based on user_id
            # This ensures the same user always gets the same recommendations
            random.seed(int(user_id) if user_id.isdigit() else sum(ord(c) for c in user_id))
            
            # Create collaborative filtering recommendations
            collaborative = random.sample(self.sample_movies, min(10, len(self.sample_movies)))
            logger.info(f"Using fallback for collaborative recommendations")
            
            # Create content-based recommendations
            content_based = random.sample(self.sample_movies, min(10, len(self.sample_movies)))
            logger.info(f"Using fallback for content-based recommendations")
            
            # Create genre-based recommendations
            genres_dict = {}
            selected_genres = random.sample(self.genres, min(3, len(self.genres)))
            
            for genre in selected_genres:
                genres_dict[genre] = random.sample(self.sample_movies, min(5, len(self.sample_movies)))
                
        logger.info(f"Generated recommendations for {len(genres_dict)} genres")
        logger.info(f"Generated all recommendations for user {user_id}")
        
        return {
            "collaborative": collaborative,
            "contentBased": content_based,
            "genres": genres_dict
        }
    
    def generate_more_recommendations(self, user_id, section, page, limit=10):
        """
        Generate more recommendations for a specific section with pagination.
        
        Args:
            user_id (str): The user ID to generate recommendations for.
            section (str): The section to generate recommendations for ('collaborative', 'contentBased', or genre name).
            page (int): The page number for pagination.
            limit (int): The number of items per page.
            
        Returns:
            dict: A dictionary containing the requested recommendations.
        """
        logger.info(f"Generating more recommendations for user {user_id}, section {section}, page {page}")
        
        # Calculate the offset based on page and limit
        offset = page * limit
        
        # For tracking already returned recommendations to avoid duplicates
        already_recommended = set()
        
        # Generate the appropriate recommendations based on section
        if section == 'collaborative':
            # Get collaborative filtering recommendations with offset
            if self.conn:
                # Request more recommendations than needed to ensure we have enough after validation
                expanded_limit = limit * 3  # Increased to get more potential recommendations
                
                # Get both strict and extended recommendations
                recommendations = []
                
                # Try strict collaborative first
                strict_recs = self.get_collaborative_recommendations(user_id, limit=expanded_limit, offset=offset)
                if strict_recs:
                    recommendations.extend(strict_recs)
                
                # If we don't have enough, try some additional fallbacks
                if len(recommendations) < limit:
                    remaining = limit - len(recommendations)
                    fallbacks = self.get_recommendation_fallbacks(user_id, remaining * 2)
                    
                    # Add fallbacks that aren't already in recommendations
                    for movie_id in fallbacks:
                        if movie_id not in recommendations and len(recommendations) < expanded_limit:
                            recommendations.append(movie_id)
                
                # Validate the recommendations
                recommendations = self.validate_movie_ids(recommendations)
                logger.info(f"Returning {len(recommendations)} validated collaborative recommendations (requested {expanded_limit})")
                
                # Limit to the requested number after validation
                recommendations = recommendations[:limit]
            else:
                # Deterministic random sampling for consistent results
                random.seed(int(user_id) if user_id.isdigit() else sum(ord(c) for c in user_id))
                all_recommendations = self.sample_movies.copy()
                random.shuffle(all_recommendations)
                
                # Apply pagination
                start_idx = offset % len(all_recommendations)
                recommendations = all_recommendations[start_idx:start_idx+limit]
                if len(recommendations) < limit:
                    # Wrap around if we reach the end
                    recommendations += all_recommendations[:limit - len(recommendations)]
            
            return {"collaborative": recommendations}
            
        elif section == 'contentBased':
            # Get content-based recommendations with offset
            if self.conn:
                # Request more recommendations than needed to ensure we have enough after validation
                expanded_limit = limit * 2
                recommendations = self.get_content_based_recommendations(user_id, limit=expanded_limit, offset=offset)
                # Validate the recommendations
                recommendations = self.validate_movie_ids(recommendations)
                logger.info(f"Returning {len(recommendations)} validated content-based recommendations (requested {expanded_limit})")
                # Limit to the requested number after validation
                recommendations = recommendations[:limit]
            else:
                # Deterministic random sampling with different seed
                random.seed((int(user_id) if user_id.isdigit() else sum(ord(c) for c in user_id)) + 100)
                all_recommendations = self.sample_movies.copy()
                random.shuffle(all_recommendations)
                
                # Apply pagination
                start_idx = offset % len(all_recommendations)
                recommendations = all_recommendations[start_idx:start_idx+limit]
                if len(recommendations) < limit:
                    recommendations += all_recommendations[:limit - len(recommendations)]
            
            return {"contentBased": recommendations}
            
        else:
            # Assume it's a genre
            if self.conn:
                # Request more recommendations than needed to ensure we have enough after validation
                expanded_limit = limit * 2
                recommendations = self.get_genre_movies(section, limit=expanded_limit, offset=offset)
                # Validate the recommendations
                recommendations = self.validate_movie_ids(recommendations)
                logger.info(f"Returning {len(recommendations)} validated genre recommendations for {section} (requested {expanded_limit})")
                # Limit to the requested number after validation
                recommendations = recommendations[:limit]
            else:
                # Deterministic random sampling with genre-specific seed
                genre_seed = sum(ord(c) for c in section)
                random.seed((int(user_id) if user_id.isdigit() else sum(ord(c) for c in user_id)) + genre_seed)
                all_recommendations = self.sample_movies.copy()
                random.shuffle(all_recommendations)
                
                # Apply pagination
                start_idx = offset % len(all_recommendations)
                recommendations = all_recommendations[start_idx:start_idx+limit]
                if len(recommendations) < limit:
                    recommendations += all_recommendations[:limit - len(recommendations)]
            
            return {"genres": {section: recommendations}}
    
    def generate_all_recommendations(self):
        """
        Generate recommendations for all sample users.
        If database connection is available, gets real users from the database.
        Otherwise, falls back to sample users 500-600.
        
        Returns:
            dict: A dictionary mapping user IDs to their recommendations.
        """
        all_recommendations = {}
        
        if self.conn:
            try:
                # Get a list of user IDs from the database
                cursor = self.conn.cursor()
                cursor.execute("SELECT TOP 100 user_id FROM movies_users")
                user_ids = [str(row.user_id) for row in cursor.fetchall()]
                cursor.close()
                
                if not user_ids:
                    # Fallback if no users found
                    user_ids = [str(i) for i in range(500, 600)]
                
            except Exception as e:
                logger.error(f"Error retrieving user IDs: {e}")
                # Fallback if error
                user_ids = [str(i) for i in range(500, 600)]
        else:
            # Fallback if no database connection
            user_ids = [str(i) for i in range(500, 600)]
        
        # Generate recommendations for each user
        for user_id in user_ids:
            try:
                logger.info(f"Generating all recommendations for user {user_id}")
                all_recommendations[user_id] = self.generate_recommendations(user_id)
            except Exception as e:
                logger.error(f"Error generating recommendations for user {user_id}: {str(e)}")
        
        return all_recommendations
