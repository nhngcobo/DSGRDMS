using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Repositories;

public interface IGrowerRepository
{
    Task<IEnumerable<Grower>> GetAllAsync();
    Task<Grower?> GetByGrowerIdAsync(string growerId);
    Task<bool> ExistsByIdNumberAsync(string idNumber);
    Task<string> GenerateGrowerIdAsync();
    Task<Grower> AddAsync(Grower grower);
    Task UpdateStatusAsync(string growerId, string status);
}
