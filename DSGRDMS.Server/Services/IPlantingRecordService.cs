using DSGRDMS.Server.DTOs;

namespace DSGRDMS.Server.Services;

public interface IPlantingRecordService
{
    Task<IEnumerable<PlantingRecordDto>> GetByGrowerIdAsync(string growerId);
    Task<PlantingRecordDto?> GetByIdAsync(int recordId);
    Task<IEnumerable<PlantingRecordDto>> GetPendingReviewAsync();
    Task<PlantingRecordDto> CreateAsync(CreatePlantingRecordRequest request);
    Task<PlantingRecordDto?> UpdateAsync(int recordId, UpdatePlantingRecordRequest request);
    Task<PlantingRecordDto?> ReviewAsync(int recordId, ReviewPlantingRecordRequest request);
    Task<bool> DeleteAsync(int recordId);
}
