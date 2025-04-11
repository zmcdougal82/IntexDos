using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MoviesApp.API.Data;
using System.Text;
using DotNetEnv;

// Load environment variables from .env file
DotNetEnv.Env.Load();

// Print the connection string for debugging
var connStr = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
Console.WriteLine($"DEBUG: Connection string from env var: {connStr}");

var builder = WebApplication.CreateBuilder(args);

// Print the connection string from configuration for debugging
var configConnStr = builder.Configuration.GetConnectionString("DefaultConnection");
Console.WriteLine($"DEBUG: Connection string from config: {configConnStr}");

// JWT Configuration
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyHereThatIsAtLeast32CharactersLong";

// Add services to the container.

// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "MoviesApp",
        ValidAudience = jwtSettings["Audience"] ?? "MoviesAppUsers",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization to ignore circular references
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.MaxDepth = 64; // Increase max depth to handle nested objects
    });

// Add Entity Framework Core and DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add CORS policy
builder.Services.AddCors(options =>
{
    // More permissive policy to match Node.js proxy behavior
    options.AddPolicy("AllowAny", 
        builder => builder
            .SetIsOriginAllowed(_ => true) // Allow any origin
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()); // Allow credentials

    // Original policy
    options.AddPolicy("AllowReactApp",
        builder => builder
            .SetIsOriginAllowed(_ => true) 
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// Add Swagger/OpenAPI support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Movies API", Version = "v1" });
    
    // Configure Swagger to use JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Add HttpClient factory for API proxying with increased timeout
builder.Services.AddHttpClient(Microsoft.Extensions.Options.Options.DefaultName, client =>
{
    client.Timeout = TimeSpan.FromSeconds(300); // 5-minute timeout for external API calls
});

// Register Email Service
builder.Services.AddScoped<MoviesApp.API.Services.IEmailService>(sp => 
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var httpContext = sp.GetRequiredService<IHttpContextAccessor>();
    var env = sp.GetRequiredService<IWebHostEnvironment>();
    
    // Determine the base URL for reset links
    string baseUrl;
    
    // In production (Azure), use a configured base URL or fallback to a production URL
    if (!env.IsDevelopment())
    {
        // Try to get the base URL from configuration first
        baseUrl = configuration["AppSettings:BaseUrl"] ?? "https://cineniche.azurewebsites.net";
    }
    // In development, try to determine from the current request
    else 
    {
        var request = httpContext.HttpContext?.Request;
        baseUrl = "http://localhost:5237"; // Default development fallback
        
        if (request != null)
        {
            baseUrl = $"{request.Scheme}://{request.Host}";
            // If app is behind a proxy, we might need to use X-Forwarded headers
            if (request.Headers.ContainsKey("X-Forwarded-Proto") && request.Headers.ContainsKey("X-Forwarded-Host"))
            {
                baseUrl = $"{request.Headers["X-Forwarded-Proto"]}://{request.Headers["X-Forwarded-Host"]}";
            }
        }
    }
    
    Console.WriteLine($"Email Service using base URL: {baseUrl}");
    return new MoviesApp.API.Services.EmailService(configuration, baseUrl);
});

// Add HTTP Context Accessor
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// Run database setup to create password_reset_tokens table if it doesn't exist
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var configuration = services.GetRequiredService<IConfiguration>();
    await MoviesApp.API.Utilities.DatabaseSetup.EnsurePasswordResetTableExistsAsync(configuration);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseSwagger();
app.UseSwaggerUI(c => 
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Movies API v1");
    c.RoutePrefix = string.Empty;
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts(); // HSTS enabled in non-development environments
}

app.UseHttpsRedirection();

app.UseRouting();

// Use more permissive CORS policy for the proxy functionality
app.UseCors("AllowAny");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
// Added comment to trigger backend workflow
