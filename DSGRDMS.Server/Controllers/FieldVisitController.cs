using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Services;

namespace DSGRDMS.Server.Controllers;

[ApiController]
[Route("api/field-visits")]
[Authorize]
public class FieldVisitController(IFieldVisitService service) : ControllerBase
{
    [HttpGet]
    [Authorize]
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

    [HttpPost("schedule")]
    [Authorize]
    public async Task<IActionResult> ScheduleVisit([FromBody] ScheduleVisitRequest request)
    {
        // Check role in method body using ClaimTypes.Role
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (userRole != "admin" && userRole != "field_officer")
        {
            return StatusCode(StatusCodes.Status403Forbidden, 
                ApiResponse<object>.Fail($"Only admins and field officers can schedule visits. Got role='{userRole ?? "NULL"}'"));
        }

        // Get authenticated user's ID and name from JWT claims
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Field Officer";

        var createRequest = new CreateFieldVisitRequest(
            GrowerId: request.GrowerId,
            VisitType: "Inspection",
            Title: request.Purpose ?? "Field Visit",
            ScheduledDate: request.ScheduledDate,
            ScheduledTime: request.ScheduledTime,
            Location: "TBD",
            Priority: "normal",
            OfficerId: userId,
            OfficerName: userName,
            Notes: request.Notes
        );
        
        var visit = await service.CreateAsync(createRequest);
        return Ok(visit);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateFieldVisitRequest request)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "admin" && userRole != "field_officer")
        {
            return StatusCode(StatusCodes.Status403Forbidden, 
                ApiResponse<object>.Fail("Only admins and field officers can create visits"));
        }

        var visit = await service.CreateAsync(request);
        return Ok(visit);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateFieldVisitRequest request)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "admin" && userRole != "field_officer")
        {
            return StatusCode(StatusCodes.Status403Forbidden, 
                ApiResponse<object>.Fail("Only admins and field officers can update visits"));
        }

        request = request with { Id = id };
        var visit = await service.UpdateAsync(request);
        if (visit == null) return NotFound();
        return Ok(visit);
    }

    [HttpPost("{id}/log-findings")]
    [Authorize]
    public async Task<IActionResult> LogFindings(int id)
    {
        Console.WriteLine($"DEBUG LogFindings: Request received for visit {id}");
        Console.WriteLine($"DEBUG LogFindings: Content-Type = {Request.ContentType}");
        Console.WriteLine($"DEBUG LogFindings: Has form? {Request.HasFormContentType}");

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "admin" && userRole != "field_officer")
        {
            return StatusCode(StatusCodes.Status403Forbidden, 
                ApiResponse<object>.Fail("Only admins and field officers can log findings"));
        }

        // Get form data
        var form = await Request.ReadFormAsync();
        var observations = form["observations"];
        var activities = form["activities"];
        var plantationCondition = form["plantationCondition"];
        var notes = form["notes"];
        var photos = form.Files.GetFiles("photos");

        Console.WriteLine($"DEBUG LogFindings: Received observations={observations}, activities={activities}, photos.Count={photos.Count}");

        // Combine all findings into a single string
        var findingsText = $"Observations: {observations}\n\n" +
                          $"Activities: {activities}\n\n" +
                          $"Plantation Condition: {plantationCondition}";
        
        if (!string.IsNullOrWhiteSpace(notes))
        {
            findingsText += $"\n\nAdditional Notes: {notes}";
        }

        // Save photos if any
        if (photos.Any())
        {
            var fileStoragePath = Path.Combine(Directory.GetCurrentDirectory(), "FileStorage", id.ToString());
            Directory.CreateDirectory(fileStoragePath);

            var photoNames = new List<string>();
            foreach (var photo in photos)
            {
                if (photo.Length > 0)
                {
                    var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(photo.FileName)}";
                    var filePath = Path.Combine(fileStoragePath, fileName);
                    
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await photo.CopyToAsync(stream);
                    }
                    photoNames.Add(fileName);
                    Console.WriteLine($"DEBUG LogFindings: Saved photo {fileName}");
                }
            }

            // Add photo list to findings
            if (photoNames.Any())
            {
                findingsText += $"\n\nAttached Photos: {string.Join(", ", photoNames)}";
            }
        }

        var updateRequest = new UpdateFieldVisitRequest(
            Id: id,
            Status: "completed",
            Findings: findingsText,
            Notes: notes
        );

        var visit = await service.UpdateAsync(updateRequest);
        if (visit == null) return NotFound();
        return Ok(visit);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "admin")
        {
            return StatusCode(StatusCodes.Status403Forbidden, 
                ApiResponse<object>.Fail("Only admins can delete visits"));
        }

        await service.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("{id}/photos")]
    public IActionResult GetPhotos(int id)
    {
        var fileStoragePath = Path.Combine(Directory.GetCurrentDirectory(), "FileStorage", id.ToString());
        
        Console.WriteLine($"DEBUG GetPhotos: Looking for photos in {fileStoragePath}");
        Console.WriteLine($"DEBUG GetPhotos: Directory exists? {Directory.Exists(fileStoragePath)}");
        
        if (!Directory.Exists(fileStoragePath))
        {
            Console.WriteLine($"DEBUG GetPhotos: Directory does not exist, returning empty list");
            return Ok(new { photos = new List<object>() });
        }

        var photoFiles = Directory.GetFiles(fileStoragePath)
            .Select(f => {
                var fileName = Path.GetFileName(f);
                var url = $"/api/field-visits/{id}/photo/{Uri.EscapeDataString(fileName)}";
                Console.WriteLine($"DEBUG GetPhotos: Found file {fileName}, URL: {url}");
                return new { 
                    fileName = fileName,
                    url = url
                };
            })
            .ToList();

        Console.WriteLine($"DEBUG GetPhotos: Total photos found: {photoFiles.Count}");
        return Ok(new { photos = photoFiles });
    }

    [HttpGet("{id}/photo/{*fileName}")]
    public IActionResult GetPhoto(int id, string fileName)
    {
        try
        {
            // URL decode the filename
            var decodedFileName = Uri.UnescapeDataString(fileName);
            Console.WriteLine($"DEBUG GetPhoto: Request for visit {id}, fileName={fileName}, decodedFileName={decodedFileName}");
            
            var fileStoragePath = Path.Combine(Directory.GetCurrentDirectory(), "FileStorage", id.ToString(), decodedFileName);
            Console.WriteLine($"DEBUG GetPhoto: Full file path: {fileStoragePath}");
            
            // Prevent directory traversal attacks
            var fullPath = Path.GetFullPath(fileStoragePath);
            var baseFolder = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "FileStorage", id.ToString()));
            
            Console.WriteLine($"DEBUG GetPhoto: fullPath={fullPath}, baseFolder={baseFolder}");
            Console.WriteLine($"DEBUG GetPhoto: Path starts with base? {fullPath.StartsWith(baseFolder)}");
            
            if (!fullPath.StartsWith(baseFolder))
            {
                Console.WriteLine($"DEBUG GetPhoto: Path traversal detected!");
                return BadRequest("Invalid file request");
            }

            if (!System.IO.File.Exists(fileStoragePath))
            {
                Console.WriteLine($"DEBUG GetPhoto: File not found at {fileStoragePath}");
                return NotFound();
            }

            Console.WriteLine($"DEBUG GetPhoto: File found, serving...");
            var contentType = GetContentType(fileStoragePath);
            var fileBytes = System.IO.File.ReadAllBytes(fileStoragePath);
            return File(fileBytes, contentType);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"DEBUG GetPhoto: Exception - {ex.Message}");
            return NotFound();
        }
    }

    private string GetContentType(string filePath)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        return ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }
}
