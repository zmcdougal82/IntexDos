using System.Globalization;

namespace MoviesApp.DataUploader.Models
{
    public class RatingCsv
    {
        public int UserId { get; set; }
        public string ShowId { get; set; } = string.Empty;
        public int RatingValue { get; set; }
        // No timestamp in the CSV, we'll add the current timestamp when uploading
    }

}
