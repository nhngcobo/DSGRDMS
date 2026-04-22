using DSGRDMS.Server.DTOs;

namespace DSGRDMS.Server.Services;

public interface IFieldVisitService
{
    Task<List<FieldVisitDto>> GetAllAsync();
    Task<List<FieldVisitDto>> GetByGrowerAsync(string growerId);
    Task<List<FieldVisitDto>> GetUpcomingByGrowerAsync(string growerId);
    Task<List<FieldVisitDto>> GetPastByGrowerAsync(string growerId);
    Task<FieldVisitDto?> GetByIdAsync(int id);
    Task<FieldVisitDto> CreateAsync(CreateFieldVisitRequest request);
    Task<FieldVisitDto?> UpdateAsync(UpdateFieldVisitRequest request);
    Task DeleteAsync(int id);
}
