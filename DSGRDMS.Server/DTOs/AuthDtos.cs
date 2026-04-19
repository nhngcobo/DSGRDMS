namespace DSGRDMS.Server.DTOs;

public record LoginRequest(string Email, string Password);

public record LoginResponse(string Token, string Role, string Name, string? GrowerId);
