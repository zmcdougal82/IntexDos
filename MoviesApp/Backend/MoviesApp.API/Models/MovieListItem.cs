using System.ComponentModel.DataAnnotations.Schema;

namespace MoviesApp.API.Models
{
    [Table("movie_list_items")]
    public class MovieListItem
    {
        [Column("list_id")]
        public int ListId { get; set; }

        [Column("show_id")]
        public string ShowId { get; set; } = string.Empty;

        [Column("date_added")]
        public DateTime DateAdded { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("ListId")]
        public virtual MovieList? MovieList { get; set; }

        [ForeignKey("ShowId")]
        public virtual Movie? Movie { get; set; }
    }
}
