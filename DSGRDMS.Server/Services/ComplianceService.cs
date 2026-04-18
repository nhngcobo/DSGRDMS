using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Models;
using DSGRDMS.Server.Repositories;

namespace DSGRDMS.Server.Services;

public class ComplianceService(
    IComplianceRepository complianceRepo,
    IGrowerRepository growerRepo,
    IWebHostEnvironment env) : IComplianceService
{
    private static readonly HashSet<string> AllowedExtensions =
        [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];

    private static readonly long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    // ── GET summary ──────────────────────────────────────────────────────────

    public async Task<ComplianceSummaryResponse?> GetSummaryAsync(string growerId)
    {
        var grower = await growerRepo.GetByGrowerIdAsync(growerId);
        if (grower is null) return null;

        var uploadedDocs = (await complianceRepo.GetByGrowerIdAsync(growerId))
            .ToDictionary(d => d.DocumentTypeId);

        var documents = DocumentTypes.All
            .Select(dt =>
            {
                uploadedDocs.TryGetValue(dt.Id, out var doc);
                return ToDto(dt, doc);
            })
            .ToList();

        return new ComplianceSummaryResponse
        {
            GrowerId     = grower.GrowerId,
            GrowerName   = $"{grower.FirstName} {grower.LastName}",
            GrowerStatus = grower.Status,
            Documents    = documents,
        };
    }

    // ── UPLOAD ───────────────────────────────────────────────────────────────

    public async Task<(ComplianceDocumentDto? Result, string? Error)> UploadAsync(
        string growerId, int docTypeId, IFormFile file)
    {
        var grower = await growerRepo.GetByGrowerIdAsync(growerId);
        if (grower is null) return (null, "Grower not found.");

        var docType = DocumentTypes.All.FirstOrDefault(d => d.Id == docTypeId);
        if (docType is null) return (null, "Invalid document type.");

        if (file.Length == 0) return (null, "File is empty.");
        if (file.Length > MaxFileSizeBytes) return (null, "File must be 10 MB or smaller.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return (null, "File type not allowed. Use PDF, image, or Word document.");

        // Safe path — growerId is always validated against DB
        var uploadDir = Path.Combine(env.ContentRootPath, "FileStorage", growerId);
        Directory.CreateDirectory(uploadDir);

        var storedName = $"{Guid.NewGuid()}{ext}";
        var fullPath   = Path.Combine(uploadDir, storedName);

        using (var stream = File.Create(fullPath))
            await file.CopyToAsync(stream);

        var doc = new ComplianceDocument
        {
            GrowerId       = growerId,
            DocumentTypeId = docTypeId,
            Status         = "pending_review",
            FileName       = Path.GetFileName(file.FileName),
            StoredFileName = storedName,
            UploadedAt     = DateTime.UtcNow,
        };

        var saved = await complianceRepo.UpsertAsync(doc);
        return (ToDto(docType, saved), null);
    }

    // ── REVIEW ───────────────────────────────────────────────────────────────

    public async Task<(ComplianceDocumentDto? Result, string? Error)> ReviewAsync(
        string growerId, int docTypeId, string action, string? reason)
    {
        var grower = await growerRepo.GetByGrowerIdAsync(growerId);
        if (grower is null) return (null, "Grower not found.");

        var docType = DocumentTypes.All.FirstOrDefault(d => d.Id == docTypeId);
        if (docType is null) return (null, "Invalid document type.");

        var doc = await complianceRepo.GetByGrowerAndTypeAsync(growerId, docTypeId);
        if (doc is null) return (null, "No document has been uploaded yet.");
        if (doc.Status != "pending_review") return (null, "Document is not pending review.");

        if (action == "rejected" && string.IsNullOrWhiteSpace(reason))
            return (null, "A rejection reason is required.");

        doc.Status          = action; // "approved" | "rejected"
        doc.ReviewedAt      = DateTime.UtcNow;
        doc.RejectionReason = action == "rejected" ? reason!.Trim() : null;

        await complianceRepo.UpdateAsync(doc);

        // Auto-promote grower to "verified" when all required documents are approved
        if (action == "approved" && grower.Status != "verified")
        {
            var allDocs = (await complianceRepo.GetByGrowerIdAsync(growerId))
                .ToDictionary(d => d.DocumentTypeId);

            var allRequiredApproved = DocumentTypes.All
                .Where(dt => dt.IsRequired)
                .All(dt => allDocs.TryGetValue(dt.Id, out var d) && d.Status == "approved");

            if (allRequiredApproved)
                await growerRepo.UpdateStatusAsync(growerId, "verified");
        }

        return (ToDto(docType, doc), null);
    }

    // ── FILE DOWNLOAD ────────────────────────────────────────────────────────

    public async Task<(string FilePath, string FileName, string ContentType)?> GetDocumentFileAsync(
        string growerId, int docTypeId)
    {
        var doc = await complianceRepo.GetByGrowerAndTypeAsync(growerId, docTypeId);
        if (doc is null) return null;

        var fullPath = Path.Combine(env.ContentRootPath, "FileStorage", growerId, doc.StoredFileName);
        if (!File.Exists(fullPath)) return null;

        var ext = Path.GetExtension(doc.StoredFileName).ToLowerInvariant();
        var contentType = ext switch
        {
            ".pdf"  => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png"  => "image/png",
            ".doc"  => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _       => "application/octet-stream",
        };

        return (fullPath, doc.FileName, contentType);
    }

    // ── mapping ──────────────────────────────────────────────────────────────

    private static ComplianceDocumentDto ToDto(DocumentTypes.DocType dt, ComplianceDocument? doc) => new()
    {
        DocTypeId       = dt.Id,
        DocumentName    = dt.Name,
        IsRequired      = dt.IsRequired,
        Status          = doc?.Status ?? "not_uploaded",
        FileName        = doc?.FileName,
        FileUrl         = doc is not null
                            ? $"/api/compliance/{doc.GrowerId}/{doc.DocumentTypeId}/file"
                            : null,
        RejectionReason = doc?.RejectionReason,
        UploadedAt      = doc?.UploadedAt,
        ReviewedAt      = doc?.ReviewedAt,
    };
}
