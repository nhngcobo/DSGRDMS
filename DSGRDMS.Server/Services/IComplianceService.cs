using DSGRDMS.Server.DTOs;
using Microsoft.AspNetCore.Http;

namespace DSGRDMS.Server.Services;

public interface IComplianceService
{
    Task<ComplianceSummaryResponse?> GetSummaryAsync(string growerId);
    Task<ComplianceAnalyticsResponse> GetAnalyticsAsync();
    Task<(ComplianceDocumentDto? Result, string? Error)> UploadAsync(string growerId, int docTypeId, IFormFile file);
    Task<(ComplianceDocumentDto? Result, string? Error)> ReviewAsync(string growerId, int docTypeId, string action, string? reason);
    Task<(string FilePath, string FileName, string ContentType)?> GetDocumentFileAsync(string growerId, int docTypeId);
}
