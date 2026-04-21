using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using DSGRDMS.Server.Data;
using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Helpers;

namespace DSGRDMS.Server.Services;

public class AuthService(AppDbContext db, IConfiguration config) : IAuthService
{
    public async Task<LoginResponse?> LoginAsync(string email, string password)
    {
        var normalizedEmail = email.ToLowerInvariant();
        
        // Try to authenticate as a User (admin/staff)
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user is not null && PasswordHelper.Verify(password, user.PasswordHash))
        {
            return BuildResponse(user);
        }

        // Try to authenticate as a Grower
        var grower = await db.Growers.FirstOrDefaultAsync(g => g.Email == normalizedEmail);
        if (grower is not null && !string.IsNullOrEmpty(grower.PasswordHash) && PasswordHelper.Verify(password, grower.PasswordHash))
        {
            return BuildGrowerResponse(grower);
        }

        return null;
    }

    public async Task<LoginResponse?> LinkGrowerAsync(int userId, string growerId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return null;

        user.GrowerId = growerId;
        await db.SaveChangesAsync();
        return BuildResponse(user);
    }

    private LoginResponse BuildResponse(Models.User user)
    {
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(double.Parse(config["Jwt:ExpiryHours"] ?? "8"));

        var claims = new List<Claim>
        {
            new("sub",   user.Id.ToString()),
            new("email", user.Email),
            new("role",  user.Role),
            new("name",  user.FullName),
        };

        if (user.GrowerId is not null)
            claims.Add(new Claim("growerId", user.GrowerId));

        var token = new JwtSecurityToken(
            issuer:            config["Jwt:Issuer"],
            audience:          config["Jwt:Audience"],
            claims:            claims,
            expires:           expiry,
            signingCredentials: creds);

        return new LoginResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            user.Role,
            user.FullName,
            user.GrowerId);
    }

    private LoginResponse BuildGrowerResponse(Models.Grower grower)
    {
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(double.Parse(config["Jwt:ExpiryHours"] ?? "8"));

        var fullName = $"{grower.FirstName} {grower.LastName}".Trim();
        
        var claims = new List<Claim>
        {
            new("sub",       grower.Id.ToString()),
            new("email",     grower.Email ?? ""),
            new("role",      "grower"),
            new("name",      fullName),
            new("growerId",  grower.GrowerId)
        };

        var token = new JwtSecurityToken(
            issuer:            config["Jwt:Issuer"],
            audience:          config["Jwt:Audience"],
            claims:            claims,
            expires:           expiry,
            signingCredentials: creds);

        return new LoginResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            "grower",
            fullName,
            grower.GrowerId);
    }
}
