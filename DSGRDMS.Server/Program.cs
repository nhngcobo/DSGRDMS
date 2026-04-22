using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using DSGRDMS.Server.Data;
using DSGRDMS.Server.Helpers;
using DSGRDMS.Server.Models;
using DSGRDMS.Server.Repositories;
using DSGRDMS.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"), 
        new MySqlServerVersion(new Version(8, 0, 0))));

builder.Services.AddScoped<IGrowerRepository, GrowerRepository>();
builder.Services.AddScoped<IGrowerService, GrowerService>();
builder.Services.AddScoped<IComplianceRepository, ComplianceRepository>();
builder.Services.AddScoped<IComplianceService, ComplianceService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFieldVisitRepository, FieldVisitRepository>();
builder.Services.AddScoped<IFieldVisitService, FieldVisitService>();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType            = "role",
            NameClaimType            = "name",
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? [];
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("FrontendDev");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply any pending migrations (creates the DB file if it doesn't exist)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Seed demo users if the table is empty
    if (!db.Users.Any())
    {
        db.Users.AddRange(
            new User { Email = "admin@demo.com",   PasswordHash = PasswordHelper.Hash("Admin123!"),   Role = "admin",        FullName = "System Admin"   },
            new User { Email = "officer@demo.com", PasswordHash = PasswordHelper.Hash("Officer123!"), Role = "field_officer", FullName = "James Dlamini" }
        );
        db.SaveChanges();
    }

    else
    {
        // Ensure a field officer exists
        var fieldOfficer = db.Users.FirstOrDefault(u => u.Email == "officer@demo.com");
        if (fieldOfficer == null)
        {
            fieldOfficer = new User 
            { 
                Email = "officer@demo.com", 
                PasswordHash = PasswordHelper.Hash("Officer123!"), 
                Role = "field_officer", 
                FullName = "James Dlamini" 
            };
            db.Users.Add(fieldOfficer);
            db.SaveChanges();
        }
    }
}

app.MapFallbackToFile("/index.html");

app.Run();

