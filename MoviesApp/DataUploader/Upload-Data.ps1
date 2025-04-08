# PowerShell script to upload CSV data to Azure SQL Database

# Database connection parameters from appsettings.json
$server = "moviesapp-sql-79427.database.windows.net"
$database = "MoviesDB"
$userId = "sqladmin"
$password = "P@ssw0rd123!"

# CSV file paths
$moviesFilePath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\updated_movies.csv"
$usersFilePath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\movies_users.csv"
$ratingsFilePath = Join-Path -Path $PSScriptRoot -ChildPath "..\movies_ratings.csv"

# Check if files exist
if (-not (Test-Path $moviesFilePath)) {
    Write-Error "Movies CSV file not found at $moviesFilePath"
    exit 1
}

if (-not (Test-Path $usersFilePath)) {
    Write-Error "Users CSV file not found at $usersFilePath"
    exit 1
}

if (-not (Test-Path $ratingsFilePath)) {
    Write-Error "Ratings CSV file not found at $ratingsFilePath"
    exit 1
}

Write-Host "CSV files found. Starting data upload..."

# Create connection string
$connectionString = "Server=tcp:$server,1433;Initial Catalog=$database;Persist Security Info=False;User ID=$userId;Password=$password;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Function to execute SQL command
function Invoke-SqlCommand {
    param(
        [string]$connectionString,
        [string]$sqlCommand
    )
    
    $connection = New-Object System.Data.SqlClient.SqlConnection
    $connection.ConnectionString = $connectionString
    
    $command = New-Object System.Data.SqlClient.SqlCommand
    $command.Connection = $connection
    $command.CommandText = $sqlCommand
    $command.CommandTimeout = 300  # 5 minutes timeout
    
    try {
        $connection.Open()
        $result = $command.ExecuteNonQuery()
        return $result
    }
    catch {
        Write-Error "Error executing SQL: $_"
        throw $_
    }
    finally {
        $connection.Close()
    }
}

# Clean up existing data
Write-Host "Clearing existing data..."
Invoke-SqlCommand -connectionString $connectionString -sqlCommand "DELETE FROM movies_ratings;"
Invoke-SqlCommand -connectionString $connectionString -sqlCommand "DELETE FROM movies_users;"
Invoke-SqlCommand -connectionString $connectionString -sqlCommand "DELETE FROM movies_titles;"

# Import and process movies
Write-Host "Processing movies data..."
$movies = Import-Csv -Path $moviesFilePath
$totalMovies = $movies.Count
$processedMovies = 0

foreach ($movie in $movies) {
    $insertSql = @"
INSERT INTO movies_titles (
    show_id, type, title, director, cast, country, release_year, rating, duration, description,
    Action, Adventure, AnimeSeriesInternationalTVShows, BritishTVShowsDocuseriesInternationalTVShows,
    Children, Comedies, ComediesDramasInternationalMovies, ComediesInternationalMovies, ComediesRomanticMovies,
    CrimeTVShowsDocuseries, Documentaries, DocumentariesInternationalMovies, Docuseries, Dramas,
    DramasInternationalMovies, DramasRomanticMovies, FamilyMovies, Fantasy, HorrorMovies,
    InternationalMoviesThrillers, InternationalTVShowsRomanticTVShowsTVDramas, KidsTV, LanguageTVShows,
    Musicals, NatureTV, RealityTV, Spirituality, TVAction, TVComedies, TVDramas, TalkShowsTVComedies, Thrillers, poster_url
) VALUES (
    '$($movie.show_id)', 
    '$($movie.type)', 
    '$(($movie.title).Replace("'", "''"))', 
    '$(($movie.director).Replace("'", "''"))', 
    '$(($movie.cast).Replace("'", "''"))', 
    '$(($movie.country).Replace("'", "''"))', 
    $(if ($movie.release_year -eq "") { "NULL" } else { $movie.release_year }), 
    '$(($movie.rating).Replace("'", "''"))', 
    '$(($movie.duration).Replace("'", "''"))', 
    '$(($movie.description).Replace("'", "''"))',
    $(if ($movie.Action -eq "") { "NULL" } else { $movie.Action }), 
    $(if ($movie.Adventure -eq "") { "NULL" } else { $movie.Adventure }), 
    $(if ($movie.AnimeSeriesInternationalTVShows -eq "") { "NULL" } else { $movie.AnimeSeriesInternationalTVShows }), 
    $(if ($movie.BritishTVShowsDocuseriesInternationalTVShows -eq "") { "NULL" } else { $movie.BritishTVShowsDocuseriesInternationalTVShows }), 
    $(if ($movie.Children -eq "") { "NULL" } else { $movie.Children }), 
    $(if ($movie.Comedies -eq "") { "NULL" } else { $movie.Comedies }), 
    $(if ($movie.ComediesDramasInternationalMovies -eq "") { "NULL" } else { $movie.ComediesDramasInternationalMovies }), 
    $(if ($movie.ComediesInternationalMovies -eq "") { "NULL" } else { $movie.ComediesInternationalMovies }), 
    $(if ($movie.ComediesRomanticMovies -eq "") { "NULL" } else { $movie.ComediesRomanticMovies }), 
    $(if ($movie.CrimeTVShowsDocuseries -eq "") { "NULL" } else { $movie.CrimeTVShowsDocuseries }), 
    $(if ($movie.Documentaries -eq "") { "NULL" } else { $movie.Documentaries }), 
    $(if ($movie.DocumentariesInternationalMovies -eq "") { "NULL" } else { $movie.DocumentariesInternationalMovies }), 
    $(if ($movie.Docuseries -eq "") { "NULL" } else { $movie.Docuseries }), 
    $(if ($movie.Dramas -eq "") { "NULL" } else { $movie.Dramas }), 
    $(if ($movie.DramasInternationalMovies -eq "") { "NULL" } else { $movie.DramasInternationalMovies }), 
    $(if ($movie.DramasRomanticMovies -eq "") { "NULL" } else { $movie.DramasRomanticMovies }), 
    $(if ($movie.FamilyMovies -eq "") { "NULL" } else { $movie.FamilyMovies }), 
    $(if ($movie.Fantasy -eq "") { "NULL" } else { $movie.Fantasy }), 
    $(if ($movie.HorrorMovies -eq "") { "NULL" } else { $movie.HorrorMovies }), 
    $(if ($movie.InternationalMoviesThrillers -eq "") { "NULL" } else { $movie.InternationalMoviesThrillers }), 
    $(if ($movie.InternationalTVShowsRomanticTVShowsTVDramas -eq "") { "NULL" } else { $movie.InternationalTVShowsRomanticTVShowsTVDramas }), 
    $(if ($movie.KidsTV -eq "") { "NULL" } else { $movie.KidsTV }), 
    $(if ($movie.LanguageTVShows -eq "") { "NULL" } else { $movie.LanguageTVShows }), 
    $(if ($movie.Musicals -eq "") { "NULL" } else { $movie.Musicals }), 
    $(if ($movie.NatureTV -eq "") { "NULL" } else { $movie.NatureTV }), 
    $(if ($movie.RealityTV -eq "") { "NULL" } else { $movie.RealityTV }), 
    $(if ($movie.Spirituality -eq "") { "NULL" } else { $movie.Spirituality }), 
    $(if ($movie.TVAction -eq "") { "NULL" } else { $movie.TVAction }), 
    $(if ($movie.TVComedies -eq "") { "NULL" } else { $movie.TVComedies }), 
    $(if ($movie.TVDramas -eq "") { "NULL" } else { $movie.TVDramas }), 
    $(if ($movie.TalkShowsTVComedies -eq "") { "NULL" } else { $movie.TalkShowsTVComedies }), 
    $(if ($movie.Thrillers -eq "") { "NULL" } else { $movie.Thrillers }),
    '$(($movie.poster_url).Replace("'", "''"))'
);
"@

    try {
        Invoke-SqlCommand -connectionString $connectionString -sqlCommand $insertSql
        $processedMovies++
        
        if ($processedMovies % 10 -eq 0) {
            Write-Host "Processed $processedMovies of $totalMovies movies..."
        }
    }
    catch {
        Write-Error "Error processing movie $($movie.show_id): $_"
    }
}

Write-Host "Finished processing movies. $processedMovies movies uploaded."

# Import and process users
Write-Host "Processing users data..."
$users = Import-Csv -Path $usersFilePath
$totalUsers = $users.Count
$processedUsers = 0

foreach ($user in $users) {
    $insertSql = @"
INSERT INTO movies_users (
    user_id, name, phone, email, age, gender, Netflix, AmazonPrime, DisneyPlus, ParamountPlus,
    Max, Hulu, AppleTVPlus, Peacock, city, state, zip, role, password_hash
) VALUES (
    $($user.user_id), 
    '$(($user.name).Replace("'", "''"))', 
    '$(($user.phone).Replace("'", "''"))', 
    '$(($user.email).Replace("'", "''"))', 
    $(if ($user.age -eq "") { "NULL" } else { $user.age }), 
    '$(($user.gender).Replace("'", "''"))', 
    $(if ($user.Netflix -eq "") { "NULL" } else { $user.Netflix }), 
    $(if ($user.AmazonPrime -eq "") { "NULL" } else { $user.AmazonPrime }), 
    $(if ($user.DisneyPlus -eq "") { "NULL" } else { $user.DisneyPlus }), 
    $(if ($user.ParamountPlus -eq "") { "NULL" } else { $user.ParamountPlus }), 
    $(if ($user.Max -eq "") { "NULL" } else { $user.Max }), 
    $(if ($user.Hulu -eq "") { "NULL" } else { $user.Hulu }), 
    $(if ($user.AppleTVPlus -eq "") { "NULL" } else { $user.AppleTVPlus }), 
    $(if ($user.Peacock -eq "") { "NULL" } else { $user.Peacock }), 
    '$(($user.city).Replace("'", "''"))', 
    '$(($user.state).Replace("'", "''"))', 
    '$(($user.zip).Replace("'", "''"))',
    'User',
    NULL
);
"@

    try {
        Invoke-SqlCommand -connectionString $connectionString -sqlCommand $insertSql
        $processedUsers++
        
        if ($processedUsers % 10 -eq 0) {
            Write-Host "Processed $processedUsers of $totalUsers users..."
        }
    }
    catch {
        Write-Error "Error processing user $($user.user_id): $_"
    }
}

Write-Host "Finished processing users. $processedUsers users uploaded."

# Import and process ratings
Write-Host "Processing ratings data..."
$ratings = Import-Csv -Path $ratingsFilePath
$totalRatings = $ratings.Count
$processedRatings = 0
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

foreach ($rating in $ratings) {
    $insertSql = @"
INSERT INTO movies_ratings (
    user_id, show_id, rating, timestamp
) VALUES (
    $($rating.user_id), 
    '$($rating.show_id)', 
    $($rating.rating),
    '$timestamp'
);
"@

    try {
        Invoke-SqlCommand -connectionString $connectionString -sqlCommand $insertSql
        $processedRatings++
        
        if ($processedRatings % 100 -eq 0) {
            Write-Host "Processed $processedRatings of $totalRatings ratings..."
        }
    }
    catch {
        Write-Error "Error processing rating (user: $($rating.user_id), movie: $($rating.show_id)): $_"
    }
}

Write-Host "Finished processing ratings. $processedRatings ratings uploaded."

# Print summary
Write-Host "Data upload completed."
Write-Host "Summary:"
Write-Host "- Movies uploaded: $processedMovies"
Write-Host "- Users uploaded: $processedUsers"
Write-Host "- Ratings uploaded: $processedRatings"
