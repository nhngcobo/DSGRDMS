using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Models;
using DSGRDMS.Server.Repositories;

namespace DSGRDMS.Server.Services;

public class GrowerService(IGrowerRepository repo) : IGrowerService
{
    public async Task<IEnumerable<GrowerResponse>> GetAllAsync()
    {
        var growers = await repo.GetAllAsync();
        return growers.Select(ToResponse);
    }

    public async Task<GrowerResponse?> GetByIdAsync(string growerId)
    {
        var grower = await repo.GetByGrowerIdAsync(growerId);
        return grower is null ? null : ToResponse(grower);
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
        return (ToResponse(saved), null);
    }

    // ── mapping ──────────────────────────────────────────────────────────────

    private static GrowerResponse ToResponse(Grower g) => new()
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
        Compliance        = null,
        Risk              = "low",
        IsDraft           = g.IsDraft,
        RegisteredAt      = g.RegisteredAt,
    };
}
