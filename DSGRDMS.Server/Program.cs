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

    // Seed/update demo grower
    var busisiweGrower = db.Growers.FirstOrDefault(g => g.Email == "busisiwe.cele@grownet.co.za");
    if (busisiweGrower == null)
    {
        busisiweGrower = new Grower
        {
            InternalId = Guid.NewGuid(),
            GrowerId = "G001",
            FirstName = "Busisiwe",
            LastName = "Cele",
            IdNumber = "8506145678089",
            Phone = "+27 82 456 7890",
            Email = "busisiwe.cele@grownet.co.za",
            PasswordHash = PasswordHelper.Hash("Grower123!"),
            BusinessName = "Cele Timber Farms",
            BusinessRegNumber = "2018/123456/07",
            LandTenure = "Owned",
            TreeSpecies = "Pine, Eucalyptus",
            PlantationSize = 45.5m,
            GpsLat = -29.8587,
            GpsLng = 31.0218,
            Status = "approved",
            IsDraft = false,
            RegisteredAt = DateTime.UtcNow.AddMonths(-6)
        };
        db.Growers.Add(busisiweGrower);
        db.SaveChanges();
    }
    else
    {
        // Update existing record to ensure correct data
        busisiweGrower.FirstName = "Busisiwe";
        busisiweGrower.LastName = "Cele";
        busisiweGrower.IdNumber = "8506145678089";
        busisiweGrower.Phone = "+27 82 456 7890";
        busisiweGrower.Email = "busisiwe.cele@grownet.co.za";
        busisiweGrower.PasswordHash = PasswordHelper.Hash("Grower123!");
        busisiweGrower.BusinessName = "Cele Timber Farms";
        busisiweGrower.BusinessRegNumber = "2018/123456/07";
        busisiweGrower.LandTenure = "Owned";
        busisiweGrower.TreeSpecies = "Pine, Eucalyptus";
        busisiweGrower.PlantationSize = 45.5m;
        busisiweGrower.GpsLat = -29.8587;
        busisiweGrower.GpsLng = 31.0218;
        busisiweGrower.Status = "approved";
        busisiweGrower.IsDraft = false;
        db.SaveChanges();
    }

    // Update all growers without passwords to use default password
    var growersWithoutPassword = db.Growers.Where(g => string.IsNullOrEmpty(g.PasswordHash)).ToList();
    if (growersWithoutPassword.Any())
    {
        var defaultPasswordHash = PasswordHelper.Hash("Grower123!");
        foreach (var grower in growersWithoutPassword)
        {
            grower.PasswordHash = defaultPasswordHash;
        }
        db.SaveChanges();
    }

    // Seed demo users if the table is empty
    if (!db.Users.Any())
    {
        db.Users.AddRange(
            new User { Email = "admin@demo.com",   PasswordHash = PasswordHelper.Hash("Admin123!"),   Role = "admin",        FullName = "System Admin"   },
            new User { Email = "officer@demo.com", PasswordHash = PasswordHelper.Hash("Officer123!"), Role = "field_officer", FullName = "James Dlamini" },
            new User { Email = "grower@demo.com",  PasswordHash = PasswordHelper.Hash("Grower123!"),  Role = "grower",       FullName = "Demo Grower"    }
        );
        db.SaveChanges();
    }

    // Seed compliance documents for Busisiwe if she doesn't have any
    if (!db.ComplianceDocuments.Any(c => c.GrowerId == busisiweGrower.GrowerId))
    {
        var random = new Random(42);
        var documents = new List<ComplianceDocument>();
        
        // Required documents (IDs 1-8) - Busisiwe is "approved" so 85-95% approved
        var requiredDocIds = new[] { 1, 2, 3, 4, 5, 6, 7, 8 };
        double approvalRate = 0.90; // 90% approval for approved grower
        
        foreach (var docId in requiredDocIds)
        {
            var shouldApprove = random.NextDouble() < approvalRate;
            var shouldReject = !shouldApprove && random.NextDouble() < 0.15;
            var shouldPending = !shouldApprove && !shouldReject && random.NextDouble() < 0.5;

            string status;
            if (shouldApprove)
                status = "approved";
            else if (shouldReject)
                status = "rejected";
            else if (shouldPending)
                status = "pending_review";
            else
                continue; // Not uploaded

            var daysAgo = random.Next(1, 90);
            documents.Add(new ComplianceDocument
            {
                GrowerId = busisiweGrower.GrowerId,
                DocumentTypeId = docId,
                Status = status,
                FileName = $"document_{docId}.pdf",
                StoredFileName = $"{Guid.NewGuid()}.pdf",
                UploadedAt = DateTime.UtcNow.AddDays(-daysAgo),
                ReviewedAt = status != "pending_review" ? DateTime.UtcNow.AddDays(-daysAgo + random.Next(1, 5)) : null,
                RejectionReason = status == "rejected" ? "Document quality insufficient or information incomplete" : null
            });
        }

        // Add 2 optional documents
        var optionalDocIds = new[] { 9, 10 };
        foreach (var docId in optionalDocIds)
        {
            var daysAgo = random.Next(1, 60);
            documents.Add(new ComplianceDocument
            {
                GrowerId = busisiweGrower.GrowerId,
                DocumentTypeId = docId,
                Status = "approved",
                FileName = $"document_{docId}.pdf",
                StoredFileName = $"{Guid.NewGuid()}.pdf",
                UploadedAt = DateTime.UtcNow.AddDays(-daysAgo),
                ReviewedAt = DateTime.UtcNow.AddDays(-daysAgo + 2)
            });
        }

        db.ComplianceDocuments.AddRange(documents);
        db.SaveChanges();
    }

    // Seed compliance documents for demo data
    if (!db.ComplianceDocuments.Any())
    {
        var growers = db.Growers.ToList();
        var random = new Random(42); // Fixed seed for reproducible data
        var documents = new List<ComplianceDocument>();

        foreach (var grower in growers)
        {
            // Required documents (IDs 1-8)
            var requiredDocIds = new[] { 1, 2, 3, 4, 5, 6, 7, 8 };
            
            // Determine grower's compliance level based on their status
            // Approved/verified: 85-95% approved, In review: 60-80%, Pending: 30-60%
            double approvalRate = grower.Status.ToLower() switch
            {
                "approved" or "verified" => 0.85 + random.NextDouble() * 0.10,
                "in review" => 0.60 + random.NextDouble() * 0.20,
                _ => 0.30 + random.NextDouble() * 0.30
            };

            foreach (var docId in requiredDocIds)
            {
                var shouldApprove = random.NextDouble() < approvalRate;
                var shouldReject = !shouldApprove && random.NextDouble() < 0.15; // 15% chance of rejection
                var shouldPending = !shouldApprove && !shouldReject && random.NextDouble() < 0.5; // 50% of remainder is pending

                string status;
                if (shouldApprove)
                    status = "approved";
                else if (shouldReject)
                    status = "rejected";
                else if (shouldPending)
                    status = "pending_review";
                else
                    continue; // Not uploaded

                var daysAgo = random.Next(1, 90);
                documents.Add(new ComplianceDocument
                {
                    GrowerId = grower.GrowerId,
                    DocumentTypeId = docId,
                    Status = status,
                    FileName = $"document_{docId}.pdf",
                    StoredFileName = $"{Guid.NewGuid()}.pdf",
                    UploadedAt = DateTime.UtcNow.AddDays(-daysAgo),
                    ReviewedAt = status != "pending_review" ? DateTime.UtcNow.AddDays(-daysAgo + random.Next(1, 5)) : null,
                    RejectionReason = status == "rejected" ? "Document quality insufficient or information incomplete" : null
                });
            }

            // Add some optional documents for a few growers
            if (random.NextDouble() < 0.3) // 30% of growers have optional docs
            {
                var optionalDocIds = new[] { 9, 10, 11, 12, 13 };
                var numOptional = random.Next(1, 3);
                foreach (var docId in optionalDocIds.OrderBy(_ => random.Next()).Take(numOptional))
                {
                    var daysAgo = random.Next(1, 60);
                    documents.Add(new ComplianceDocument
                    {
                        GrowerId = grower.GrowerId,
                        DocumentTypeId = docId,
                        Status = "approved",
                        FileName = $"document_{docId}.pdf",
                        StoredFileName = $"{Guid.NewGuid()}.pdf",
                        UploadedAt = DateTime.UtcNow.AddDays(-daysAgo),
                        ReviewedAt = DateTime.UtcNow.AddDays(-daysAgo + 2)
                    });
                }
            }
        }

        db.ComplianceDocuments.AddRange(documents);
        db.SaveChanges();
    }
}

app.MapFallbackToFile("/index.html");

app.Run();
