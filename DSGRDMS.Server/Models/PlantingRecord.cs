namespace DSGRDMS.Server.Models;

public class PlantingRecord
{
    public int Id { get; set; }
    public string GrowerId { get; set; } = string.Empty;           // Foreign key to Grower
    public DateTime DatePlanted { get; set; }                       // When the planting happened
    public int NumberOfPlantsPlanted { get; set; }                 // How many trees/plants
    public string PlantSpecies { get; set; } = string.Empty;       // Species planted (e.g., Eucalyptus, Pine)
    public string PlantingArea { get; set; } = string.Empty;       // Location/area where planted
    public string? IssuesEncountered { get; set; }                 // Grower notes on any problems
    public string Status { get; set; } = "pending_review";         // pending_review | approved | needs_revision
    public string? FieldOfficerId { get; set; }                    // Optional: assigned officer for review
    public string? OfficerNotes { get; set; }                      // Officer feedback/findings
    public DateTime? ApprovedAt { get; set; }                      // When officer approved
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property for photos
    public List<string> PhotoFilenames { get; set; } = new();      // Stored as JSON in DB
}
