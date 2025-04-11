using System.Collections.Generic;
using System.Threading.Tasks;

namespace MoviesApp.API.Services
{
    public interface IRecommendationService
    {
        Task<List<string>> GetTopRatedMovies(int limit = 20);
        Task<List<string>> GetPopularMovies(int limit = 20);
        Task<List<string>> GetMoviesByGenre(string genre, int limit = 20);
        Task<List<string>> GetHiddenGems(int limit = 20);
        Task<List<string>> GetContentBasedRecommendations(string basedOnMovieId, int limit = 20);
    }
}
