namespace DSGRDMS.Server.Models;

public class FieldVisit
{
    public int Id { get; set; }
    public string GrowerId { get; set; } = string.Empty;              // Foreign key to Grower
    public string VisitType { get; set; } = string.Empty;             // e.g., "Inspection", "Assessment", "Compliance Check"
    public string Title { get; set; } = string.Empty;                 // e.g., "Spring Growth Assessment"
    public DateTime ScheduledDate { get; set; }
    public TimeOnly ScheduledTime { get; set; }
    public string Location { get; set; } = string.Empty;              // e.g., "All Production Areas"
    public string Priority { get; set; } = "normal";                  // low | normal | high | critical
    public string OfficerId { get; set; } = string.Empty;             // Assigned field officer
    public string OfficerName { get; set; } = string.Empty;           // Officer's name for quick access
    public string Status { get; set; } = "scheduled";                 // scheduled | in_progress | completed | cancelled
    public string? Notes { get; set; }
    public string? Findings { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
