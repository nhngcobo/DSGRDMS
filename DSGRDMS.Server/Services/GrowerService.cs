using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Models;
using DSGRDMS.Server.Repositories;

namespace DSGRDMS.Server.Services;

public class GrowerService(IGrowerRepository repo, IComplianceRepository complianceRepo) : IGrowerService
{
    private static readonly int TotalDocTypes = DocumentTypes.All.Count;

    public async Task<IEnumerable<GrowerResponse>> GetAllAsync()
    {
        var growers = await repo.GetAllAsync();

        // Bulk load all compliance docs — one DB round-trip for the whole list
        var allDocs = (await complianceRepo.GetAllAsync())
            .GroupBy(d => d.GrowerId)
            .ToDictionary(g => g.Key, g => g.ToList());

        return growers.Select(g =>
        {
            var docs         = allDocs.TryGetValue(g.GrowerId, out var d) ? d : [];
            var approvedCount = docs.Count(d => d.Status == "approved");
            var score        = (int)Math.Round((double)approvedCount / TotalDocTypes * 100);
            return ToResponse(g, score);
        });
    }

    public async Task<GrowerResponse?> GetByIdAsync(string growerId)
    {
        var grower = await repo.GetByGrowerIdAsync(growerId);
        if (grower is null) return null;

        var docs          = await complianceRepo.GetByGrowerIdAsync(growerId);
        var approvedCount = docs.Count(d => d.Status == "approved");
        var score         = (int)Math.Round((double)approvedCount / TotalDocTypes * 100);
        return ToResponse(grower, score);
    }

    public async Task<(GrowerResponse? Result, string? ConflictMessage)> RegisterAsync(RegisterGrowerRequest req)
    {
        if (await repo.ExistsByIdNumberAsync(req.IdNumber.Trim()))
            return (null, "A grower with this ID number is already registered.");

        var grower = new Grower
        {
            InternalId        = Guid.NewGuid(),
            GrowerId          = await repo.GenerateGrowerIdAsync(),
            FirstName         = req.FirstName.Trim(),
            LastName          = req.LastName.Trim(),
            IdNumber          = req.IdNumber.Trim(),
            Phone             = req.Phone.Trim(),
            Email             = req.Email?.Trim(),
            BusinessName      = req.BusinessName?.Trim(),
            BusinessRegNumber = req.BusinessRegNumber?.Trim(),
            LandTenure        = req.LandTenure,
            TreeSpecies       = req.TreeSpecies,
            PlantationSize    = req.PlantationSize,
            GpsLat            = req.GpsLat,
            GpsLng            = req.GpsLng,
            Status            = req.Draft ? "draft" : "pending",
            IsDraft           = req.Draft,
            RegisteredAt      = DateTime.UtcNow,
        };

        var saved = await repo.AddAsync(grower);
        return (ToResponse(saved, 0), null);
    }

    public async Task<GrowerResponse?> UpdateAsync(string growerId, UpdateGrowerRequest req)
    {
        var updated = await repo.UpdateAsync(growerId, g =>
        {
            g.Phone             = req.Phone.Trim();
            g.Email             = req.Email?.Trim();
            g.BusinessName      = req.BusinessName?.Trim();
            g.BusinessRegNumber = req.BusinessRegNumber?.Trim();
            g.LandTenure        = req.LandTenure;
            g.TreeSpecies       = req.TreeSpecies;
            g.PlantationSize    = req.PlantationSize;
            g.GpsLat            = req.GpsLat;
            g.GpsLng            = req.GpsLng;
        });
        if (updated is null) return null;

        var docs          = await complianceRepo.GetByGrowerIdAsync(growerId);
        var approvedCount = docs.Count(d => d.Status == "approved");
        var score         = (int)Math.Round((double)approvedCount / TotalDocTypes * 100);
        return ToResponse(updated, score);
    }

    // ── mapping ──────────────────────────────────────────────────────────────

    private static string DeriveRisk(int score) => score switch
    {
        < 40 => "high",
        < 70 => "medium",
        _    => "low",
    };

    private static GrowerResponse ToResponse(Grower g, int score) => new()
    {
        Id                = g.GrowerId,
        Name              = $"{g.FirstName} {g.LastName}",
        Phone             = g.Phone,
        Email             = g.Email,
        BusinessName      = g.BusinessName,
        BusinessRegNumber = g.BusinessRegNumber,
        FarmSize          = g.PlantationSize.HasValue ? $"{g.PlantationSize:0.##} ha" : null,
        LandTenure        = g.LandTenure,
        TreeSpecies       = g.TreeSpecies,
        GpsLat            = g.GpsLat,
        GpsLng            = g.GpsLng,
        Status            = g.Status,
        Compliance        = score,
        Risk              = DeriveRisk(score),
        IsDraft           = g.IsDraft,
        RegisteredAt      = g.RegisteredAt,
    };
}
