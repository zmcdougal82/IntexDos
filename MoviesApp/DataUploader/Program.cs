using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using MoviesApp.DataUploader.Data;
using MoviesApp.DataUploader.Models;
using MoviesApp.API.Models;

namespace MoviesApp.DataUploader
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Starting data upload to Azure SQL Database...");

            // Create a DbContext - this will connect to the database using the connection string in MovieDbContext
            Console.WriteLine("Connecting to database...");
            using var context = new MovieDbContext();

            try
            {
                // Clear existing data
                Console.WriteLine("Clearing existing data...");
                context.Ratings.RemoveRange(context.Ratings);
                context.Movies.RemoveRange(context.Movies);
                context.Users.RemoveRange(context.Users);
                context.SaveChanges();
                Console.WriteLine("Existing data cleared.");

                // Upload movies
                UploadMovies(context);

                // Upload users
                UploadUsers(context);

                // Upload ratings
                UploadRatings(context);

                Console.WriteLine("\nData upload completed successfully!");
                Console.WriteLine($"Movies uploaded: {context.Movies.Count()}");
                Console.WriteLine($"Users uploaded: {context.Users.Count()}");
                Console.WriteLine($"Ratings uploaded: {context.Ratings.Count()}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner error: {ex.InnerException.Message}");
                }
            }
        }

        static void UploadMovies(MovieDbContext context)
        {
            string csvPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "updated_movies.csv");
            Console.WriteLine($"Uploading movies from {csvPath}...");

            if (!File.Exists(csvPath))
            {
                Console.WriteLine($"Error: Movie CSV file not found at {csvPath}");
                return;
            }

            var lines = File.ReadAllLines(csvPath);
            var headers = lines[0].Split(',');

            var movies = new List<MovieCsv>();
            for (int i = 1; i < lines.Length; i++)
            {
                var values = ParseCsvLine(lines[i]);
                if (values.Length < headers.Length)
                {
                    Console.WriteLine($"Warning: Line {i+1} has fewer columns ({values.Length}) than headers ({headers.Length}). Skipping.");
                    continue;
                }

                var movie = new MovieCsv();
                movie.show_id = values[0];
                movie.type = values[1];
                movie.title = values[2];
                movie.director = values[3];
                movie.cast = values[4];
                movie.country = values[5];

                if (!string.IsNullOrEmpty(values[6]) && int.TryParse(values[6], out int year))
                    movie.release_year = year;

                movie.rating = values[7];
                movie.duration = values[8];
                movie.description = values[9];

                // Genre fields - starting from index 10
                if (values.Length > 10 && int.TryParse(values[10], out int action))
                    movie.Action = action;

                if (values.Length > 11 && int.TryParse(values[11], out int adventure))
                    movie.Adventure = adventure;

                if (values.Length > 12 && int.TryParse(values[12], out int anime))
                    movie.AnimeSeriesInternationalTVShows = anime;

                if (values.Length > 13 && int.TryParse(values[13], out int british))
                    movie.BritishTVShowsDocuseriesInternationalTVShows = british;

                if (values.Length > 14 && int.TryParse(values[14], out int children))
                    movie.Children = children;

                if (values.Length > 15 && int.TryParse(values[15], out int comedies))
                    movie.Comedies = comedies;

                if (values.Length > 16 && int.TryParse(values[16], out int comediesDramas))
                    movie.ComediesDramasInternationalMovies = comediesDramas;

                if (values.Length > 17 && int.TryParse(values[17], out int comediesInt))
                    movie.ComediesInternationalMovies = comediesInt;

                if (values.Length > 18 && int.TryParse(values[18], out int comediesRomantic))
                    movie.ComediesRomanticMovies = comediesRomantic;

                if (values.Length > 19 && int.TryParse(values[19], out int crimeTV))
                    movie.CrimeTVShowsDocuseries = crimeTV;

                if (values.Length > 20 && int.TryParse(values[20], out int documentaries))
                    movie.Documentaries = documentaries;

                if (values.Length > 21 && int.TryParse(values[21], out int documentariesInt))
                    movie.DocumentariesInternationalMovies = documentariesInt;

                if (values.Length > 22 && int.TryParse(values[22], out int docuseries))
                    movie.Docuseries = docuseries;

                if (values.Length > 23 && int.TryParse(values[23], out int dramas))
                    movie.Dramas = dramas;

                if (values.Length > 24 && int.TryParse(values[24], out int dramasInt))
                    movie.DramasInternationalMovies = dramasInt;

                if (values.Length > 25 && int.TryParse(values[25], out int dramasRomantic))
                    movie.DramasRomanticMovies = dramasRomantic;

                if (values.Length > 26 && int.TryParse(values[26], out int family))
                    movie.FamilyMovies = family;

                if (values.Length > 27 && int.TryParse(values[27], out int fantasy))
                    movie.Fantasy = fantasy;

                if (values.Length > 28 && int.TryParse(values[28], out int horror))
                    movie.HorrorMovies = horror;

                if (values.Length > 29 && int.TryParse(values[29], out int intlThrillers))
                    movie.InternationalMoviesThrillers = intlThrillers;

                if (values.Length > 30 && int.TryParse(values[30], out int intlTvRomantic))
                    movie.InternationalTVShowsRomanticTVShowsTVDramas = intlTvRomantic;

                if (values.Length > 31 && int.TryParse(values[31], out int kidsTV))
                    movie.KidsTV = kidsTV;

                if (values.Length > 32 && int.TryParse(values[32], out int languageTV))
                    movie.LanguageTVShows = languageTV;

                if (values.Length > 33 && int.TryParse(values[33], out int musicals))
                    movie.Musicals = musicals;

                if (values.Length > 34 && int.TryParse(values[34], out int natureTV))
                    movie.NatureTV = natureTV;

                if (values.Length > 35 && int.TryParse(values[35], out int realityTV))
                    movie.RealityTV = realityTV;

                if (values.Length > 36 && int.TryParse(values[36], out int spirituality))
                    movie.Spirituality = spirituality;

                if (values.Length > 37 && int.TryParse(values[37], out int tvAction))
                    movie.TVAction = tvAction;

                if (values.Length > 38 && int.TryParse(values[38], out int tvComedies))
                    movie.TVComedies = tvComedies;

                if (values.Length > 39 && int.TryParse(values[39], out int tvDramas))
                    movie.TVDramas = tvDramas;

                if (values.Length > 40 && int.TryParse(values[40], out int talkShows))
                    movie.TalkShowsTVComedies = talkShows;

                if (values.Length > 41 && int.TryParse(values[41], out int thrillers))
                    movie.Thrillers = thrillers;

                if (values.Length > 42)
                    movie.poster_url = values[42];

                movies.Add(movie);
            }

            Console.WriteLine($"Parsed {movies.Count} movies from CSV.");
            Console.WriteLine("Adding movies to database...");

            int count = 0;
            int batchSize = 100;
            foreach (var batch in BatchList(movies, batchSize))
            {
                foreach (var movie in batch)
                {
                    // Convert from MovieCsv to database Movie entity
                    var dbMovie = new Movie
                    {
                        ShowId = movie.show_id,
                        Type = movie.type,
                        Title = movie.title,
                        Director = movie.director,
                        Cast = movie.cast,
                        Country = movie.country,
                        ReleaseYear = movie.release_year,
                        Rating = movie.rating,
                        Duration = movie.duration,
                        Description = movie.description,
                        Action = movie.Action,
                        Adventure = movie.Adventure,
                        AnimeSeriesInternationalTVShows = movie.AnimeSeriesInternationalTVShows,
                        BritishTVShowsDocuseriesInternationalTVShows = movie.BritishTVShowsDocuseriesInternationalTVShows,
                        Children = movie.Children,
                        Comedies = movie.Comedies,
                        ComediesDramasInternationalMovies = movie.ComediesDramasInternationalMovies,
                        ComediesInternationalMovies = movie.ComediesInternationalMovies,
                        ComediesRomanticMovies = movie.ComediesRomanticMovies,
                        CrimeTVShowsDocuseries = movie.CrimeTVShowsDocuseries,
                        Documentaries = movie.Documentaries,
                        DocumentariesInternationalMovies = movie.DocumentariesInternationalMovies,
                        Docuseries = movie.Docuseries,
                        Dramas = movie.Dramas,
                        DramasInternationalMovies = movie.DramasInternationalMovies,
                        DramasRomanticMovies = movie.DramasRomanticMovies,
                        FamilyMovies = movie.FamilyMovies,
                        Fantasy = movie.Fantasy,
                        HorrorMovies = movie.HorrorMovies,
                        InternationalMoviesThrillers = movie.InternationalMoviesThrillers,
                        InternationalTVShowsRomanticTVShowsTVDramas = movie.InternationalTVShowsRomanticTVShowsTVDramas,
                        KidsTV = movie.KidsTV,
                        LanguageTVShows = movie.LanguageTVShows,
                        Musicals = movie.Musicals,
                        NatureTV = movie.NatureTV,
                        RealityTV = movie.RealityTV,
                        Spirituality = movie.Spirituality,
                        TVAction = movie.TVAction,
                        TVComedies = movie.TVComedies,
                        TVDramas = movie.TVDramas,
                        TalkShowsTVComedies = movie.TalkShowsTVComedies,
                        Thrillers = movie.Thrillers,
                        PosterUrl = movie.poster_url
                    };

                    context.Movies.Add(dbMovie);
                }

                context.SaveChanges();
                count += batch.Count;
                Console.WriteLine($"Uploaded {count} of {movies.Count} movies...");
            }

            Console.WriteLine($"Successfully uploaded {count} movies.");
        }

        static void UploadUsers(MovieDbContext context)
        {
            string csvPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "movies_users.csv");
            Console.WriteLine($"Uploading users from {csvPath}...");

            if (!File.Exists(csvPath))
            {
                Console.WriteLine($"Error: Users CSV file not found at {csvPath}");
                return;
            }

            var lines = File.ReadAllLines(csvPath);
            var headers = lines[0].Split(',');

            var users = new List<UserCsv>();
            for (int i = 1; i < lines.Length; i++)
            {
                var values = ParseCsvLine(lines[i]);
                if (values.Length < headers.Length)
                {
                    Console.WriteLine($"Warning: Line {i+1} has fewer columns ({values.Length}) than headers ({headers.Length}). Skipping.");
                    continue;
                }

                var user = new UserCsv();
                
                if (int.TryParse(values[0], out int userId))
                    user.user_id = userId;

                user.name = values[1];
                user.phone = values[2];
                user.email = values[3];
                
                if (!string.IsNullOrEmpty(values[4]) && int.TryParse(values[4], out int age))
                    user.age = age;
                
                user.gender = values[5];

                if (!string.IsNullOrEmpty(values[6]) && int.TryParse(values[6], out int netflix))
                    user.Netflix = netflix;

                if (!string.IsNullOrEmpty(values[7]) && int.TryParse(values[7], out int amazon))
                    user.AmazonPrime = amazon;

                if (!string.IsNullOrEmpty(values[8]) && int.TryParse(values[8], out int disney))
                    user.DisneyPlus = disney;

                if (!string.IsNullOrEmpty(values[9]) && int.TryParse(values[9], out int paramount))
                    user.ParamountPlus = paramount;

                if (!string.IsNullOrEmpty(values[10]) && int.TryParse(values[10], out int max))
                    user.Max = max;

                if (!string.IsNullOrEmpty(values[11]) && int.TryParse(values[11], out int hulu))
                    user.Hulu = hulu;

                if (!string.IsNullOrEmpty(values[12]) && int.TryParse(values[12], out int apple))
                    user.AppleTVPlus = apple;

                if (!string.IsNullOrEmpty(values[13]) && int.TryParse(values[13], out int peacock))
                    user.Peacock = peacock;

                if (values.Length > 14)
                    user.city = values[14];

                if (values.Length > 15)
                    user.state = values[15];

                if (values.Length > 16)
                    user.zip = values[16];

                users.Add(user);
            }

            Console.WriteLine($"Parsed {users.Count} users from CSV.");
            Console.WriteLine("Adding users to database...");

            int count = 0;
            int batchSize = 100;
            foreach (var batch in BatchList(users, batchSize))
            {
                foreach (var user in batch)
                {
                    // Convert from UserCsv to database User entity
                    var dbUser = new User
                    {
                        // Don't set UserId - let the database auto-generate it
                        Name = user.name,
                        Phone = user.phone,
                        Email = user.email,
                        Age = user.age,
                        Gender = user.gender,
                        Netflix = user.Netflix,
                        AmazonPrime = user.AmazonPrime,
                        DisneyPlus = user.DisneyPlus,
                        ParamountPlus = user.ParamountPlus,
                        Max = user.Max,
                        Hulu = user.Hulu,
                        AppleTVPlus = user.AppleTVPlus,
                        Peacock = user.Peacock,
                        City = user.city,
                        State = user.state,
                        Zip = user.zip,
                        Role = "User",
                        PasswordHash = null
                    };

                    context.Users.Add(dbUser);
                }

                context.SaveChanges();
                count += batch.Count;
                Console.WriteLine($"Uploaded {count} of {users.Count} users...");
            }

            Console.WriteLine($"Successfully uploaded {count} users.");
        }

        static void UploadRatings(MovieDbContext context)
        {
            string csvPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "movies_ratings.csv");
            Console.WriteLine($"Uploading ratings from {csvPath}...");

            if (!File.Exists(csvPath))
            {
                Console.WriteLine($"Error: Ratings CSV file not found at {csvPath}");
                return;
            }

            var lines = File.ReadAllLines(csvPath);
            var headers = lines[0].Split(',');

            var ratings = new List<RatingCsv>();
            for (int i = 1; i < lines.Length; i++)
            {
                var values = ParseCsvLine(lines[i]);
                if (values.Length < headers.Length)
                {
                    Console.WriteLine($"Warning: Line {i+1} has fewer columns ({values.Length}) than headers ({headers.Length}). Skipping.");
                    continue;
                }

                var rating = new RatingCsv();
                
                if (int.TryParse(values[0], out int userId))
                    rating.UserId = userId;
                
                rating.ShowId = values[1];
                
                if (int.TryParse(values[2], out int ratingValue))
                    rating.RatingValue = ratingValue;

                ratings.Add(rating);
            }

            Console.WriteLine($"Parsed {ratings.Count} ratings from CSV.");
            Console.WriteLine("Adding ratings to database...");

            // First, get the mapping of old CSV user_ids to new database user_ids
            var dbUsers = context.Users.ToList(); // Load all users to avoid repeated queries
            // Create a starting map from index position to user_id
            var userIdMap = dbUsers.Select((user, index) => new { OldId = index + 1, NewId = user.UserId }).ToDictionary(x => x.OldId, x => x.NewId);

            int count = 0;
            int batchSize = 500;
            foreach (var batch in BatchList(ratings, batchSize))
            {
                foreach (var rating in batch)
                {
                    // Check if the movie exists
                    var movie = context.Movies.FirstOrDefault(m => m.ShowId == rating.ShowId);
                    if (movie == null)
                    {
                        Console.WriteLine($"Warning: Movie with ShowId {rating.ShowId} not found. Skipping rating.");
                        continue;
                    }

                    // Map old user_id to new user_id, or use a valid user if not found
                    int newUserId;
                    if (!userIdMap.TryGetValue(rating.UserId, out newUserId))
                    {
                        if (dbUsers.Count > 0)
                        {
                            // If mapping not found, use the first user as a fallback
                            newUserId = dbUsers[0].UserId;
                            Console.WriteLine($"Warning: User with old ID {rating.UserId} not found. Using user {newUserId} instead.");
                        }
                        else
                        {
                            Console.WriteLine($"Warning: No users available. Skipping rating.");
                            continue;
                        }
                    }

                    // Convert from RatingCsv to database Rating entity
                    var dbRating = new Rating
                    {
                        UserId = newUserId,
                        ShowId = rating.ShowId,
                        RatingValue = rating.RatingValue,
                        Timestamp = DateTime.UtcNow
                    };

                    context.Ratings.Add(dbRating);
                }

                try
                {
                    context.SaveChanges();
                    count += batch.Count;
                    Console.WriteLine($"Uploaded {count} of {ratings.Count} ratings...");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error saving batch of ratings: {ex.Message}");
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"Inner error: {ex.InnerException.Message}");
                    }
                }
            }

            Console.WriteLine($"Successfully uploaded {count} ratings.");
        }

        static string[] ParseCsvLine(string line)
        {
            var result = new List<string>();
            bool inQuotes = false;
            int startIndex = 0;

            for (int i = 0; i < line.Length; i++)
            {
                if (line[i] == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (line[i] == ',' && !inQuotes)
                {
                    result.Add(line.Substring(startIndex, i - startIndex).Trim('"'));
                    startIndex = i + 1;
                }
            }

            // Add the last field
            result.Add(line.Substring(startIndex).Trim('"'));

            return result.ToArray();
        }

        static IEnumerable<List<T>> BatchList<T>(List<T> source, int batchSize)
        {
            for (int i = 0; i < source.Count; i += batchSize)
            {
                yield return source.GetRange(i, Math.Min(batchSize, source.Count - i));
            }
        }
    }
}
