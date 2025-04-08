using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoviesApp.API.Data;
using MoviesApp.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace MoviesApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Users
        [HttpGet]
        [Authorize(Roles = "Admin")] // Only admins can list all users
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            // In a real application you'd want to implement pagination
            return await _context.Users
                .Select(u => new User
                {
                    UserId = u.UserId,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role
                    // Don't include sensitive fields like PasswordHash
                })
                .Take(100)
                .ToListAsync();
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        [Authorize] // Require authentication
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            // Don't return sensitive information
            user.PasswordHash = null;

            return user;
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        [Authorize] // Require authentication
        public async Task<IActionResult> UpdateUser(int id, UpdateUserModel model)
        {
            // Get the current user ID from the claims
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return BadRequest("Invalid user ID in token");
            }
            
            // Check if the user is trying to update their own profile or is an admin
            if (userId != id && !User.IsInRole("Admin"))
            {
                return Forbid("You can only update your own profile");
            }
            
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Update basic info
            if (!string.IsNullOrEmpty(model.Name))
            {
                user.Name = model.Name;
            }

            if (!string.IsNullOrEmpty(model.Phone))
            {
                user.Phone = model.Phone;
            }

            if (model.Age.HasValue)
            {
                user.Age = model.Age;
            }

            if (!string.IsNullOrEmpty(model.Gender))
            {
                user.Gender = model.Gender;
            }

            if (!string.IsNullOrEmpty(model.City))
            {
                user.City = model.City;
            }

            if (!string.IsNullOrEmpty(model.State))
            {
                user.State = model.State;
            }

            if (model.Zip.HasValue)
            {
                user.Zip = model.Zip.ToString();
            }

            // Update streaming service preferences
            if (model.Netflix.HasValue)
            {
                user.Netflix = model.Netflix;
            }

            if (model.AmazonPrime.HasValue)
            {
                user.AmazonPrime = model.AmazonPrime;
            }

            if (model.DisneyPlus.HasValue)
            {
                user.DisneyPlus = model.DisneyPlus;
            }

            if (model.ParamountPlus.HasValue)
            {
                user.ParamountPlus = model.ParamountPlus;
            }

            if (model.Max.HasValue)
            {
                user.Max = model.Max;
            }

            if (model.Hulu.HasValue)
            {
                user.Hulu = model.Hulu;
            }

            if (model.AppleTVPlus.HasValue)
            {
                user.AppleTVPlus = model.AppleTVPlus;
            }

            if (model.Peacock.HasValue)
            {
                user.Peacock = model.Peacock;
            }

            // Update password if provided
            if (!string.IsNullOrEmpty(model.Password))
            {
                // Create password hash
                user.PasswordHash = HashPassword(model.Password);
            }

            // Save changes
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.UserId == id);
        }

        // Password hashing methods
        private string HashPassword(string password)
        {
            // Generate a random salt
            byte[] salt = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            // Hash the password with the salt
            byte[] hash = GetHash(password, salt);

            // Combine the salt and hash into a single string
            byte[] hashBytes = new byte[36];
            Array.Copy(salt, 0, hashBytes, 0, 16);
            Array.Copy(hash, 0, hashBytes, 16, 20);

            return Convert.ToBase64String(hashBytes);
        }

        private byte[] GetHash(string password, byte[] salt)
        {
            using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256))
            {
                return pbkdf2.GetBytes(20);
            }
        }
    }

    // Input models
    public class UpdateUserModel
    {
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public int? Age { get; set; }
        public string? Gender { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public int? Zip { get; set; }
        public string? Password { get; set; }

        // Streaming preferences
        public int? Netflix { get; set; }
        public int? AmazonPrime { get; set; }
        public int? DisneyPlus { get; set; }
        public int? ParamountPlus { get; set; }
        public int? Max { get; set; }
        public int? Hulu { get; set; }
        public int? AppleTVPlus { get; set; }
        public int? Peacock { get; set; }
    }
}
