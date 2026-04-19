namespace DSGRDMS.Server.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "grower";           // admin | field_officer | grower
    public string FullName { get; set; } = string.Empty;
    public string? GrowerId { get; set; }                  // linked Grower.GrowerId (grower role only)
}
