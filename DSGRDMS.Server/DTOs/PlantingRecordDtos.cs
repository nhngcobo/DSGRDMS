namespace DSGRDMS.Server.DTOs;

public class PlantingRecordDto
{
    public int Id { get; set; }
    public string GrowerId { get; set; } = string.Empty;
    public DateTime DatePlanted { get; set; }
    public int NumberOfPlantsPlanted { get; set; }
    public string PlantSpecies { get; set; } = string.Empty;
    public string PlantingArea { get; set; } = string.Empty;
    public string? IssuesEncountered { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? FieldOfficerId { get; set; }
    public string? OfficerNotes { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> PhotoFilenames { get; set; } = new();
}

public class CreatePlantingRecordRequest
{
    public string GrowerId { get; set; } = string.Empty;
    public DateTime DatePlanted { get; set; }
    public int NumberOfPlantsPlanted { get; set; }
    public string PlantSpecies { get; set; } = string.Empty;
    public string PlantingArea { get; set; } = string.Empty;
    public string? IssuesEncountered { get; set; }
    public List<string> PhotoFilenames { get; set; } = new();
}

public class UpdatePlantingRecordRequest
{
    public DateTime DatePlanted { get; set; }
    public int NumberOfPlantsPlanted { get; set; }
    public string PlantSpecies { get; set; } = string.Empty;
    public string PlantingArea { get; set; } = string.Empty;
    public string? IssuesEncountered { get; set; }
    public List<string> PhotoFilenames { get; set; } = new();
}

public class ReviewPlantingRecordRequest
{
    public string Status { get; set; } = string.Empty;           // approved | needs_revision
    public string? OfficerNotes { get; set; }
}
