using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Repositories;

public interface IFieldVisitRepository
{
    Task<List<FieldVisit>> GetAllAsync();
    Task<List<FieldVisit>> GetByGrowerAsync(string growerId);
    Task<List<FieldVisit>> GetUpcomingByGrowerAsync(string growerId);
    Task<List<FieldVisit>> GetPastByGrowerAsync(string growerId);
    Task<FieldVisit?> GetByIdAsync(int id);
    Task<FieldVisit> CreateAsync(FieldVisit visit);
    Task<FieldVisit?> UpdateAsync(FieldVisit visit);
    Task DeleteAsync(int id);
}
