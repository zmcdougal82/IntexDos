#!/bin/bash

# Azure SQL Database connection parameters
SERVER="moviesapp-sql-79427.database.windows.net"
DATABASE="MoviesDB"
USERNAME="sqladmin"
PASSWORD="P@ssw0rd123!"

# File paths
MOVIES_CSV="/Users/zackmcdougal/IntexDos/updated_movies.csv"
USERS_CSV="/Users/zackmcdougal/IntexDos/movies_users.csv"
RATINGS_CSV="/Users/zackmcdougal/IntexDos/MoviesApp/movies_ratings.csv"

# Temporary files for SQL scripts
MOVIES_SQL="/tmp/movies_upload.sql"
USERS_SQL="/tmp/users_upload.sql"
RATINGS_SQL="/tmp/ratings_upload.sql"

echo "Starting data upload to Azure SQL Database..."

# Clear existing data
cat > /tmp/clear_data.sql << EOF
DELETE FROM movies_ratings;
DELETE FROM movies_users;
DELETE FROM movies_titles;
GO
EOF

echo "Clearing existing data..."
sqlcmd -S $SERVER -d $DATABASE -U $USERNAME -P $PASSWORD -i /tmp/clear_data.sql
echo "Existing data cleared."

# Function to create upload SQL for movies
create_movies_sql() {
    echo "USE $DATABASE;" > $MOVIES_SQL
    echo "GO" >> $MOVIES_SQL
    
    # Skip the header line
    tail -n +2 "$MOVIES_CSV" | while IFS="," read -r show_id type title director cast country release_year rating duration description action adventure anime british children comedies comedies_dramas comedies_intl comedies_romantic crime_tv documentaries documentaries_intl docuseries dramas dramas_intl dramas_romantic family fantasy horror intl_thrillers intl_tv_romantic kids_tv language_tv musicals nature_tv reality_tv spirituality tv_action tv_comedies tv_dramas talk_shows thrillers poster_url
    do
        # Escape single quotes in strings
        title=$(echo "$title" | sed "s/'/''/g")
        director=$(echo "$director" | sed "s/'/''/g")
        cast=$(echo "$cast" | sed "s/'/''/g")
        country=$(echo "$country" | sed "s/'/''/g")
        description=$(echo "$description" | sed "s/'/''/g")
        poster_url=$(echo "$poster_url" | sed "s/'/''/g")
        
        # Handle NULL values
        [[ -z "$release_year" || "$release_year" == "NULL" ]] && release_year="NULL" || release_year="$release_year"
        
        echo "INSERT INTO movies_titles (show_id, type, title, director, cast, country, release_year, rating, duration, description, Action, Adventure, AnimeSeriesInternationalTVShows, BritishTVShowsDocuseriesInternationalTVShows, Children, Comedies, ComediesDramasInternationalMovies, ComediesInternationalMovies, ComediesRomanticMovies, CrimeTVShowsDocuseries, Documentaries, DocumentariesInternationalMovies, Docuseries, Dramas, DramasInternationalMovies, DramasRomanticMovies, FamilyMovies, Fantasy, HorrorMovies, InternationalMoviesThrillers, InternationalTVShowsRomanticTVShowsTVDramas, KidsTV, LanguageTVShows, Musicals, NatureTV, RealityTV, Spirituality, TVAction, TVComedies, TVDramas, TalkShowsTVComedies, Thrillers, poster_url)" >> $MOVIES_SQL
        echo "VALUES ('$show_id', '$type', '$title', '$director', '$cast', '$country', $release_year, '$rating', '$duration', '$description', $action, $adventure, $anime, $british, $children, $comedies, $comedies_dramas, $comedies_intl, $comedies_romantic, $crime_tv, $documentaries, $documentaries_intl, $docuseries, $dramas, $dramas_intl, $dramas_romantic, $family, $fantasy, $horror, $intl_thrillers, $intl_tv_romantic, $kids_tv, $language_tv, $musicals, $nature_tv, $reality_tv, $spirituality, $tv_action, $tv_comedies, $tv_dramas, $talk_shows, $thrillers, '$poster_url');" >> $MOVIES_SQL
    done
    
    echo "GO" >> $MOVIES_SQL
}

# Function to create upload SQL for users
create_users_sql() {
    echo "USE $DATABASE;" > $USERS_SQL
    echo "GO" >> $USERS_SQL
    
    # Skip the header line
    tail -n +2 "$USERS_CSV" | while IFS="," read -r user_id name phone email age gender netflix amazon_prime disney paramount max hulu apple peacock city state zip
    do
        # Escape single quotes in strings
        name=$(echo "$name" | sed "s/'/''/g")
        phone=$(echo "$phone" | sed "s/'/''/g")
        email=$(echo "$email" | sed "s/'/''/g")
        city=$(echo "$city" | sed "s/'/''/g")
        state=$(echo "$state" | sed "s/'/''/g")
        zip=$(echo "$zip" | sed "s/'/''/g")
        
        # Handle NULL values
        [[ -z "$age" || "$age" == "NULL" ]] && age="NULL" || age="$age"
        
        echo "INSERT INTO movies_users (user_id, name, phone, email, age, gender, Netflix, AmazonPrime, DisneyPlus, ParamountPlus, Max, Hulu, AppleTVPlus, Peacock, city, state, zip, role, password_hash)" >> $USERS_SQL
        echo "VALUES ($user_id, '$name', '$phone', '$email', $age, '$gender', $netflix, $amazon_prime, $disney, $paramount, $max, $hulu, $apple, $peacock, '$city', '$state', '$zip', 'User', NULL);" >> $USERS_SQL
    done
    
    echo "GO" >> $USERS_SQL
}

# Function to create upload SQL for ratings
create_ratings_sql() {
    echo "USE $DATABASE;" > $RATINGS_SQL
    echo "GO" >> $RATINGS_SQL
    
    # Get the current timestamp
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    
    # Skip the header line
    tail -n +2 "$RATINGS_CSV" | while IFS="," read -r user_id show_id rating
    do
        echo "INSERT INTO movies_ratings (user_id, show_id, rating, timestamp)" >> $RATINGS_SQL
        echo "VALUES ($user_id, '$show_id', $rating, '$TIMESTAMP');" >> $RATINGS_SQL
    done
    
    echo "GO" >> $RATINGS_SQL
}

# Upload movies
echo "Creating movies SQL script..."
create_movies_sql
echo "Uploading movies data..."
sqlcmd -S $SERVER -d $DATABASE -U $USERNAME -P $PASSWORD -i $MOVIES_SQL
echo "Movies data uploaded."

# Upload users
echo "Creating users SQL script..."
create_users_sql
echo "Uploading users data..."
sqlcmd -S $SERVER -d $DATABASE -U $USERNAME -P $PASSWORD -i $USERS_SQL
echo "Users data uploaded."

# Upload ratings
echo "Creating ratings SQL script..."
create_ratings_sql
echo "Uploading ratings data..."
sqlcmd -S $SERVER -d $DATABASE -U $USERNAME -P $PASSWORD -i $RATINGS_SQL
echo "Ratings data uploaded."

echo "Data upload completed successfully!"
