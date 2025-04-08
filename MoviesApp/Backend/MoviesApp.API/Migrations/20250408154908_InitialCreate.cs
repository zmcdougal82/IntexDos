using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoviesApp.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Age = table.Column<int>(type: "int", nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Netflix = table.Column<int>(type: "int", nullable: true),
                    AmazonPrime = table.Column<int>(type: "int", nullable: true),
                    DisneyPlus = table.Column<int>(type: "int", nullable: true),
                    ParamountPlus = table.Column<int>(type: "int", nullable: true),
                    Max = table.Column<int>(type: "int", nullable: true),
                    Hulu = table.Column<int>(type: "int", nullable: true),
                    AppleTVPlus = table.Column<int>(type: "int", nullable: true),
                    Peacock = table.Column<int>(type: "int", nullable: true),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    State = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Zip = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "movies_titles",
                columns: table => new
                {
                    show_id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    type = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    director = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    cast = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    country = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    release_year = table.Column<int>(type: "int", nullable: true),
                    rating = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    duration = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Action = table.Column<int>(type: "int", nullable: true),
                    Adventure = table.Column<int>(type: "int", nullable: true),
                    AnimeSeriesInternationalTVShows = table.Column<int>(type: "int", nullable: true),
                    BritishTVShowsDocuseriesInternationalTVShows = table.Column<int>(type: "int", nullable: true),
                    Children = table.Column<int>(type: "int", nullable: true),
                    Comedies = table.Column<int>(type: "int", nullable: true),
                    ComediesDramasInternationalMovies = table.Column<int>(type: "int", nullable: true),
                    ComediesInternationalMovies = table.Column<int>(type: "int", nullable: true),
                    ComediesRomanticMovies = table.Column<int>(type: "int", nullable: true),
                    CrimeTVShowsDocuseries = table.Column<int>(type: "int", nullable: true),
                    Documentaries = table.Column<int>(type: "int", nullable: true),
                    DocumentariesInternationalMovies = table.Column<int>(type: "int", nullable: true),
                    Docuseries = table.Column<int>(type: "int", nullable: true),
                    Dramas = table.Column<int>(type: "int", nullable: true),
                    DramasInternationalMovies = table.Column<int>(type: "int", nullable: true),
                    DramasRomanticMovies = table.Column<int>(type: "int", nullable: true),
                    FamilyMovies = table.Column<int>(type: "int", nullable: true),
                    Fantasy = table.Column<int>(type: "int", nullable: true),
                    HorrorMovies = table.Column<int>(type: "int", nullable: true),
                    InternationalMoviesThrillers = table.Column<int>(type: "int", nullable: true),
                    InternationalTVShowsRomanticTVShowsTVDramas = table.Column<int>(type: "int", nullable: true),
                    KidsTV = table.Column<int>(type: "int", nullable: true),
                    LanguageTVShows = table.Column<int>(type: "int", nullable: true),
                    Musicals = table.Column<int>(type: "int", nullable: true),
                    NatureTV = table.Column<int>(type: "int", nullable: true),
                    RealityTV = table.Column<int>(type: "int", nullable: true),
                    Spirituality = table.Column<int>(type: "int", nullable: true),
                    TVAction = table.Column<int>(type: "int", nullable: true),
                    TVComedies = table.Column<int>(type: "int", nullable: true),
                    TVDramas = table.Column<int>(type: "int", nullable: true),
                    TalkShowsTVComedies = table.Column<int>(type: "int", nullable: true),
                    Thrillers = table.Column<int>(type: "int", nullable: true),
                    poster_url = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movies_titles", x => x.show_id);
                });

            migrationBuilder.CreateTable(
                name: "movies_users",
                columns: table => new
                {
                    user_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    age = table.Column<int>(type: "int", nullable: true),
                    gender = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Netflix = table.Column<int>(type: "int", nullable: true),
                    AmazonPrime = table.Column<int>(type: "int", nullable: true),
                    DisneyPlus = table.Column<int>(type: "int", nullable: true),
                    ParamountPlus = table.Column<int>(type: "int", nullable: true),
                    Max = table.Column<int>(type: "int", nullable: true),
                    Hulu = table.Column<int>(type: "int", nullable: true),
                    AppleTVPlus = table.Column<int>(type: "int", nullable: true),
                    Peacock = table.Column<int>(type: "int", nullable: true),
                    city = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    state = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    zip = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    password_hash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    role = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movies_users", x => x.user_id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "movies_ratings",
                columns: table => new
                {
                    user_id = table.Column<int>(type: "int", nullable: false),
                    show_id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    rating = table.Column<int>(type: "int", nullable: false),
                    timestamp = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ApplicationUserId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movies_ratings", x => new { x.user_id, x.show_id });
                    table.ForeignKey(
                        name: "FK_movies_ratings_AspNetUsers_ApplicationUserId",
                        column: x => x.ApplicationUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_movies_ratings_movies_titles_show_id",
                        column: x => x.show_id,
                        principalTable: "movies_titles",
                        principalColumn: "show_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_movies_ratings_movies_users_user_id",
                        column: x => x.user_id,
                        principalTable: "movies_users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_movies_ratings_ApplicationUserId",
                table: "movies_ratings",
                column: "ApplicationUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movies_ratings_show_id",
                table: "movies_ratings",
                column: "show_id");

            migrationBuilder.CreateIndex(
                name: "IX_movies_users_email",
                table: "movies_users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "movies_ratings");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "movies_titles");

            migrationBuilder.DropTable(
                name: "movies_users");
        }
    }
}
