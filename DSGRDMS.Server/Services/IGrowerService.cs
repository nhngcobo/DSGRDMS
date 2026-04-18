using DSGRDMS.Server.DTOs;

namespace DSGRDMS.Server.Services;

public interface IGrowerService
{
    Task<IEnumerable<GrowerResponse>> GetAllAsync();
    Task<GrowerResponse?> GetByIdAsync(string growerId);
    Task<(GrowerResponse? Result, string? ConflictMessage)> RegisterAsync(RegisterGrowerRequest request);
}
