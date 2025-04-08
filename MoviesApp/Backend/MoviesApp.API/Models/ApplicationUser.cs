using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoviesApp.API.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public int? Age { get; set; }
        public string? Gender { get; set; }
        
        // Streaming service preferences
        public int? Netflix { get; set; }
        public int? AmazonPrime { get; set; }
        public int? DisneyPlus { get; set; }
        public int? ParamountPlus { get; set; }
        public int? Max { get; set; }
        public int? Hulu { get; set; }
        public int? AppleTVPlus { get; set; }
        public int? Peacock { get; set; }
        
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Zip { get; set; }
        
        // Navigation property
        public virtual ICollection<Rating>? Ratings { get; set; }
    }
}
