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
        [Anime Series International TV Shows] INT,
        [British TV Shows Docuseries International TV Shows] INT,
        Children INT,
        Comedies INT,
        [Comedies Dramas International Movies] INT,
        [Comedies International Movies] INT,
        [Comedies Romantic Movies] INT,
        [Crime TV Shows Docuseries] INT,
        Documentaries INT,
        [Documentaries International Movies] INT,
        Docuseries INT,
        Dramas INT,
        [Dramas International Movies] INT,
        [Dramas Romantic Movies] INT,
        [Family Movies] INT,
        Fantasy INT,
        [Horror Movies] INT,
        [International Movies Thrillers] INT,
        [International TV Shows Romantic TV Shows TV Dramas] INT,
        [Kids' TV] INT,
        [Language TV Shows] INT,
        Musicals INT,
        [Nature TV] INT,
        [Reality TV] INT,
        Spirituality INT,
        [TV Action] INT,
        [TV Comedies] INT,
        [TV Dramas] INT,
        [Talk Shows TV Comedies] INT,
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
        [Amazon Prime] INT,
        [Disney+] INT,
        [Paramount+] INT,
        Max INT,
        Hulu INT,
        [Apple TV+] INT,
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

-- Insert sample data
INSERT INTO movies_users (name, email, password_hash, role)
VALUES ('Admin User', 'admin@example.com', 'AQAAAAEAACcQAAAAEHxA9KK8xQY1AJA1/WyUJd7ZAiNCWVvLN4GHmNM/GGXbyM87KfILF6T4NCCgzU4rJw==', 'Admin');

-- Insert sample movies
INSERT INTO movies_titles (show_id, type, title, director, description, release_year, Dramas, Comedies)
VALUES 
('s1', 'Movie', 'The Shawshank Redemption', 'Frank Darabont', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 1994, 1, 0),
('s2', 'Movie', 'The Godfather', 'Francis Ford Coppola', 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', 1972, 1, 0),
('s3', 'Movie', 'Pulp Fiction', 'Quentin Tarantino', 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', 1994, 1, 0),
('s4', 'Movie', 'The Dark Knight', 'Christopher Nolan', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 2008, 1, 0),
('s5', 'Movie', 'Forrest Gump', 'Robert Zemeckis', 'The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate, and other historical events unfold through the perspective of an Alabama man with an IQ of 75, whose only desire is to be reunited with his childhood sweetheart.', 1994, 1, 1);
