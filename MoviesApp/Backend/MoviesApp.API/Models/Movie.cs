using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoviesApp.API.Models
{
    [Table("movies_titles")]
    public class Movie
    {
        [Key]
        [Column("show_id")]
        public string ShowId { get; set; } = string.Empty;

        [Column("type")]
        public string? Type { get; set; }

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("director")]
        public string? Director { get; set; }

        [Column("cast")]
        public string? Cast { get; set; }

        [Column("country")]
        public string? Country { get; set; }

        [Column("release_year")]
        public int? ReleaseYear { get; set; }

        [Column("rating")]
        public string? Rating { get; set; }

        [Column("duration")]
        public string? Duration { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("Action")]
        public int? Action { get; set; }

        [Column("Adventure")]
        public int? Adventure { get; set; }

        [Column("AnimeSeriesInternationalTVShows")]
        public int? AnimeSeriesInternationalTVShows { get; set; }

        [Column("BritishTVShowsDocuseriesInternationalTVShows")]
        public int? BritishTVShowsDocuseriesInternationalTVShows { get; set; }

        [Column("Children")]
        public int? Children { get; set; }

        [Column("Comedies")]
        public int? Comedies { get; set; }

        [Column("ComediesDramasInternationalMovies")]
        public int? ComediesDramasInternationalMovies { get; set; }

        [Column("ComediesInternationalMovies")]
        public int? ComediesInternationalMovies { get; set; }

        [Column("ComediesRomanticMovies")]
        public int? ComediesRomanticMovies { get; set; }

        [Column("CrimeTVShowsDocuseries")]
        public int? CrimeTVShowsDocuseries { get; set; }

        [Column("Documentaries")]
        public int? Documentaries { get; set; }

        [Column("DocumentariesInternationalMovies")]
        public int? DocumentariesInternationalMovies { get; set; }

        [Column("Docuseries")]
        public int? Docuseries { get; set; }

        [Column("Dramas")]
        public int? Dramas { get; set; }

        [Column("DramasInternationalMovies")]
        public int? DramasInternationalMovies { get; set; }

        [Column("DramasRomanticMovies")]
        public int? DramasRomanticMovies { get; set; }

        [Column("FamilyMovies")]
        public int? FamilyMovies { get; set; }

        [Column("Fantasy")]
        public int? Fantasy { get; set; }

        [Column("HorrorMovies")]
        public int? HorrorMovies { get; set; }

        [Column("InternationalMoviesThrillers")]
        public int? InternationalMoviesThrillers { get; set; }

        [Column("InternationalTVShowsRomanticTVShowsTVDramas")]
        public int? InternationalTVShowsRomanticTVShowsTVDramas { get; set; }

        [Column("KidsTV")]
        public int? KidsTV { get; set; }

        [Column("LanguageTVShows")]
        public int? LanguageTVShows { get; set; }

        [Column("Musicals")]
        public int? Musicals { get; set; }

        [Column("NatureTV")]
        public int? NatureTV { get; set; }

        [Column("RealityTV")]
        public int? RealityTV { get; set; }

        [Column("Spirituality")]
        public int? Spirituality { get; set; }

        [Column("TVAction")]
        public int? TVAction { get; set; }

        [Column("TVComedies")]
        public int? TVComedies { get; set; }

        [Column("TVDramas")]
        public int? TVDramas { get; set; }

        [Column("TalkShowsTVComedies")]
        public int? TalkShowsTVComedies { get; set; }

        [Column("Thrillers")]
        public int? Thrillers { get; set; }

        [Column("poster_url")]
        public string? PosterUrl { get; set; }

        // Navigation property
        public virtual ICollection<Rating>? Ratings { get; set; }
    }
}
