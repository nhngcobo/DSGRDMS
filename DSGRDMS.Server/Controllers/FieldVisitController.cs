using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Services;

namespace DSGRDMS.Server.Controllers;

[ApiController]
[Route("api/field-visits")]
[Authorize]
public class FieldVisitController(IFieldVisitService service) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var visits = await service.GetAllAsync();
        return Ok(visits);
    }

    [HttpGet("grower/{growerId}")]
    public async Task<IActionResult> GetByGrower(string growerId)
    {
        var visits = await service.GetByGrowerAsync(growerId);
        return Ok(visits);
    }

    [HttpGet("grower/{growerId}/upcoming")]
    public async Task<IActionResult> GetUpcoming(string growerId)
    {
        var visits = await service.GetUpcomingByGrowerAsync(growerId);
        return Ok(visits);
    }

    [HttpGet("grower/{growerId}/past")]
    public async Task<IActionResult> GetPast(string growerId)
    {
        var visits = await service.GetPastByGrowerAsync(growerId);
        return Ok(visits);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var visit = await service.GetByIdAsync(id);
        if (visit == null) return NotFound();
        return Ok(visit);
    }

    [HttpPost]
    [Authorize(Roles = "admin,field_officer")]
    public async Task<IActionResult> Create([FromBody] CreateFieldVisitRequest request)
    {
        var visit = await service.CreateAsync(request);
        return Ok(visit);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,field_officer")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateFieldVisitRequest request)
    {
        request = request with { Id = id };
        var visit = await service.UpdateAsync(request);
        if (visit == null) return NotFound();
        return Ok(visit);
    }

    [HttpPost("{id}/log-findings")]
    [Authorize(Roles = "admin,field_officer")]
    public async Task<IActionResult> LogFindings(int id, [FromBody] LogFindingsRequest request)
    {
        // Combine all findings into a single string
        var findingsText = $"Observations: {request.Observations}\n\n" +
                          $"Activities: {request.Activities}\n\n" +
                          $"Plantation Condition: {request.PlantationCondition}";
        
        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            findingsText += $"\n\nAdditional Notes: {request.Notes}";
        }

        var updateRequest = new UpdateFieldVisitRequest(
            Id: id,
            Status: "completed",
            Findings: findingsText,
            Notes: request.Notes
        );

        var visit = await service.UpdateAsync(updateRequest);
        if (visit == null) return NotFound();
        return Ok(visit);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await service.DeleteAsync(id);
        return NoContent();
    }
}
