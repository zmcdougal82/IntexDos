using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoviesApp.API.Data;
using MoviesApp.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
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
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            // In a real application you'd want to restrict this endpoint to admins
            // and implement pagination
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
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            // Don't return sensitive information like password hash
            user.PasswordHash = null;

            return user;
        }

        // POST: api/Users/register
        [HttpPost("register")]
        public async Task<ActionResult<User>> RegisterUser(RegisterUserModel model)
        {
            // Check if email is already in use
            if (await _context.Users.AnyAsync(u => u.Email == model.Email))
            {
                return Conflict("Email is already in use");
            }

            // Create new user
            var user = new User
            {
                Name = model.Name,
                Email = model.Email,
                PasswordHash = HashPassword(model.Password),
                Role = "User" // Default role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Don't return sensitive information like password hash
            user.PasswordHash = null;

            return CreatedAtAction(nameof(GetUser), new { id = user.UserId }, user);
        }

        // POST: api/Users/login
        [HttpPost("login")]
        public async Task<ActionResult<User>> Login(LoginModel model)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null || user.PasswordHash != HashPassword(model.Password))
            {
                return Unauthorized("Invalid email or password");
            }

            // Don't return sensitive information like password hash
            user.PasswordHash = null;

            return Ok(user);
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserModel model)
        {
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
                user.PasswordHash = HashPassword(model.Password);
            }

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

        private string HashPassword(string password)
        {
            // In a real application use a proper password hashing library like BCrypt
            // This is a simplified example using SHA256
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }
    }

    // Input models
    public class RegisterUserModel
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginModel
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

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
