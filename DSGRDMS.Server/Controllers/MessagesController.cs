using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using DSGRDMS.Server.Data;
using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController(AppDbContext db) : ControllerBase
{
    static MessageDto ToDto(Message m) =>
        new(m.Id, m.SenderName, m.GrowerId, m.Subject, m.Body, m.SentAt, m.IsRead, m.SentByGrower, m.QueryType, m.AssignedToUserId, m.AssignedToName);

    // GET api/messages
    // Grower  → all messages where GrowerId matches (both inbox and their own queries)
    // Staff   → messages they sent + all grower queries
    [HttpGet]
    public async Task<IActionResult> GetMessages()
    {
        var role     = User.FindFirstValue("role");
        var growerId = User.FindFirstValue("growerId");

        if (role == "grower")
        {
            if (string.IsNullOrEmpty(growerId)) return Ok(Array.Empty<MessageDto>());

            var messages = await db.Messages
                .Where(m => m.GrowerId == growerId)
                .OrderByDescending(m => m.SentAt)
                .Select(m => new MessageDto(m.Id, m.SenderName, m.GrowerId, m.Subject, m.Body, m.SentAt, m.IsRead, m.SentByGrower, m.QueryType, m.AssignedToUserId, m.AssignedToName))
                .ToListAsync();

            return Ok(messages);
        }
        else
        {
            var subClaim = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(subClaim, out var userId)) return Unauthorized();

            // Staff see: messages they sent + all grower queries
            var messages = await db.Messages
                .Where(m => (m.SentByGrower == false && m.SenderUserId == userId) || m.SentByGrower == true)
                .OrderByDescending(m => m.SentAt)
                .Select(m => new MessageDto(m.Id, m.SenderName, m.GrowerId, m.Subject, m.Body, m.SentAt, m.IsRead, m.SentByGrower, m.QueryType, m.AssignedToUserId, m.AssignedToName))
                .ToListAsync();

            return Ok(messages);
        }
    }

    // GET api/messages/unread-count — unread badge for growers (inbox) and staff (grower queries)
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var role     = User.FindFirstValue("role");
        var growerId = User.FindFirstValue("growerId");

        if (role == "grower")
        {
            if (string.IsNullOrEmpty(growerId)) return Ok(new { count = 0 });
            // Grower unread = unread messages FROM staff
            var count = await db.Messages.CountAsync(m => m.GrowerId == growerId && !m.IsRead && !m.SentByGrower);
            return Ok(new { count });
        }
        else
        {
            // Staff unread = unread grower queries
            var count = await db.Messages.CountAsync(m => m.SentByGrower && !m.IsRead);
            return Ok(new { count });
        }
    }

    // POST api/messages — admin / field_officer sends a message to a grower
    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest req)
    {
        var senderRole = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
        if (senderRole != "admin" && senderRole != "field_officer")
            return Forbid();
        if (string.IsNullOrWhiteSpace(req.GrowerId) ||
            string.IsNullOrWhiteSpace(req.Subject)  ||
            string.IsNullOrWhiteSpace(req.Body))
        {
            return BadRequest(new { message = "GrowerId, Subject, and Body are required." });
        }

        var growerExists = await db.Growers.AnyAsync(g => g.GrowerId == req.GrowerId);
        if (!growerExists) return NotFound(new { message = $"Grower '{req.GrowerId}' not found." });

        var subClaim   = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(subClaim, out var userId)) return Unauthorized();
        var senderName = User.FindFirstValue("name") ?? "Field Officer";

        var msg = new Message
        {
            SenderUserId = userId,
            SenderName   = senderName,
            GrowerId     = req.GrowerId,
            Subject      = req.Subject,
            Body         = req.Body,
            SentAt       = DateTime.UtcNow,
            SentByGrower = false,
        };

        db.Messages.Add(msg);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMessages), ToDto(msg));
    }

    // POST api/messages/query — grower sends a query to staff
    [HttpPost("query")]
    public async Task<IActionResult> SendQuery([FromBody] SendQueryRequest req)
    {
        var role     = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
        var growerId = User.FindFirstValue("growerId");
        if (role != "grower" || string.IsNullOrEmpty(growerId)) return Forbid();

        if (string.IsNullOrWhiteSpace(req.Subject) || string.IsNullOrWhiteSpace(req.Body))
            return BadRequest(new { message = "Subject and Body are required." });

        var senderName = User.FindFirstValue("name") ?? growerId;

        var msg = new Message
        {
            SenderUserId = 0,
            SenderName   = senderName,
            GrowerId     = growerId,
            Subject      = req.Subject,
            Body         = req.Body,
            QueryType    = req.QueryType,
            SentAt       = DateTime.UtcNow,
            SentByGrower = true,
        };

        db.Messages.Add(msg);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMessages), ToDto(msg));
    }

    // GET api/messages/field-officers — list of field officers for the assign dropdown (admin only)
    [HttpGet("field-officers")]
    public async Task<IActionResult> GetFieldOfficers()
    {
        var role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
        if (role != "admin") return Forbid();

        var officers = await db.Users
            .Where(u => u.Role == "field_officer")
            .OrderBy(u => u.FullName)
            .Select(u => new FieldOfficerDto(u.Id, u.FullName))
            .ToListAsync();

        return Ok(officers);
    }

    // PUT api/messages/{id}/assign — admin assigns a grower query to a field officer
    [HttpPut("{id:int}/assign")]
    public async Task<IActionResult> AssignQuery(int id, [FromBody] AssignQueryRequest req)
    {
        var role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
        if (role != "admin") return Forbid();

        var msg = await db.Messages.FindAsync(id);
        if (msg is null) return NotFound();
        if (!msg.SentByGrower) return BadRequest(new { message = "Only grower queries can be assigned." });

        var officer = await db.Users.FindAsync(req.OfficerUserId);
        if (officer is null || officer.Role != "field_officer")
            return BadRequest(new { message = "User is not a field officer." });

        msg.AssignedToUserId = officer.Id;
        msg.AssignedToName   = officer.FullName;
        await db.SaveChangesAsync();

        return Ok(ToDto(msg));
    }

    // PUT api/messages/{id}/read — mark a message as read
    // Grower marks staff→grower messages; staff marks grower queries
    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var role     = User.FindFirstValue("role");
        var growerId = User.FindFirstValue("growerId");
        var msg      = await db.Messages.FindAsync(id);

        if (msg is null) return NotFound();

        if (role == "grower")
        {
            // Grower can only mark messages addressed to them from staff
            if (msg.GrowerId != growerId || msg.SentByGrower) return Forbid();
        }
        else
        {
            // Staff can only mark grower queries as read
            if (!msg.SentByGrower) return Forbid();
        }

        msg.IsRead = true;
        await db.SaveChangesAsync();

        return NoContent();
    }
}
