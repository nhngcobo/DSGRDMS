using System.ComponentModel.DataAnnotations;

namespace DSGRDMS.Server.DTOs;

public class ComplianceDocumentDto
{
    public int DocTypeId { get; set; }
    public string DocumentName { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public string Status { get; set; } = "not_uploaded"; // not_uploaded | pending_review | approved | rejected
    public string? FileName { get; set; }
    public string? FileUrl { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? UploadedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}

public class ComplianceSummaryResponse
{
    public string GrowerId { get; set; } = string.Empty;
    public string GrowerName { get; set; } = string.Empty;
    public string GrowerStatus { get; set; } = string.Empty;
    public List<ComplianceDocumentDto> Documents { get; set; } = [];
}

public class ReviewDocumentRequest
{
    [Required]
    public string Action { get; set; } = string.Empty; // "approved" | "rejected"
    public string? Reason { get; set; }
}
