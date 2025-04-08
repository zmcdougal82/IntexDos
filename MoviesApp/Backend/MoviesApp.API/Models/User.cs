using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoviesApp.API.Models
{
    [Table("movies_users")]
    public class User
    {
        [Key]
        [Column("user_id")]
        public int UserId { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("phone")]
        public string? Phone { get; set; }

        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Column("age")]
        public int? Age { get; set; }

        [Column("gender")]
        public string? Gender { get; set; }

        [Column("Netflix")]
        public int? Netflix { get; set; }

        [Column("AmazonPrime")]
        public int? AmazonPrime { get; set; }

        [Column("DisneyPlus")]
        public int? DisneyPlus { get; set; }

        [Column("ParamountPlus")]
        public int? ParamountPlus { get; set; }

        [Column("Max")]
        public int? Max { get; set; }

        [Column("Hulu")]
        public int? Hulu { get; set; }

        [Column("AppleTVPlus")]
        public int? AppleTVPlus { get; set; }

        [Column("Peacock")]
        public int? Peacock { get; set; }

        [Column("city")]
        public string? City { get; set; }

        [Column("state")]
        public string? State { get; set; }

        [Column("zip")]
        public string? Zip { get; set; }

        [Column("password_hash")]
        public string? PasswordHash { get; set; }

        [Column("role")]
        public string? Role { get; set; }

        // Navigation property
        public virtual ICollection<Rating>? Ratings { get; set; }
    }
}
