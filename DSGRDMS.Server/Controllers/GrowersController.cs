using Microsoft.AspNetCore.Mvc;
using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Services;

namespace DSGRDMS.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GrowersController(IGrowerService growerService) : ControllerBase
{
    // GET api/growers
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var growers = await growerService.GetAllAsync();
        return Ok(growers);
    }

    // GET api/growers/{growerId}
    [HttpGet("{growerId}")]
    public async Task<IActionResult> GetById(string growerId)
    {
        var grower = await growerService.GetByIdAsync(growerId);
        if (grower is null) return NotFound();
        return Ok(grower);
    }

    // POST api/growers
    [HttpPost]
    public async Task<IActionResult> Register([FromBody] RegisterGrowerRequest req)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var (result, conflict) = await growerService.RegisterAsync(req);

        if (conflict is not null)
            return Conflict(new { message = conflict });

        return CreatedAtAction(nameof(GetById), new { growerId = result!.Id }, result);
    }
}

