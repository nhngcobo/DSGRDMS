using Microsoft.EntityFrameworkCore;
using DSGRDMS.Server.Data;
using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Repositories;

public class GrowerRepository(AppDbContext db) : IGrowerRepository
{
    public async Task<IEnumerable<Grower>> GetAllAsync() =>
        await db.Growers
            .OrderByDescending(g => g.RegisteredAt)
            .ToListAsync();

    public async Task<Grower?> GetByGrowerIdAsync(string growerId) =>
        await db.Growers.FirstOrDefaultAsync(g => g.GrowerId == growerId);

    public async Task<bool> ExistsByIdNumberAsync(string idNumber) =>
        await db.Growers.AnyAsync(g => g.IdNumber == idNumber);

    public async Task<string> GenerateGrowerIdAsync()
    {
        var count = await db.Growers.CountAsync();
        string id;
        do { id = $"G{(count + 1):D3}"; count++; }
        while (await db.Growers.AnyAsync(g => g.GrowerId == id));
        return id;
    }

    public async Task<Grower> AddAsync(Grower grower)
    {
        db.Growers.Add(grower);
        await db.SaveChangesAsync();
        return grower;
    }

    public async Task UpdateStatusAsync(string growerId, string status)
    {
        var grower = await db.Growers.FirstOrDefaultAsync(g => g.GrowerId == growerId);
        if (grower is not null)
        {
            grower.Status = status;
            await db.SaveChangesAsync();
        }
    }
}
