using DSGRDMS.Server.DTOs;

namespace DSGRDMS.Server.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(string email, string password);
    Task<LoginResponse?> LinkGrowerAsync(int userId, string growerId);
}
