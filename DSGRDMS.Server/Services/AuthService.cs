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
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant());
        if (user is null || !PasswordHelper.Verify(password, user.PasswordHash))
            return null;

        return BuildResponse(user);
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
}
