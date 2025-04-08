using System.ComponentModel.DataAnnotations.Schema;
using System.Globalization;

namespace MoviesApp.DataUploader.Models
{
    public class MovieCsv
    {
        public string show_id { get; set; } = string.Empty;
        public string? type { get; set; }
        public string title { get; set; } = string.Empty;
        public string? director { get; set; }
        public string? cast { get; set; }
        public string? country { get; set; }
        public int? release_year { get; set; }
        public string? rating { get; set; }
        public string? duration { get; set; }
        public string? description { get; set; }
        public int? Action { get; set; }
        public int? Adventure { get; set; }
        public int? AnimeSeriesInternationalTVShows { get; set; }
        public int? BritishTVShowsDocuseriesInternationalTVShows { get; set; }
        public int? Children { get; set; }
        public int? Comedies { get; set; }
        public int? ComediesDramasInternationalMovies { get; set; }
        public int? ComediesInternationalMovies { get; set; }
        public int? ComediesRomanticMovies { get; set; }
        public int? CrimeTVShowsDocuseries { get; set; }
        public int? Documentaries { get; set; }
        public int? DocumentariesInternationalMovies { get; set; }
        public int? Docuseries { get; set; }
        public int? Dramas { get; set; }
        public int? DramasInternationalMovies { get; set; }
        public int? DramasRomanticMovies { get; set; }
        public int? FamilyMovies { get; set; }
        public int? Fantasy { get; set; }
        public int? HorrorMovies { get; set; }
        public int? InternationalMoviesThrillers { get; set; }
        public int? InternationalTVShowsRomanticTVShowsTVDramas { get; set; }
        public int? KidsTV { get; set; }
        public int? LanguageTVShows { get; set; }
        public int? Musicals { get; set; }
        public int? NatureTV { get; set; }
        public int? RealityTV { get; set; }
        public int? Spirituality { get; set; }
        public int? TVAction { get; set; }
        public int? TVComedies { get; set; }
        public int? TVDramas { get; set; }
        public int? TalkShowsTVComedies { get; set; }
        public int? Thrillers { get; set; }
        public string? poster_url { get; set; }
    }

}
