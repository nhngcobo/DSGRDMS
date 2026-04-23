using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Services;

namespace DSGRDMS.Server.Controllers;

[ApiController]
[Route("api/planting-records")]
public class PlantingRecordsController(IPlantingRecordService service) : ControllerBase
{
    [HttpGet("grower/{growerId}")]
    [Authorize]
    public async Task<IActionResult> GetByGrower(string growerId)
    {
        var records = await service.GetByGrowerIdAsync(growerId);
        return Ok(new { data = records });
    }

    [HttpGet("{recordId}")]
    [Authorize]
    public async Task<IActionResult> GetById(int recordId)
    {
        var record = await service.GetByIdAsync(recordId);
        if (record is null)
            return NotFound(new ApiResponse { Message = "Planting record not found" });

        return Ok(new { data = record });
    }

    [HttpGet("pending-review")]
    [Authorize]
    public async Task<IActionResult> GetPendingReview()
    {
        // Check if user is admin or field_officer
        var role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
        if (role != "admin" && role != "field_officer")
            return Forbid("Only admins and field officers can view pending reviews");

        var records = await service.GetPendingReviewAsync();
        return Ok(new { data = records });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreatePlantingRecordRequest request)
    {
        try
        {
            // Check if user is grower
            var role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
            if (role != "grower")
                return Forbid("Only growers can create planting records");

            if (string.IsNullOrWhiteSpace(request.GrowerId))
                return BadRequest(new { message = "GrowerId is required" });

            if (request.NumberOfPlantsPlanted <= 0)
                return BadRequest(new { message = "NumberOfPlantsPlanted must be greater than 0" });

            if (string.IsNullOrWhiteSpace(request.PlantSpecies))
                return BadRequest(new { message = "PlantSpecies is required" });

            if (string.IsNullOrWhiteSpace(request.PlantingArea))
                return BadRequest(new { message = "PlantingArea is required" });

            var record = await service.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { recordId = record.Id }, new { data = record });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Error creating planting record: " + ex.Message });
        }
    }

    [HttpPost("upload-images")]
    [Authorize]
    public async Task<IActionResult> UploadImages([FromForm] string growerId, [FromForm] IFormFileCollection images)
    {
        try
        {
            var role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
            if (role != "grower")
                return Forbid("Only growers can upload images");

            if (images == null || images.Count == 0)
                return BadRequest(new { message = "No images provided" });

            var filenames = new List<string>();
            var uploadDir = Path.Combine("FileStorage", "planting-records", growerId);
            Directory.CreateDirectory(uploadDir);

            foreach (var image in images)
            {
                if (image.Length > 10 * 1024 * 1024) // 10MB limit
                    return BadRequest(new { message = $"Image {image.FileName} exceeds 10MB limit" });

                var filename = $"{Guid.NewGuid()}_{image.FileName}";
                var filepath = Path.Combine(uploadDir, filename);
                using (var stream = new FileStream(filepath, FileMode.Create))
                {
                    await image.CopyToAsync(stream);
                }
                filenames.Add(filename);
            }

            return Ok(new { data = filenames });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Error uploading images: " + ex.Message });
        }
    }

    [HttpPut("{recordId}")]
    [Authorize]
    public async Task<IActionResult> Update(int recordId, [FromBody] UpdatePlantingRecordRequest request)
    {
        try
        {
            // Check if user is grower
            var role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
            if (role != "grower")
                return Forbid("Only growers can update planting records");

            var record = await service.UpdateAsync(recordId, request);
            if (record is null)
                return NotFound(new { message = "Planting record not found" });

            return Ok(new { data = record });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Error updating planting record: " + ex.Message });
        }
    }

    [HttpPut("{recordId}/review")]
    [Authorize]
    public async Task<IActionResult> Review(int recordId, [FromBody] ReviewPlantingRecordRequest request)
    {
        try
        {
            // Check if user is admin or field_officer
            var role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
            if (role != "admin" && role != "field_officer")
                return Forbid("Only admins and field officers can review planting records");

            if (string.IsNullOrWhiteSpace(request.Status) || !new[] { "approved", "needs_revision" }.Contains(request.Status))
                return BadRequest(new { message = "Status must be 'approved' or 'needs_revision'" });

            var record = await service.ReviewAsync(recordId, request);
            if (record is null)
                return NotFound(new { message = "Planting record not found" });

            return Ok(new { data = record });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Error reviewing planting record: " + ex.Message });
        }
    }

    [HttpDelete("{recordId}")]
    [Authorize]
    public async Task<IActionResult> Delete(int recordId)
    {
        try
        {
            // Check if user is grower
            var role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
            if (role != "grower")
                return Forbid("Only growers can delete planting records");

            var success = await service.DeleteAsync(recordId);
            if (!success)
                return NotFound(new { message = "Planting record not found" });

            return Ok(new { message = "Planting record deleted successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Error deleting planting record: " + ex.Message });
        }
    }
}
