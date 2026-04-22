using Microsoft.EntityFrameworkCore;
using DSGRDMS.Server.Data;
using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Repositories;

public class FieldVisitRepository(AppDbContext db) : IFieldVisitRepository
{
    public async Task<List<FieldVisit>> GetAllAsync()
    {
        return await db.FieldVisits
            .OrderByDescending(v => v.ScheduledDate)
            .ToListAsync();
    }

    public async Task<List<FieldVisit>> GetByGrowerAsync(string growerId)
    {
        return await db.FieldVisits
            .Where(v => v.GrowerId == growerId)
            .OrderByDescending(v => v.ScheduledDate)
            .ToListAsync();
    }

    public async Task<List<FieldVisit>> GetUpcomingByGrowerAsync(string growerId)
    {
        var now = DateTime.UtcNow;
        return await db.FieldVisits
            .Where(v => v.GrowerId == growerId && v.ScheduledDate > now && v.Status != "cancelled")
            .OrderBy(v => v.ScheduledDate)
            .ToListAsync();
    }

    public async Task<List<FieldVisit>> GetPastByGrowerAsync(string growerId)
    {
        return await db.FieldVisits
            .Where(v => v.GrowerId == growerId && v.Status == "completed")
            .OrderByDescending(v => v.ScheduledDate)
            .ToListAsync();
    }

    public async Task<FieldVisit?> GetByIdAsync(int id)
    {
        return await db.FieldVisits.FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<FieldVisit> CreateAsync(FieldVisit visit)
    {
        db.FieldVisits.Add(visit);
        await db.SaveChangesAsync();
        return visit;
    }

    public async Task<FieldVisit?> UpdateAsync(FieldVisit visit)
    {
        var existing = await db.FieldVisits.FirstOrDefaultAsync(v => v.Id == visit.Id);
        if (existing == null) return null;

        existing.Status = visit.Status;
        existing.Findings = visit.Findings;
        existing.Notes = visit.Notes;
        existing.CompletedAt = visit.CompletedAt;

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteAsync(int id)
    {
        var visit = await db.FieldVisits.FirstOrDefaultAsync(v => v.Id == id);
        if (visit != null)
        {
            db.FieldVisits.Remove(visit);
            await db.SaveChangesAsync();
        }
    }
}
