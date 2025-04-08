using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoviesApp.API.Data;
using MoviesApp.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MoviesApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public UsersController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/Users
        [HttpGet]
        [Authorize(Roles = "Admin")] // Only admins can list all users
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
        [Authorize] // Require authentication
        public async Task<ActionResult<ApplicationUser>> GetUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            // Don't return sensitive information
            return new ApplicationUser
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                Name = user.Name,
                Phone = user.Phone,
                Age = user.Age,
                Gender = user.Gender,
                City = user.City,
                State = user.State,
                Zip = user.Zip,
                Netflix = user.Netflix,
                AmazonPrime = user.AmazonPrime,
                DisneyPlus = user.DisneyPlus,
                ParamountPlus = user.ParamountPlus,
                Max = user.Max,
                Hulu = user.Hulu,
                AppleTVPlus = user.AppleTVPlus,
                Peacock = user.Peacock
            };
        }


        // PUT: api/Users/5
        [HttpPut("{id}")]
        [Authorize] // Require authentication
        public async Task<IActionResult> UpdateUser(string id, UpdateUserModel model)
        {
            // Get the current user ID from the claims
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            // Check if the user is trying to update their own profile or is an admin
            if (userId != id && !User.IsInRole("Admin"))
            {
                return Forbid("You can only update your own profile");
            }
            
            var user = await _userManager.FindByIdAsync(id);
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
                // Remove the old password
                var removePasswordResult = await _userManager.RemovePasswordAsync(user);
                if (!removePasswordResult.Succeeded)
                {
                    foreach (var error in removePasswordResult.Errors)
                    {
                        ModelState.AddModelError(string.Empty, error.Description);
                    }
                    return BadRequest(ModelState);
                }
                
                // Add the new password
                var addPasswordResult = await _userManager.AddPasswordAsync(user, model.Password);
                if (!addPasswordResult.Succeeded)
                {
                    foreach (var error in addPasswordResult.Errors)
                    {
                        ModelState.AddModelError(string.Empty, error.Description);
                    }
                    return BadRequest(ModelState);
                }
            }

            // Save changes
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }
                return BadRequest(ModelState);
            }

            return NoContent();
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
