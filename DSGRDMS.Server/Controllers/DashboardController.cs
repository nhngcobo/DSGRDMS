using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DSGRDMS.Server.Data;
using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Models;
using DSGRDMS.Server.Services;

namespace DSGRDMS.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController(AppDbContext db, IGrowerService growerService) : ControllerBase
{
    // GET api/dashboard/summary
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var totalGrowers  = await db.Growers.CountAsync();
        var pendingCount  = await db.Growers.CountAsync(g => g.Status == "pending");
        var verifiedCount = await db.Growers.CountAsync(g => g.Status == "verified");

        // Derive high-risk count from real compliance scores
        var allGrowers    = await growerService.GetAllAsync();
        var highRiskCount = allGrowers.Count(g => g.Risk == "high");

        // Last 6 calendar months (oldest → newest)
        var firstOfWindow = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-5);
        var registrationDates = await db.Growers
            .Where(g => g.RegisteredAt >= firstOfWindow)
            .Select(g => g.RegisteredAt)
            .ToListAsync();

        var monthlyRegistrations = Enumerable.Range(0, 6)
            .Select(i =>
            {
                var month = firstOfWindow.AddMonths(i);
                return new MonthlyRegistrationDto
                {
                    Month         = month.ToString("MMM"),
                    Registrations = registrationDates.Count(d => d.Year == month.Year && d.Month == month.Month),
                };
            })
            .ToList();

        var recentApplications = await db.Growers
            .OrderByDescending(g => g.RegisteredAt)
            .Take(5)
            .Select(g => new RecentApplicationDto
            {
                Id     = g.GrowerId,
                Name   = g.FirstName + " " + g.LastName,
                Status = g.Status,
            })
            .ToListAsync();

        return Ok(new DashboardSummaryResponse
        {
            TotalGrowers          = totalGrowers,
            PendingCount          = pendingCount,
            VerifiedCount         = verifiedCount,
            HighRiskCount         = highRiskCount,
            MonthlyRegistrations  = monthlyRegistrations,
            RecentApplications    = recentApplications,
        });
    }
}
