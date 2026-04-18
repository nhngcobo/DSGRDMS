namespace DSGRDMS.Server.Models;

public class ComplianceDocument
{
    public int Id { get; set; }
    public string GrowerId { get; set; } = string.Empty;       // e.g. G001
    public int DocumentTypeId { get; set; }                    // 1–8 from DocumentTypes
    public string Status { get; set; } = "pending_review";     // pending_review | approved | rejected
    public string FileName { get; set; } = string.Empty;       // original filename shown to user
    public string StoredFileName { get; set; } = string.Empty; // GUID-based safe name on disk
    public DateTime UploadedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }
}
