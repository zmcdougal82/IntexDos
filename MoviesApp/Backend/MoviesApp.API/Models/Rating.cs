using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoviesApp.API.Models
{
    [Table("movies_ratings")]
    public class Rating
    {
        [Column("user_id")]
        public int UserId { get; set; }

        [Column("show_id")]
        public string ShowId { get; set; } = string.Empty;

        [Column("rating")]
        public int RatingValue { get; set; }

        [Column("timestamp")]
        public DateTime? Timestamp { get; set; }

        // Foreign key relationships
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [ForeignKey("ShowId")]
        public virtual Movie? Movie { get; set; }
    }
}
