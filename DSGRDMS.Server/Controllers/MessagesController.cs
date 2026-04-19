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
        new(m.Id, m.SenderName, m.GrowerId, m.Subject, m.Body, m.SentAt, m.IsRead);

    // GET api/messages
    // Grower → their inbox; Admin/FieldOfficer → their sent messages
    [HttpGet]
    public async Task<IActionResult> GetMessages()
    {
        var role     = User.FindFirstValue("role");
        var growerId = User.FindFirstValue("growerId");

        if (role == "grower")
        {
            if (string.IsNullOrEmpty(growerId)) return Ok(Array.Empty<MessageDto>());

            var inbox = await db.Messages
                .Where(m => m.GrowerId == growerId)
                .OrderByDescending(m => m.SentAt)
                .Select(m => new MessageDto(m.Id, m.SenderName, m.GrowerId, m.Subject, m.Body, m.SentAt, m.IsRead))
                .ToListAsync();

            return Ok(inbox);
        }
        else
        {
            var subClaim = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(subClaim, out var userId)) return Unauthorized();

            var sent = await db.Messages
                .Where(m => m.SenderUserId == userId)
                .OrderByDescending(m => m.SentAt)
                .Select(m => new MessageDto(m.Id, m.SenderName, m.GrowerId, m.Subject, m.Body, m.SentAt, m.IsRead))
                .ToListAsync();

            return Ok(sent);
        }
    }

    // GET api/messages/unread-count — grower unread badge count
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var growerId = User.FindFirstValue("growerId");
        if (string.IsNullOrEmpty(growerId)) return Ok(new { count = 0 });

        var count = await db.Messages.CountAsync(m => m.GrowerId == growerId && !m.IsRead);
        return Ok(new { count });
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
        };

        db.Messages.Add(msg);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMessages), ToDto(msg));
    }

    // PUT api/messages/{id}/read — grower marks a message as read
    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var growerId = User.FindFirstValue("growerId");
        var msg = await db.Messages.FindAsync(id);

        if (msg is null) return NotFound();
        if (msg.GrowerId != growerId) return Forbid();

        msg.IsRead = true;
        await db.SaveChangesAsync();

        return NoContent();
    }
}
