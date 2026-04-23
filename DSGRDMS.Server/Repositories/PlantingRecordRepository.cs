using Microsoft.EntityFrameworkCore;
using DSGRDMS.Server.Data;
using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Repositories;

public class PlantingRecordRepository(AppDbContext db) : IPlantingRecordRepository
{
    public async Task<IEnumerable<PlantingRecord>> GetByGrowerIdAsync(string growerId) =>
        await db.PlantingRecords
            .Where(p => p.GrowerId == growerId)
            .OrderByDescending(p => p.DatePlanted)
            .ToListAsync();

    public async Task<PlantingRecord?> GetByIdAsync(int recordId) =>
        await db.PlantingRecords.FirstOrDefaultAsync(p => p.Id == recordId);

    public async Task<IEnumerable<PlantingRecord>> GetPendingReviewAsync() =>
        await db.PlantingRecords
            .Where(p => p.Status == "pending_review")
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();

    public async Task<PlantingRecord> AddAsync(PlantingRecord record)
    {
        db.PlantingRecords.Add(record);
        await db.SaveChangesAsync();
        return record;
    }

    public async Task<PlantingRecord> UpdateAsync(PlantingRecord record)
    {
        db.PlantingRecords.Update(record);
        await db.SaveChangesAsync();
        return record;
    }

    public async Task<bool> DeleteAsync(int recordId)
    {
        var record = await db.PlantingRecords.FirstOrDefaultAsync(p => p.Id == recordId);
        if (record is null) return false;

        db.PlantingRecords.Remove(record);
        await db.SaveChangesAsync();
        return true;
    }
}
