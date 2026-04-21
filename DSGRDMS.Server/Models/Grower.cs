namespace DSGRDMS.Server.Models;

public class Grower
{
    public int Id { get; set; }
    public Guid InternalId { get; set; }              // private — never exposed via API
    public string GrowerId { get; set; } = string.Empty;   // e.g. G001 — shown in UI
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string IdNumber { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PasswordHash { get; set; } // New: hashed password for grower login
    public string? BusinessName { get; set; }
    public string? BusinessRegNumber { get; set; }
    public string? LandTenure { get; set; }
    public string? TreeSpecies { get; set; }
    public decimal? PlantationSize { get; set; }
    public double? GpsLat { get; set; }
    public double? GpsLng { get; set; }
    public string Status { get; set; } = "pending";        // pending | in review | approved | rejected | returned
    public bool IsDraft { get; set; }
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
}
