using System.ComponentModel.DataAnnotations;

namespace MoviesApp.API.Models
{
    public class RegisterModel
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 8)]
        public string Password { get; set; }

        // Additional optional fields
        public string? Phone { get; set; }
        public int? Age { get; set; }
        public string? Gender { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Zip { get; set; }
        
        // Streaming service preferences
        public int? Netflix { get; set; }
        public int? AmazonPrime { get; set; }
        public int? DisneyPlus { get; set; }
        public int? ParamountPlus { get; set; }
        public int? Max { get; set; }
        public int? Hulu { get; set; }
        public int? AppleTVPlus { get; set; }
        public int? Peacock { get; set; }
    }

    public class AuthLoginModel
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }
}
