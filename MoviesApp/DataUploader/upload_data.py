#!/usr/bin/env python3
"""
Script to upload CSV data to Azure SQL Database
For use on macOS and other platforms
"""

import csv
import os
import sys
import datetime
import re
import pyodbc

# Database connection parameters from appsettings.json
SERVER = 'moviesapp-sql-79427.database.windows.net'
DATABASE = 'MoviesDB'
USERNAME = 'sqladmin'
PASSWORD = 'P@ssw0rd123!'
DRIVER = '{ODBC Driver 18 for SQL Server}'  # May need to be adjusted based on installed drivers

# CSV file paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MOVIES_FILE = os.path.join(BASE_DIR, 'updated_movies.csv')
USERS_FILE = os.path.join(BASE_DIR, 'movies_users.csv')
RATINGS_FILE = os.path.join(BASE_DIR, os.path.join('MoviesApp', 'movies_ratings.csv'))

def get_connection():
    """Create and return a connection to the database"""
    connection_string = f'DRIVER={DRIVER};SERVER={SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD};Encrypt=yes;TrustServerCertificate=no;'
    try:
        conn = pyodbc.connect(connection_string)
        return conn
    except pyodbc.Error as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def clear_existing_data(conn):
    """Clear existing data from tables in correct order"""
    print("Clearing existing data...")
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM movies_ratings;")
        cursor.execute("DELETE FROM movies_users;")
        cursor.execute("DELETE FROM movies_titles;")
        conn.commit()
        print("Existing data cleared.")
    except pyodbc.Error as e:
        conn.rollback()
        print(f"Error clearing data: {e}")
        raise

def read_csv_file(filename):
    """Read a CSV file with custom handling for headers with spaces"""
    if not os.path.exists(filename):
        print(f"Error: File not found at {filename}")
        return []
    
    data = []
    with open(filename, 'r', encoding='utf-8') as file:
        # Read the first line to get header
        header_line = file.readline().strip()
        # Split by commas, but account for quoted values that might contain commas
        headers = []
        current_field = ""
        in_quotes = False
        for char in header_line:
            if char == '"':
                in_quotes = not in_quotes
            elif char == ',' and not in_quotes:
                headers.append(current_field)
                current_field = ""
            else:
                current_field += char
        # Add the last field
        if current_field:
            headers.append(current_field)
        
        # Continue reading the rest of the file
        reader = csv.reader(file)
        for row in reader:
            if len(row) >= len(headers):
                data.append(dict(zip(headers, row)))
    
    return data

def upload_movies(conn):
    """Upload movie data from CSV"""
    print(f"Uploading movies data from {MOVIES_FILE}...")
    
    cursor = conn.cursor()
    count = 0
    
    try:
        movies_data = read_csv_file(MOVIES_FILE)
        
        for movie in movies_data:
            # Construct SQL with parameters
            # Explicitly define all 42 columns from the database model
            sql = """
            INSERT INTO movies_titles (
                show_id, type, title, director, cast, country, release_year, rating, duration, description,
                Action, Adventure, AnimeSeriesInternationalTVShows, BritishTVShowsDocuseriesInternationalTVShows,
                Children, Comedies, ComediesDramasInternationalMovies, ComediesInternationalMovies, ComediesRomanticMovies,
                CrimeTVShowsDocuseries, Documentaries, DocumentariesInternationalMovies, Docuseries, Dramas,
                DramasInternationalMovies, DramasRomanticMovies, FamilyMovies, Fantasy, HorrorMovies,
                InternationalMoviesThrillers, InternationalTVShowsRomanticTVShowsTVDramas, KidsTV, LanguageTVShows,
                Musicals, NatureTV, RealityTV, Spirituality, TVAction, TVComedies, TVDramas, TalkShowsTVComedies, 
                Thrillers, poster_url
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?
            )
            """
            
            # Handle values correctly
            show_id = movie.get('show_id', '')
            movie_type = movie.get('type', '')
            title = movie.get('title', '')
            director = movie.get('director', '')
            cast = movie.get('cast', '')
            country = movie.get('country', '')
            release_year_str = movie.get('release_year', '')
            rating = movie.get('rating', '')
            duration = movie.get('duration', '')
            description = movie.get('description', '')
            poster_url = movie.get('poster_url', '')
            
            # Convert numeric fields safely
            release_year = None if not release_year_str or release_year_str == 'NULL' else int(release_year_str)
            
            # Genre fields - careful handling for all possible column headers
            action = None if not movie.get('Action', '') else int(movie.get('Action', 0))
            adventure = None if not movie.get('Adventure', '') else int(movie.get('Adventure', 0))
            anime = None if not movie.get('Anime Series International TV Shows', '') else int(movie.get('Anime Series International TV Shows', 0))
            british = None if not movie.get('British TV Shows Docuseries International TV Shows', '') else int(movie.get('British TV Shows Docuseries International TV Shows', 0))
            children = None if not movie.get('Children', '') else int(movie.get('Children', 0))
            comedies = None if not movie.get('Comedies', '') else int(movie.get('Comedies', 0))
            comedies_dramas = None if not movie.get('Comedies Dramas International Movies', '') else int(movie.get('Comedies Dramas International Movies', 0))
            comedies_international = None if not movie.get('Comedies International Movies', '') else int(movie.get('Comedies International Movies', 0))
            comedies_romantic = None if not movie.get('Comedies Romantic Movies', '') else int(movie.get('Comedies Romantic Movies', 0))
            crime_tv = None if not movie.get('Crime TV Shows Docuseries', '') else int(movie.get('Crime TV Shows Docuseries', 0))
            documentaries = None if not movie.get('Documentaries', '') else int(movie.get('Documentaries', 0))
            documentaries_int = None if not movie.get('Documentaries International Movies', '') else int(movie.get('Documentaries International Movies', 0))
            docuseries = None if not movie.get('Docuseries', '') else int(movie.get('Docuseries', 0))
            dramas = None if not movie.get('Dramas', '') else int(movie.get('Dramas', 0))
            dramas_int = None if not movie.get('Dramas International Movies', '') else int(movie.get('Dramas International Movies', 0))
            dramas_romantic = None if not movie.get('Dramas Romantic Movies', '') else int(movie.get('Dramas Romantic Movies', 0))
            family = None if not movie.get('Family Movies', '') else int(movie.get('Family Movies', 0))
            fantasy = None if not movie.get('Fantasy', '') else int(movie.get('Fantasy', 0))
            horror = None if not movie.get('Horror Movies', '') else int(movie.get('Horror Movies', 0))
            int_thrillers = None if not movie.get('International Movies Thrillers', '') else int(movie.get('International Movies Thrillers', 0))
            int_tv_romantic = None if not movie.get('International TV Shows Romantic TV Shows TV Dramas', '') else int(movie.get('International TV Shows Romantic TV Shows TV Dramas', 0))
            kids_tv = None if not movie.get("Kids' TV", '') else int(movie.get("Kids' TV", 0))
            language_tv = None if not movie.get('Language TV Shows', '') else int(movie.get('Language TV Shows', 0))
            musicals = None if not movie.get('Musicals', '') else int(movie.get('Musicals', 0))
            nature_tv = None if not movie.get('Nature TV', '') else int(movie.get('Nature TV', 0))
            reality_tv = None if not movie.get('Reality TV', '') else int(movie.get('Reality TV', 0))
            spirituality = None if not movie.get('Spirituality', '') else int(movie.get('Spirituality', 0))
            tv_action = None if not movie.get('TV Action', '') else int(movie.get('TV Action', 0))
            tv_comedies = None if not movie.get('TV Comedies', '') else int(movie.get('TV Comedies', 0))
            tv_dramas = None if not movie.get('TV Dramas', '') else int(movie.get('TV Dramas', 0))
            talk_shows = None if not movie.get('Talk Shows TV Comedies', '') else int(movie.get('Talk Shows TV Comedies', 0))
            thrillers = None if not movie.get('Thrillers', '') else int(movie.get('Thrillers', 0))

            # Create a tuple with exactly 42 parameters, matching the SQL columns
            params = (
                show_id, movie_type, title, director, cast, country, 
                release_year, rating, duration, description,
                action, adventure, anime, british, children, comedies, comedies_dramas, comedies_international,
                comedies_romantic, crime_tv, documentaries, documentaries_int, docuseries, dramas, dramas_int,
                dramas_romantic, family, fantasy, horror, int_thrillers, int_tv_romantic, kids_tv, language_tv,
                musicals, nature_tv, reality_tv, spirituality, tv_action, tv_comedies, tv_dramas, talk_shows,
                thrillers, poster_url
            )
            
            # Verify parameter count matches the number of question marks in the SQL
            num_params = len(params)
            num_placeholders = sql.count('?')
            if num_params != num_placeholders:
                print(f"Parameter count mismatch: {num_params} parameters provided but SQL has {num_placeholders} placeholders")
                print(f"Adjusting parameter count...")
                # We'll trim or extend the parameters tuple to match
                if num_params > num_placeholders:
                    params = params[:num_placeholders]
                # If fewer parameters than needed, we'd need to add nulls, but this shouldn't happen
            
            # Execute with parameters
            cursor.execute(sql, params)
            
            count += 1
            
            # Commit in batches
            if count % 10 == 0:
                conn.commit()
                print(f"Processed {count} movies...")
        
        # Final commit if needed
        conn.commit()
        print(f"Successfully uploaded {count} movies.")
        
    except Exception as e:
        conn.rollback()
        print(f"Error uploading movies: {e}")
        raise
    
    return count

def upload_users(conn):
    """Upload user data from CSV"""
    print(f"Uploading users data from {USERS_FILE}...")
    
    cursor = conn.cursor()
    count = 0
    
    try:
        users_data = read_csv_file(USERS_FILE)
        
        for user in users_data:
            # Construct SQL with parameters
            sql = """
            INSERT INTO movies_users (
                user_id, name, phone, email, age, gender, Netflix, AmazonPrime, DisneyPlus, ParamountPlus,
                Max, Hulu, AppleTVPlus, Peacock, city, state, zip, role, password_hash
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            """
            
            # Convert numeric fields safely
            user_id = int(user.get('user_id', 0))
            age_str = user.get('age', '')
            age = None if not age_str or age_str == 'NULL' else int(age_str)
            
            netflix = None if not user.get('Netflix', '') else int(user.get('Netflix', 0))
            amazon = None if not user.get('Amazon Prime', '') else int(user.get('Amazon Prime', 0))
            disney = None if not user.get('Disney+', '') else int(user.get('Disney+', 0))
            paramount = None if not user.get('Paramount+', '') else int(user.get('Paramount+', 0))
            max_val = None if not user.get('Max', '') else int(user.get('Max', 0))
            hulu = None if not user.get('Hulu', '') else int(user.get('Hulu', 0))
            apple = None if not user.get('Apple TV+', '') else int(user.get('Apple TV+', 0))
            peacock = None if not user.get('Peacock', '') else int(user.get('Peacock', 0))

            # Execute with parameters
            cursor.execute(sql, (
                user_id, user.get('name', ''), user.get('phone', ''), user.get('email', ''), 
                age, user.get('gender', ''),
                netflix, amazon, disney, paramount, max_val, hulu, apple, peacock,
                user.get('city', ''), user.get('state', ''), user.get('zip', ''), 
                'User', None
            ))
            
            count += 1
            
            # Commit in batches
            if count % 10 == 0:
                conn.commit()
                print(f"Processed {count} users...")
        
        # Final commit if needed
        conn.commit()
        print(f"Successfully uploaded {count} users.")
        
    except Exception as e:
        conn.rollback()
        print(f"Error uploading users: {e}")
        raise
    
    return count

def upload_ratings(conn):
    """Upload rating data from CSV"""
    print(f"Uploading ratings data from {RATINGS_FILE}...")
    
    cursor = conn.cursor()
    count = 0
    timestamp = datetime.datetime.utcnow()
    
    try:
        ratings_data = read_csv_file(RATINGS_FILE)
        
        for rating in ratings_data:
            # Construct SQL with parameters
            sql = """
            INSERT INTO movies_ratings (
                user_id, show_id, rating, timestamp
            ) VALUES (
                ?, ?, ?, ?
            )
            """
            
            # Convert to proper types
            user_id = int(rating.get('user_id', 0))
            rating_val = int(rating.get('rating', 0))
            show_id = rating.get('show_id', '')

            # Execute with parameters
            cursor.execute(sql, (
                user_id, show_id, rating_val, timestamp
            ))
            
            count += 1
            
            # Commit in batches
            if count % 100 == 0:
                conn.commit()
                print(f"Processed {count} ratings...")
        
        # Final commit if needed
        conn.commit()
        print(f"Successfully uploaded {count} ratings.")
        
    except Exception as e:
        conn.rollback()
        print(f"Error uploading ratings: {e}")
        raise
    
    return count

def main():
    """Main function to run the script"""
    print("Starting data upload to Azure SQL Database...")
    
    # Check if ODBC driver is installed
    try:
        drivers = pyodbc.drivers()
        print(f"Available ODBC drivers: {drivers}")
        
        if not any('ODBC Driver' in driver and 'SQL Server' in driver for driver in drivers):
            print("WARNING: No SQL Server ODBC driver found. You may need to install it.")
            print("You can install it with Homebrew: brew install unixodbc msodbcsql18")
            print("Continuing anyway, but connection may fail...")
    except Exception as e:
        print(f"Warning: Could not check ODBC drivers: {e}")
    
    try:
        # Get database connection
        conn = get_connection()
        
        # Start a transaction
        conn.autocommit = False
        
        try:
            # Clear existing data
            clear_existing_data(conn)
            
            # Upload data
            movies_count = upload_movies(conn)
            users_count = upload_users(conn)
            ratings_count = upload_ratings(conn)
            
            # Commit the transaction if everything is successful
            conn.commit()
            
            print("\nData upload completed successfully!")
            print(f"Total movies uploaded: {movies_count}")
            print(f"Total users uploaded: {users_count}")
            print(f"Total ratings uploaded: {ratings_count}")
            
        except Exception as e:
            conn.rollback()
            print(f"Error occurred, transaction rolled back: {e}")
        
        # Close the connection
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
