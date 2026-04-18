namespace DSGRDMS.Server.DTOs;

public class DashboardSummaryResponse
{
    public int TotalGrowers { get; set; }
    public int PendingCount { get; set; }
    public int VerifiedCount { get; set; }
    public int HighRiskCount { get; set; }
    public List<MonthlyRegistrationDto> MonthlyRegistrations { get; set; } = [];
    public List<RecentApplicationDto> RecentApplications { get; set; } = [];
}

public class MonthlyRegistrationDto
{
    public string Month { get; set; } = string.Empty;
    public int Registrations { get; set; }
}

public class RecentApplicationDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
