using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Models;
using DSGRDMS.Server.Repositories;

namespace DSGRDMS.Server.Services;

public class FieldVisitService(IFieldVisitRepository repo) : IFieldVisitService
{
    public async Task<List<FieldVisitDto>> GetAllAsync()
    {
        var visits = await repo.GetAllAsync();
        return visits.Select(ToDto).ToList();
    }

    public async Task<List<FieldVisitDto>> GetByGrowerAsync(string growerId)
    {
        var visits = await repo.GetByGrowerAsync(growerId);
        return visits.Select(ToDto).ToList();
    }

    public async Task<List<FieldVisitDto>> GetUpcomingByGrowerAsync(string growerId)
    {
        var visits = await repo.GetUpcomingByGrowerAsync(growerId);
        return visits.Select(ToDto).ToList();
    }

    public async Task<List<FieldVisitDto>> GetPastByGrowerAsync(string growerId)
    {
        var visits = await repo.GetPastByGrowerAsync(growerId);
        return visits.Select(ToDto).ToList();
    }

    public async Task<FieldVisitDto?> GetByIdAsync(int id)
    {
        var visit = await repo.GetByIdAsync(id);
        return visit == null ? null : ToDto(visit);
    }

    public async Task<FieldVisitDto> CreateAsync(CreateFieldVisitRequest request)
    {
        var visit = new FieldVisit
        {
            GrowerId = request.GrowerId,
            VisitType = request.VisitType,
            Title = request.Title,
            ScheduledDate = request.ScheduledDate,
            ScheduledTime = TimeOnly.Parse(request.ScheduledTime),
            Location = request.Location,
            Priority = request.Priority,
            OfficerId = request.OfficerId,
            OfficerName = request.OfficerName,
            Notes = request.Notes,
            Status = "scheduled"
        };

        var created = await repo.CreateAsync(visit);
        return ToDto(created);
    }

    public async Task<FieldVisitDto?> UpdateAsync(UpdateFieldVisitRequest request)
    {
        var visit = await repo.GetByIdAsync(request.Id);
        if (visit == null) return null;

        visit.Status = request.Status;
        visit.Findings = request.Findings;
        visit.Notes = request.Notes;
        if (request.Status == "completed")
        {
            visit.CompletedAt = DateTime.UtcNow;
        }

        var updated = await repo.UpdateAsync(visit);
        return updated == null ? null : ToDto(updated);
    }

    public async Task DeleteAsync(int id)
    {
        await repo.DeleteAsync(id);
    }

    private FieldVisitDto ToDto(FieldVisit visit)
    {
        return new FieldVisitDto(
            visit.Id,
            visit.GrowerId,
            visit.VisitType,
            visit.Title,
            visit.ScheduledDate,
            visit.ScheduledTime.ToString("HH:mm"),
            visit.Location,
            visit.Priority,
            visit.OfficerId,
            visit.OfficerName,
            visit.Status,
            visit.Notes,
            visit.Findings,
            visit.CompletedAt
        );
    }
}

