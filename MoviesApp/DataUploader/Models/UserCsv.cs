using System.Globalization;

namespace MoviesApp.DataUploader.Models
{
    public class UserCsv
    {
        public int user_id { get; set; }
        public string name { get; set; } = string.Empty;
        public string? phone { get; set; }
        public string email { get; set; } = string.Empty;
        public int? age { get; set; }
        public string? gender { get; set; }
        public int? Netflix { get; set; }
        public int? AmazonPrime { get; set; }
        public int? DisneyPlus { get; set; }
        public int? ParamountPlus { get; set; }
        public int? Max { get; set; }
        public int? Hulu { get; set; }
        public int? AppleTVPlus { get; set; }
        public int? Peacock { get; set; }
        public string? city { get; set; }
        public string? state { get; set; }
        public string? zip { get; set; }
        // We're not importing password_hash or role
    }

}
