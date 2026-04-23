using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Repositories;

public interface IPlantingRecordRepository
{
    Task<IEnumerable<PlantingRecord>> GetByGrowerIdAsync(string growerId);
    Task<PlantingRecord?> GetByIdAsync(int recordId);
    Task<IEnumerable<PlantingRecord>> GetPendingReviewAsync();
    Task<PlantingRecord> AddAsync(PlantingRecord record);
    Task<PlantingRecord> UpdateAsync(PlantingRecord record);
    Task<bool> DeleteAsync(int recordId);
}
