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
    
    def get_genre_movies(self, genre, limit=10):
        """Get movies for a specific genre with good ratings"""
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
            SELECT TOP (?) m.show_id 
            FROM movies_titles m
            JOIN (
                SELECT show_id, AVG(CAST(rating AS FLOAT)) as avg_rating
                FROM movies_ratings
                GROUP BY show_id
                HAVING AVG(CAST(rating AS FLOAT)) >= 3.5
            ) r ON m.show_id = r.show_id
            WHERE [{sanitized_genre}] > 0
            ORDER BY r.avg_rating DESC
            """
            cursor.execute(query, (limit,))
            
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
    
    def get_collaborative_recommendations(self, user_id, limit=10):
        """Get collaborative filtering recommendations for a user"""
        if not self.conn:
            # If no database connection, return sample movies
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
            
        try:
            cursor = self.conn.cursor()
            # Find users who rated the same movies similarly
            # This is a simplified collaborative filtering approach that now filters for positive ratings (>=3.5)
            query = """
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
            """
            cursor.execute(query, (limit, user_id, user_id))
            
            # Ensure all IDs are in the 's' prefix format
            collaborative = []
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
                collaborative.append(show_id)
            
            cursor.close()
            
            if not collaborative:
                # Fallback if no collaborative recommendations found
                logger.info(f"No collaborative recommendations found for user {user_id}, using popular movies")
                return self.get_popular_movies(limit)
                
            logger.info(f"Retrieved {len(collaborative)} collaborative recommendations for user {user_id}")
            return collaborative
        except Exception as e:
            logger.error(f"Error retrieving collaborative recommendations: {e}")
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
    
    def get_content_based_recommendations(self, user_id, limit=10):
        """Get content-based recommendations for a user"""
        if not self.conn:
            # If no database connection, return sample movies
            return random.sample(self.sample_movies, min(limit, len(self.sample_movies)))
            
        try:
            cursor = self.conn.cursor()
            # Find movies similar to ones the user has rated highly
            # This is a simplified content-based approach
            query = """
            SELECT TOP (?) m2.show_id
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
            """
            cursor.execute(query, (limit, user_id, user_id))
            
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
    
    def generate_recommendations(self, user_id):
        """
        Generate recommendations for a specific user.
        
        Args:
            user_id (str): The user ID to generate recommendations for.
            
        Returns:
            dict: A dictionary containing collaborative, content-based, and genre recommendations.
        """
        logger.info(f"Generating all recommendations for user {user_id}")
        
        # Get recommendations from database if connection is available
        if self.conn:
            # Get collaborative filtering recommendations
            collaborative = self.get_collaborative_recommendations(user_id)
            logger.info(f"Found {len(collaborative)} collaborative recommendations")
            
            # Get content-based recommendations
            content_based = self.get_content_based_recommendations(user_id)
            logger.info(f"Found {len(content_based)} content-based recommendations")
            
            # Get genre-based recommendations
            genres_dict = {}
            available_genres = self.get_available_genres()
            selected_genres = random.sample(available_genres, min(3, len(available_genres)))
            
            for genre in selected_genres:
                genres_dict[genre] = self.get_genre_movies(genre, limit=5)
            
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
