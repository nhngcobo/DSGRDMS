using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Models;
using DSGRDMS.Server.Repositories;

namespace DSGRDMS.Server.Services;

public class GrowerService(IGrowerRepository repo, IComplianceRepository complianceRepo, IFieldVisitRepository fieldVisitRepo) : IGrowerService
{
    private static readonly int RequiredDocCount = DocumentTypes.All.Count(d => d.IsRequired);
    private static readonly IReadOnlySet<int> RequiredDocIds =
        DocumentTypes.All.Where(d => d.IsRequired).Select(d => d.Id).ToHashSet();

    public async Task<IEnumerable<GrowerResponse>> GetAllAsync()
    {
        var growers = await repo.GetAllAsync();

        // Bulk load all compliance docs — one DB round-trip for the whole list
        var allDocs = (await complianceRepo.GetAllAsync())
            .GroupBy(d => d.GrowerId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Bulk load all field visits — one DB round-trip for the whole list
        var allVisits = (await fieldVisitRepo.GetAllAsync())
            .GroupBy(v => v.GrowerId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(v => v.ScheduledDate).FirstOrDefault());

        return growers.Select(g =>
        {
            var docs         = allDocs.TryGetValue(g.GrowerId, out var d) ? d : [];
            var approvedCount = docs.Count(d => d.Status == "approved" && RequiredDocIds.Contains(d.DocumentTypeId));
            var score        = (int)Math.Round((double)approvedCount / RequiredDocCount * 100);
            
            var latestVisit = allVisits.TryGetValue(g.GrowerId, out var v) ? v : null;
            return ToResponse(g, score, latestVisit);
        });
    }

    public async Task<GrowerResponse?> GetByIdAsync(string growerId)
    {
        var grower = await repo.GetByGrowerIdAsync(growerId);
        if (grower is null) return null;

        var docs          = await complianceRepo.GetByGrowerIdAsync(growerId);
        var approvedCount = docs.Count(d => d.Status == "approved" && RequiredDocIds.Contains(d.DocumentTypeId));
        var score         = (int)Math.Round((double)approvedCount / RequiredDocCount * 100);
        
        var visits = await fieldVisitRepo.GetByGrowerAsync(growerId);
        var latestVisit = visits.OrderByDescending(v => v.ScheduledDate).FirstOrDefault();
        
        return ToResponse(grower, score, latestVisit);
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
        return (ToResponse(saved, 0, null), null);
    }

    public async Task<GrowerResponse?> UpdateAsync(string growerId, UpdateGrowerRequest req)
    {
        Console.WriteLine($"[UpdateAsync] GrowerId: {growerId}, Status from request: '{req.Status}'");
        
        var updated = await repo.UpdateAsync(growerId, g =>
        {
            if (!string.IsNullOrWhiteSpace(req.Phone))
                g.Phone             = req.Phone.Trim();
            if (req.Email != null)
                g.Email             = req.Email.Trim();
            if (req.BusinessName != null)
                g.BusinessName      = req.BusinessName.Trim();
            if (req.BusinessRegNumber != null)
                g.BusinessRegNumber = req.BusinessRegNumber.Trim();
            if (req.LandTenure != null)
                g.LandTenure        = req.LandTenure;
            if (req.TreeSpecies != null)
                g.TreeSpecies       = req.TreeSpecies;
            if (req.PlantationSize.HasValue)
                g.PlantationSize    = req.PlantationSize;
            if (req.GpsLat.HasValue)
                g.GpsLat            = req.GpsLat;
            if (req.GpsLng.HasValue)
                g.GpsLng            = req.GpsLng;
            if (!string.IsNullOrWhiteSpace(req.Status))
            {
                Console.WriteLine($"[UpdateAsync] Updating status from '{g.Status}' to '{req.Status}'");
                g.Status            = req.Status;
            }
        });
        if (updated is null) return null;

        var docs          = await complianceRepo.GetByGrowerIdAsync(growerId);
        var approvedCount = docs.Count(d => d.Status == "approved" && RequiredDocIds.Contains(d.DocumentTypeId));
        var score         = (int)Math.Round((double)approvedCount / RequiredDocCount * 100);
        
        var visits = await fieldVisitRepo.GetByGrowerAsync(growerId);
        var latestVisit = visits.OrderByDescending(v => v.ScheduledDate).FirstOrDefault();
        
        return ToResponse(updated, score, latestVisit);
    }

    // ── mapping ──────────────────────────────────────────────────────────────

    private static string DeriveRisk(int score) => score switch
    {
        < 40 => "high",
        < 70 => "medium",
        _    => "low",
    };

    private static GrowerResponse ToResponse(Grower g, int score, FieldVisit? latestVisit = null) => new()
    {
        Id                = g.GrowerId,
        Name              = $"{g.FirstName} {g.LastName}",
        FirstName         = g.FirstName,
        LastName          = g.LastName,
        IdNumber          = g.IdNumber,
        Phone             = g.Phone,
        Email             = g.Email,
        BusinessName      = g.BusinessName,
        BusinessRegNumber = g.BusinessRegNumber,
        FarmSize          = g.PlantationSize.HasValue ? $"{g.PlantationSize:0.##} ha" : null,
        PlantationSize    = g.PlantationSize,
        LandTenure        = g.LandTenure,
        TreeSpecies       = g.TreeSpecies,
        GpsLat            = g.GpsLat,
        GpsLng            = g.GpsLng,
        Status            = g.Status,
        Compliance        = score,
        Risk              = DeriveRisk(score),
        IsDraft           = g.IsDraft,
        RegisteredAt      = g.RegisteredAt,
        
        // Visit Status
        VisitStatus       = DeriveVisitStatus(latestVisit),
        ScheduledDate     = latestVisit?.ScheduledDate,
        Findings          = latestVisit?.Findings,
    };
    
    private static string DeriveVisitStatus(FieldVisit? visit) => visit switch
    {
        null => "Pending",
        _ when visit.Status == "scheduled" => "Scheduled",
        _ when visit.Status == "in_progress" => "Visited",
        _ when visit.Status == "completed" => "Completed",
        _ => "Pending"
    };
}
