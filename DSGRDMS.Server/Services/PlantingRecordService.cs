using DSGRDMS.Server.DTOs;
using DSGRDMS.Server.Models;
using DSGRDMS.Server.Repositories;

namespace DSGRDMS.Server.Services;

public class PlantingRecordService(IPlantingRecordRepository repo) : IPlantingRecordService
{
    public async Task<IEnumerable<PlantingRecordDto>> GetByGrowerIdAsync(string growerId)
    {
        var records = await repo.GetByGrowerIdAsync(growerId);
        return records.Select(ToDto);
    }

    public async Task<PlantingRecordDto?> GetByIdAsync(int recordId)
    {
        var record = await repo.GetByIdAsync(recordId);
        return record is null ? null : ToDto(record);
    }

    public async Task<IEnumerable<PlantingRecordDto>> GetPendingReviewAsync()
    {
        var records = await repo.GetPendingReviewAsync();
        return records.Select(ToDto);
    }

    public async Task<PlantingRecordDto> CreateAsync(CreatePlantingRecordRequest request)
    {
        var record = new PlantingRecord
        {
            GrowerId = request.GrowerId,
            DatePlanted = request.DatePlanted,
            NumberOfPlantsPlanted = request.NumberOfPlantsPlanted,
            PlantSpecies = request.PlantSpecies,
            PlantingArea = request.PlantingArea,
            IssuesEncountered = request.IssuesEncountered,
            Status = "pending_review",
            PhotoFilenames = request.PhotoFilenames,
            CreatedAt = DateTime.UtcNow
        };

        var created = await repo.AddAsync(record);
        return ToDto(created);
    }

    public async Task<PlantingRecordDto?> UpdateAsync(int recordId, UpdatePlantingRecordRequest request)
    {
        var record = await repo.GetByIdAsync(recordId);
        if (record is null) return null;

        record.DatePlanted = request.DatePlanted;
        record.NumberOfPlantsPlanted = request.NumberOfPlantsPlanted;
        record.PlantSpecies = request.PlantSpecies;
        record.PlantingArea = request.PlantingArea;
        record.IssuesEncountered = request.IssuesEncountered;
        record.PhotoFilenames = request.PhotoFilenames;

        var updated = await repo.UpdateAsync(record);
        return ToDto(updated);
    }

    public async Task<PlantingRecordDto?> ReviewAsync(int recordId, ReviewPlantingRecordRequest request)
    {
        var record = await repo.GetByIdAsync(recordId);
        if (record is null) return null;

        record.Status = request.Status;
        record.OfficerNotes = request.OfficerNotes;
        if (request.Status == "approved")
        {
            record.ApprovedAt = DateTime.UtcNow;
        }

        var updated = await repo.UpdateAsync(record);
        return ToDto(updated);
    }

    public async Task<bool> DeleteAsync(int recordId)
    {
        return await repo.DeleteAsync(recordId);
    }

    private static PlantingRecordDto ToDto(PlantingRecord record) => new()
    {
        Id = record.Id,
        GrowerId = record.GrowerId,
        DatePlanted = record.DatePlanted,
        NumberOfPlantsPlanted = record.NumberOfPlantsPlanted,
        PlantSpecies = record.PlantSpecies,
        PlantingArea = record.PlantingArea,
        IssuesEncountered = record.IssuesEncountered,
        Status = record.Status,
        FieldOfficerId = record.FieldOfficerId,
        OfficerNotes = record.OfficerNotes,
        ApprovedAt = record.ApprovedAt,
        CreatedAt = record.CreatedAt,
        PhotoFilenames = record.PhotoFilenames
    };
}
