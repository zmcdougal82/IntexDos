-- Create Movies table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'movies_titles')
BEGIN
    CREATE TABLE movies_titles (
        show_id NVARCHAR(50) PRIMARY KEY,
        type NVARCHAR(50),
        title NVARCHAR(255),
        director NVARCHAR(255),
        cast NVARCHAR(MAX),
        country NVARCHAR(255),
        release_year INT,
        rating NVARCHAR(50),
        duration NVARCHAR(50),
        description NVARCHAR(MAX),
        Action INT,
        Adventure INT,
        AnimeSeriesInternationalTVShows INT,
        BritishTVShowsDocuseriesInternationalTVShows INT,
        Children INT,
        Comedies INT,
        ComediesDramasInternationalMovies INT,
        ComediesInternationalMovies INT,
        ComediesRomanticMovies INT,
        CrimeTVShowsDocuseries INT,
        Documentaries INT,
        DocumentariesInternationalMovies INT,
        Docuseries INT,
        Dramas INT,
        DramasInternationalMovies INT,
        DramasRomanticMovies INT,
        FamilyMovies INT,
        Fantasy INT,
        HorrorMovies INT,
        InternationalMoviesThrillers INT,
        InternationalTVShowsRomanticTVShowsTVDramas INT,
        KidsTV INT,
        LanguageTVShows INT,
        Musicals INT,
        NatureTV INT,
        RealityTV INT,
        Spirituality INT,
        TVAction INT,
        TVComedies INT,
        TVDramas INT,
        TalkShowsTVComedies INT,
        Thrillers INT,
        poster_url NVARCHAR(MAX)
    );
END

-- Create Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'movies_users')
BEGIN
    CREATE TABLE movies_users (
        user_id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100),
        phone NVARCHAR(50),
        email NVARCHAR(255),
        age INT,
        gender NVARCHAR(20),
        Netflix INT,
        AmazonPrime INT,
        DisneyPlus INT,
        ParamountPlus INT,
        Max INT,
        Hulu INT,
        AppleTVPlus INT,
        Peacock INT,
        city NVARCHAR(100),
        state NVARCHAR(50),
        zip NVARCHAR(20),
        password_hash NVARCHAR(MAX),
        role NVARCHAR(50)
    );
    
    -- Create unique email index
    CREATE UNIQUE INDEX idx_users_email ON movies_users(email);
END

-- Create Ratings table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'movies_ratings')
BEGIN
    CREATE TABLE movies_ratings (
        user_id INT,
        show_id NVARCHAR(50),
        rating INT,
        timestamp DATETIME DEFAULT GETDATE(),
        PRIMARY KEY (user_id, show_id),
        FOREIGN KEY (user_id) REFERENCES movies_users(user_id),
        FOREIGN KEY (show_id) REFERENCES movies_titles(show_id)
    );
    
    -- Create indexes
    CREATE INDEX idx_ratings_user_id ON movies_ratings(user_id);
    CREATE INDEX idx_ratings_show_id ON movies_ratings(show_id);
END

-- Insert sample movies
INSERT INTO movies_titles (show_id, type, title, director, cast, country, release_year, rating, duration, description, Dramas, Thrillers, poster_url)
VALUES ('m1', 'Movie', 'The Shawshank Redemption', 'Frank Darabont', 'Tim Robbins, Morgan Freeman', 'United States', 1994, 'R', '142 min', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 1, 0, '/default.jpg');

INSERT INTO movies_titles (show_id, type, title, director, cast, country, release_year, rating, duration, description, Dramas, Thrillers, poster_url)
VALUES ('m2', 'Movie', 'The Godfather', 'Francis Ford Coppola', 'Marlon Brando, Al Pacino', 'United States', 1972, 'R', '175 min', 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', 1, 0, '/default.jpg');

INSERT INTO movies_titles (show_id, type, title, director, cast, country, release_year, rating, duration, description, Dramas, Thrillers, poster_url)
VALUES ('m3', 'Movie', 'The Dark Knight', 'Christopher Nolan', 'Christian Bale, Heath Ledger', 'United States', 2008, 'PG-13', '152 min', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 0, 1, '/default.jpg');

INSERT INTO movies_titles (show_id, type, title, director, cast, country, release_year, rating, duration, description, Dramas, Comedies, poster_url)
VALUES ('m4', 'Movie', 'Forrest Gump', 'Robert Zemeckis', 'Tom Hanks, Robin Wright', 'United States', 1994, 'PG-13', '142 min', 'The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate, and other historical events unfold through the perspective of an Alabama man with an IQ of 75.', 1, 1, '/default.jpg');

INSERT INTO movies_titles (show_id, type, title, director, cast, country, release_year, rating, duration, description, Dramas, Thrillers, poster_url)
VALUES ('m5', 'Movie', 'Pulp Fiction', 'Quentin Tarantino', 'John Travolta, Uma Thurman', 'United States', 1994, 'R', '154 min', 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', 1, 1, '/default.jpg');

-- Insert sample users
INSERT INTO movies_users (name, email, password_hash, role) 
VALUES ('Admin User', 'admin@example.com', 'AQAAAAEAACcQAAAAEHxA9KK8xQY1AJA1/WyUJd7ZAiNCWVvLN4GHmNM/GGXbyM87KfILF6T4NCCgzU4rJw==', 'Admin');

INSERT INTO movies_users (name, email, password_hash, role)
VALUES ('Test User', 'user@example.com', 'AQAAAAEAACcQAAAAEHxA9KK8xQY1AJA1/WyUJd7ZAiNCWVvLN4GHmNM/GGXbyM87KfILF6T4NCCgzU4rJw==', 'User');

-- Insert sample ratings
INSERT INTO movies_ratings (user_id, show_id, rating, timestamp)
VALUES (1, 'm1', 5, GETDATE());

INSERT INTO movies_ratings (user_id, show_id, rating, timestamp)
VALUES (1, 'm2', 5, GETDATE());

INSERT INTO movies_ratings (user_id, show_id, rating, timestamp)
VALUES (2, 'm1', 4, GETDATE());

INSERT INTO movies_ratings (user_id, show_id, rating, timestamp)
VALUES (2, 'm3', 5, GETDATE());
