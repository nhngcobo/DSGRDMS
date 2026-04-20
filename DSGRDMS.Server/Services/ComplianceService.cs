using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using DSGRDMS.Server.Data;
using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Models;
using DSGRDMS.Server.Repositories;

namespace DSGRDMS.Server.Services;

public class ComplianceService(
    IComplianceRepository complianceRepo,
    IGrowerRepository growerRepo,
    IWebHostEnvironment env,
    AppDbContext db) : IComplianceService
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
    // ── ANALYTICS ──────────────────────────────────────────────────────────────

    public async Task<ComplianceAnalyticsResponse> GetAnalyticsAsync()
    {
        var growers = (await growerRepo.GetAllAsync()).ToList();
        var growerCount = growers.Count;
        var requiredDocIds  = DocumentTypes.All.Where(d => d.IsRequired).Select(d => d.Id).ToHashSet();
        var requiredDocCount = requiredDocIds.Count;

        var emptyCategories = DocumentTypes.All
            .Where(dt => dt.IsRequired)
            .GroupBy(dt => dt.Category)
            .OrderBy(g => g.Key)
            .Select(g => new CategoryScoreDto { Category = g.Key, Score = 0 })
            .ToList();

        if (growerCount == 0)
            return new ComplianceAnalyticsResponse { CategoryScores = emptyCategories };

        var allDocs = (await complianceRepo.GetAllAsync()).ToList();
        var docsByGrower = allDocs
            .GroupBy(d => d.GrowerId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Per-grower compliance scores (0–100)
        var growerScores = growers
            .Select(g =>
            {
                var docs = docsByGrower.TryGetValue(g.GrowerId, out var d) ? d : [];
                return (int)Math.Round((double)docs.Count(x => x.Status == "approved" && requiredDocIds.Contains(x.DocumentTypeId)) / requiredDocCount * 100);
            })
            .ToList();

        var overallCompliance  = (int)Math.Round(growerScores.Average());
        var highRiskCount      = growerScores.Count(s => s < 40);
        var fullyCompliantCount = growerScores.Count(s => s >= 90);

        // Category-level scores: (approved across all growers for that category) / (growers × docs in category)
        var categoryScores = DocumentTypes.All
            .Where(dt => dt.IsRequired)
            .GroupBy(dt => dt.Category)
            .Select(catGroup =>
            {
                var docIds        = catGroup.Select(dt => dt.Id).ToHashSet();
                var totalPossible = growerCount * catGroup.Count();
                var totalApproved = allDocs.Count(d => docIds.Contains(d.DocumentTypeId) && d.Status == "approved");
                var score         = (int)Math.Round((double)totalApproved / totalPossible * 100);
                return new CategoryScoreDto { Category = catGroup.Key, Score = score };
            })
            .OrderBy(c => c.Category)
            .ToList();

        return new ComplianceAnalyticsResponse
        {
            OverallComplianceRate  = overallCompliance,
            HighRiskCount          = highRiskCount,
            FullyCompliantCount    = fullyCompliantCount,
            CategoryScores         = categoryScores,
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

    // ── SEED DATA ────────────────────────────────────────────────────────────

    public async Task<int> SeedComplianceDataAsync()
    {
        // Clear existing compliance documents
        var existing = await complianceRepo.GetAllAsync();
        db.ComplianceDocuments.RemoveRange(existing);
        await db.SaveChangesAsync();

        var growers = (await growerRepo.GetAllAsync()).ToList();
        var random = new Random(42); // Fixed seed for reproducible data
        var documents = new List<ComplianceDocument>();

        foreach (var grower in growers)
        {
            // Required documents (IDs 1-8)
            var requiredDocIds = new[] { 1, 2, 3, 4, 5, 6, 7, 8 };
            
            // Determine grower's compliance level based on their status
            // Approved/verified: 85-95% approved, In review: 60-80%, Pending: 30-60%
            double approvalRate = grower.Status.ToLower() switch
            {
                "approved" or "verified" => 0.85 + random.NextDouble() * 0.10,
                "in review" => 0.60 + random.NextDouble() * 0.20,
                _ => 0.30 + random.NextDouble() * 0.30
            };

            foreach (var docId in requiredDocIds)
            {
                var shouldApprove = random.NextDouble() < approvalRate;
                var shouldReject = !shouldApprove && random.NextDouble() < 0.15;
                var shouldPending = !shouldApprove && !shouldReject && random.NextDouble() < 0.5;

                string status;
                if (shouldApprove)
                    status = "approved";
                else if (shouldReject)
                    status = "rejected";
                else if (shouldPending)
                    status = "pending_review";
                else
                    continue; // Not uploaded

                var daysAgo = random.Next(1, 90);
                var doc = new ComplianceDocument
                {
                    GrowerId = grower.GrowerId,
                    DocumentTypeId = docId,
                    Status = status,
                    FileName = $"document_{docId}.pdf",
                    StoredFileName = $"{Guid.NewGuid()}.pdf",
                    UploadedAt = DateTime.UtcNow.AddDays(-daysAgo),
                    ReviewedAt = status != "pending_review" ? DateTime.UtcNow.AddDays(-daysAgo + random.Next(1, 5)) : null,
                    RejectionReason = status == "rejected" ? "Document quality insufficient or information incomplete" : null
                };
                documents.Add(doc);
                await complianceRepo.UpsertAsync(doc);
            }

            // Add some optional documents for a few growers
            if (random.NextDouble() < 0.3)
            {
                var optionalDocIds = new[] { 9, 10, 11, 12, 13 };
                var numOptional = random.Next(1, 3);
                foreach (var docId in optionalDocIds.OrderBy(_ => random.Next()).Take(numOptional))
                {
                    var daysAgo = random.Next(1, 60);
                    var doc = new ComplianceDocument
                    {
                        GrowerId = grower.GrowerId,
                        DocumentTypeId = docId,
                        Status = "approved",
                        FileName = $"document_{docId}.pdf",
                        StoredFileName = $"{Guid.NewGuid()}.pdf",
                        UploadedAt = DateTime.UtcNow.AddDays(-daysAgo),
                        ReviewedAt = DateTime.UtcNow.AddDays(-daysAgo + 2)
                    };
                    documents.Add(doc);
                    await complianceRepo.UpsertAsync(doc);
                }
            }
        }

        return documents.Count;
    }
}
