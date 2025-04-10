
import os
import json
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import pyodbc
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('recommendation_service')

# Load environment variables from .env file
load_dotenv()
class RecommendationService:
    def __init__(self):
        self.conn_str = self._get_connection_string()
        self.ratings_df = None
        self.movies_df = None
        self.users_df = None
        self.user_item_matrix = None
        self.movie_features = None
        self.movie_genre_matrix = None
        self.genre_columns = None
        
        # Load data on initialization
        self.refresh_data()
        
    def _get_connection_string(self):
        """Build connection string from environment variables"""
        server = os.getenv('DB_SERVER')
        database = os.getenv('DB_NAME')
        username = os.getenv('DB_USERNAME')
        password = os.getenv('DB_PASSWORD')
        
        if None in (server, database, username, password):
            raise ValueError("Database connection information missing from environment variables")
            
        return f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
    
    def refresh_data(self):
        """Refresh all data from the database"""
        try:
            logger.info("Refreshing recommendation data from database")
            self._load_data_from_db()
            self._prepare_matrices()
            logger.info("Data refresh complete")
        except Exception as e:
            logger.error(f"Error refreshing data: {str(e)}")
            raise
    
    def _load_data_from_db(self):
        """Load ratings, movies, and users data from database"""
        try:
            conn = pyodbc.connect(self.conn_str)
            
            # Load ratings
            self.ratings_df = pd.read_sql("""
                SELECT user_id as UserId, show_id as ShowId, rating as RatingValue, timestamp
                FROM movies_ratings
            """, conn)
            
            # Load movies with genre data
            self.movies_df = pd.read_sql("""
                SELECT show_id as ShowId, title as Title, director as Director, 
                       cast as Cast, country as Country, release_year as ReleaseYear,
                       rating as Rating, duration as Duration, description as Description,
                       poster_url as PosterUrl,
                       Action, Adventure, Comedies, Dramas, HorrorMovies, Thrillers, 
                       Documentaries, FamilyMovies, Fantasy, Children
                FROM movies_titles
            """, conn)
            
            # Load users
            self.users_df = pd.read_sql("""
                SELECT user_id as UserId, name as Name, email as Email,
                       gender as Gender, age as Age
                FROM movies_users
            """, conn)
            
            logger.info(f"Loaded {len(self.ratings_df)} ratings, {len(self.movies_df)} movies, {len(self.users_df)} users")
            conn.close()
            
        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            raise
    
    def _prepare_matrices(self):
        """Prepare all matrices needed for recommendations"""
        if self.ratings_df is None or self.movies_df is None:
            logger.error("Cannot prepare matrices: data not loaded")
            return
            
        # Create user-item matrix for collaborative filtering
        self.user_item_matrix = self.ratings_df.pivot_table(
            index='UserId',
            columns='ShowId',
            values='RatingValue',
            fill_value=0
        )
        
        # Identify genre columns
        self.genre_columns = [col for col in self.movies_df.columns if col in [
            'Action', 'Adventure', 'Comedies', 'Dramas', 'HorrorMovies', 
            'Thrillers', 'Documentaries', 'FamilyMovies', 'Fantasy', 'Children'
        ]]
        
        # Create movie-genre matrix
        self.movie_genre_matrix = self.movies_df[['ShowId'] + self.genre_columns].set_index('ShowId').fillna(0)
        
        # Create movie features matrix for content-based recommendations
        self.movie_features = self.movies_df.copy()
        
        # Handle missing values
        for col in self.genre_columns:
            self.movie_features[col] = self.movie_features[col].fillna(0)
            
        # Create feature vectors for movies
        feature_cols = self.genre_columns + ['ReleaseYear']
        
        # Standardize numerical features
        scaler = StandardScaler()
        self.movie_features[feature_cols] = self.movie_features[feature_cols].fillna(0)
        
        # Some features may not be fully numeric, ensure they are
        for col in feature_cols:
            if self.movie_features[col].dtype == 'object':
                self.movie_features[col] = pd.to_numeric(self.movie_features[col], errors='coerce').fillna(0)
                
        # Scale features
        self.movie_features[feature_cols] = scaler.fit_transform(self.movie_features[feature_cols])
        
        logger.info("Prepared matrices for recommendations")
    
    def get_collaborative_recommendations(self, user_id, n=10):
        """Generate recommendations using collaborative filtering"""
        try:
            logger.info(f"Generating collaborative recommendations for user {user_id}")
            # Convert string user_id to integer if needed
            try:
                if isinstance(user_id, str) and user_id.isdigit():
                    user_id = int(user_id)
            except:
                pass
                
            # Check if user has ratings
            if user_id not in self.user_item_matrix.index:
                logger.info(f"User {user_id} not found in user-item matrix")
                return []
                
            # Get user's ratings
            user_ratings = self.user_item_matrix.loc[user_id]
            
            # Find similar users
            user_similarities = cosine_similarity(
                [user_ratings], 
                self.user_item_matrix.values
            )[0]
            
            # Get indices of similar users (excluding the user themselves)
            similar_user_indices = np.argsort(user_similarities)[::-1][1:11]  # top 10 similar users
            similar_users = [self.user_item_matrix.index[i] for i in similar_user_indices]
            
            # Movies the user has already rated
            user_rated_movies = set(self.ratings_df[self.ratings_df['UserId'] == user_id]['ShowId'])
            
            # Collect similar users' highly rated movies
            similar_user_ratings = self.ratings_df[
                (self.ratings_df['UserId'].isin(similar_users)) & 
                (self.ratings_df['RatingValue'] >= 4)
            ]
            
            # Count movie recommendations
            movie_recs = similar_user_ratings['ShowId'].value_counts().reset_index()
            movie_recs.columns = ['ShowId', 'RecCount']
            
            # Filter out movies the user has already rated
            new_recommendations = movie_recs[~movie_recs['ShowId'].isin(user_rated_movies)]
            
            recommendations = new_recommendations.head(n)['ShowId'].tolist()
            logger.info(f"Found {len(recommendations)} collaborative recommendations")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in collaborative recommendations: {str(e)}")
            return []
    
    def get_content_based_recommendations(self, user_id, n=10):
        """Generate content-based recommendations"""
        try:
            logger.info(f"Generating content-based recommendations for user {user_id}")
            # Convert string user_id to integer if needed
            try:
                if isinstance(user_id, str) and user_id.isdigit():
                    user_id = int(user_id)
            except:
                pass
                
            # Get user's highly rated movies
            user_ratings = self.ratings_df[
                (self.ratings_df['UserId'] == user_id) & 
                (self.ratings_df['RatingValue'] >= 4)
            ]
            
            if user_ratings.empty:
                logger.info(f"User {user_id} has no high ratings for content-based filtering")
                return []
                
            # Movies the user has already rated
            user_rated_movies = set(self.ratings_df[self.ratings_df['UserId'] == user_id]['ShowId'])
            
            # Get the feature vectors for the user's liked movies
            user_movie_features = self.movie_features[
                self.movie_features['ShowId'].isin(user_ratings['ShowId'])
            ]
            
            if user_movie_features.empty:
                logger.info("No feature data found for user's rated movies")
                return []
                
            # Calculate average feature vector for user's taste
            feature_cols = self.genre_columns + ['ReleaseYear']
            user_profile = user_movie_features[feature_cols].mean(axis=0)
            
            # Compute similarity between user profile and all movies
            all_movies = self.movie_features.copy()
            all_movies['similarity'] = all_movies[feature_cols].apply(
                lambda x: cosine_similarity([x], [user_profile])[0][0], 
                axis=1
            )
            
            # Filter out movies the user has already rated
            new_recommendations = all_movies[~all_movies['ShowId'].isin(user_rated_movies)]
            
            # Sort by similarity and get top n
            recommendations = new_recommendations.sort_values('similarity', ascending=False).head(n)['ShowId'].tolist()
            logger.info(f"Found {len(recommendations)} content-based recommendations")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in content-based recommendations: {str(e)}")
            return []
    
    def get_genre_recommendations(self, user_id, n=5, genre=None):
        """Generate genre-specific recommendations"""
        try:
            logger.info(f"Generating genre recommendations for user {user_id}, genre={genre}")
            # Convert string user_id to integer if needed
            try:
                if isinstance(user_id, str) and user_id.isdigit():
                    user_id = int(user_id)
            except:
                pass
                
            # Get user's ratings
            user_ratings = self.ratings_df[self.ratings_df['UserId'] == user_id]
            
            if user_ratings.empty:
                logger.info(f"User {user_id} has no ratings for genre recommendations")
                return {}
            
            # Movies the user has already rated
            user_rated_movies = set(user_ratings['ShowId'])
            
            # Determine user's favorite genres
            user_rated_movie_ids = user_ratings['ShowId'].tolist()
            user_rated_movie_genres = self.movie_genre_matrix.loc[
                self.movie_genre_matrix.index.isin(user_rated_movie_ids)
            ]
            
            if user_rated_movie_genres.empty:
                logger.info("No genre data found for user's rated movies")
                return {}
                
            # Calculate genre preferences (weighted by ratings)
            genre_preferences = {}
            for genre_col in self.genre_columns:
                genre_ratings = []
                for movie_id, rating_row in user_ratings.iterrows():
                    movie_id = rating_row['ShowId']
                    if movie_id in user_rated_movie_genres.index:
                        genre_value = user_rated_movie_genres.loc[movie_id, genre_col]
                        if genre_value > 0:  # Only consider if movie is in this genre
                            genre_ratings.append(rating_row['RatingValue'])
                
                if genre_ratings:
                    genre_preferences[genre_col] = sum(genre_ratings) / len(genre_ratings)
                else:
                    genre_preferences[genre_col] = 0
            
            # If specific genre requested, only return that one
            if genre and genre in self.genre_columns:
                genres_to_recommend = [genre]
            else:
                # Sort genres by preference
                sorted_genres = sorted(
                    genre_preferences.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )
                # Take top 3 genres
                genres_to_recommend = [g[0] for g in sorted_genres[:3] if g[1] > 0]
            
            # Generate recommendations for each genre
            genre_recommendations = {}
            for genre_name in genres_to_recommend:
                # Find movies in this genre that user hasn't rated
                genre_movies = self.movie_genre_matrix[self.movie_genre_matrix[genre_name] > 0]
                new_genre_movies = genre_movies[~genre_movies.index.isin(user_rated_movies)]
                
                if len(new_genre_movies) > 0:
                    # Sort by genre strength
                    sorted_movies = new_genre_movies.sort_values(genre_name, ascending=False)
                    recommendations = sorted_movies.index.tolist()[:n]
                    genre_recommendations[genre_name] = recommendations
            
            logger.info(f"Generated recommendations for {len(genre_recommendations)} genres")
            return genre_recommendations
            
        except Exception as e:
            logger.error(f"Error in genre recommendations: {str(e)}")
            return {}
    
    def get_all_recommendations(self, user_id):
        """Get all types of recommendations for a user"""
        try:
            logger.info(f"Generating all recommendations for user {user_id}")
            
            # Get recommendations using different methods
            collaborative_recs = self.get_collaborative_recommendations(user_id, n=10)
            content_recs = self.get_content_based_recommendations(user_id, n=10)
            genre_recs = self.get_genre_recommendations(user_id, n=5)
            
            # Format response
            recommendations = {
                "collaborative": collaborative_recs,
                "contentBased": content_recs,
                "genres": genre_recs
            }
            
            logger.info(f"Generated all recommendations for user {user_id}")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating all recommendations: {str(e)}")
            return {
                "collaborative": [],
                "contentBased": [],
                "genres": {}
            }
    
    def generate_recommendations_file(self, output_path="recommendations.json"):
        """Generate recommendations for all users and save to a JSON file"""
        try:
            logger.info(f"Generating recommendations file for all users")
            
            all_recommendations = {}
            
            # Get all user IDs
            user_ids = self.ratings_df['UserId'].unique()
            
            # Generate recommendations for each user
            for user_id in user_ids:
                all_recommendations[str(user_id)] = self.get_all_recommendations(user_id)
            
            # Save to JSON file
            with open(output_path, 'w') as f:
                json.dump(all_recommendations, f, indent=2)
                
            logger.info(f"Saved recommendations for {len(user_ids)} users to {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error generating recommendations file: {str(e)}")
            return False
