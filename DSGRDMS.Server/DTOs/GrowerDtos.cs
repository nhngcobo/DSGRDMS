using System.ComponentModel.DataAnnotations;

namespace DSGRDMS.Server.DTOs;

public class RegisterGrowerRequest
{
    [Required] public string FirstName { get; set; } = string.Empty;
    [Required] public string LastName { get; set; } = string.Empty;
    [Required][StringLength(13, MinimumLength = 13)] public string IdNumber { get; set; } = string.Empty;
    [Required] public string Phone { get; set; } = string.Empty;
    [EmailAddress] public string? Email { get; set; }
    public string? BusinessName { get; set; }
    public string? BusinessRegNumber { get; set; }
    public string? LandTenure { get; set; }
    public string? TreeSpecies { get; set; }
    [Range(0.01, double.MaxValue)] public decimal? PlantationSize { get; set; }
    [Range(-90, 90)]   public double? GpsLat { get; set; }
    [Range(-180, 180)] public double? GpsLng { get; set; }
    public bool Draft { get; set; }
}

public class UpdateGrowerRequest
{
    public string? Phone { get; set; }
    [EmailAddress] public string? Email { get; set; }
    public string? BusinessName { get; set; }
    public string? BusinessRegNumber { get; set; }
    public string? LandTenure { get; set; }
    public string? TreeSpecies { get; set; }
    [Range(0.01, double.MaxValue)] public decimal? PlantationSize { get; set; }
    [Range(-90, 90)]   public double? GpsLat { get; set; }
    [Range(-180, 180)] public double? GpsLng { get; set; }
    public string? Status { get; set; }
}

public class GrowerResponse
{
    public string Id { get; set; } = string.Empty;          // GrowerId (G001)
    public string Name { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string IdNumber { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? BusinessName { get; set; }
    public string? BusinessRegNumber { get; set; }
    public string? FarmSize { get; set; }
    public decimal? PlantationSize { get; set; }
    public string? LandTenure { get; set; }
    public string? TreeSpecies { get; set; }
    public double? GpsLat { get; set; }
    public double? GpsLng { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? Compliance { get; set; }
    public string Risk { get; set; } = "low";
    public bool IsDraft { get; set; }
    public DateTime RegisteredAt { get; set; }
    
    // Field Visit Coordination
    public string VisitStatus { get; set; } = "Pending";      // Pending | Scheduled | Visited | Completed
    public DateTime? ScheduledDate { get; set; }
    public string? Findings { get; set; }
}
