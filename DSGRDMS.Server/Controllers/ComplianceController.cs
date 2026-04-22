using Microsoft.AspNetCore.Mvc;
using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Services;

namespace DSGRDMS.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ComplianceController(IComplianceService complianceService) : ControllerBase
{
    // GET api/compliance/analytics
    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics()
    {
        var analytics = await complianceService.GetAnalyticsAsync();
        return Ok(analytics);
    }

    // GET api/compliance/{growerId}
    [HttpGet("{growerId}")]
    public async Task<IActionResult> GetSummary(string growerId)
    {
        var summary = await complianceService.GetSummaryAsync(growerId);
        if (summary is null) return NotFound();
        return Ok(summary);
    }

    // POST api/compliance/{growerId}/{docTypeId}/upload
    [HttpPost("{growerId}/{docTypeId:int}/upload")]
    public async Task<IActionResult> Upload(string growerId, int docTypeId, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        var (result, error) = await complianceService.UploadAsync(growerId, docTypeId, file);
        if (error is not null) return BadRequest(new { message = error });
        return Ok(result);
    }

    // POST api/compliance/{growerId}/{docTypeId}/review
    [HttpPost("{growerId}/{docTypeId:int}/review")]
    public async Task<IActionResult> Review(string growerId, int docTypeId, [FromBody] ReviewDocumentRequest req)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var (result, error) = await complianceService.ReviewAsync(growerId, docTypeId, req.Action, req.Reason);
        if (error is not null) return BadRequest(new { message = error });
        return Ok(result);
    }

    // GET api/compliance/{growerId}/{docTypeId}/file
    [HttpGet("{growerId}/{docTypeId:int}/file")]
    public async Task<IActionResult> GetFile(string growerId, int docTypeId)
    {
        var result = await complianceService.GetDocumentFileAsync(growerId, docTypeId);
        if (result is null) return NotFound();
        var (filePath, fileName, contentType) = result.Value;
        return PhysicalFile(filePath, contentType, fileName);
    }

    // POST api/compliance/seed - Force reseed compliance data
    [HttpPost("seed")]
    public async Task<IActionResult> SeedComplianceData()
    {
        var result = await complianceService.SeedComplianceDataAsync();
        return Ok(new { message = "Compliance data seeded successfully", documentsCreated = result });
    }
}
