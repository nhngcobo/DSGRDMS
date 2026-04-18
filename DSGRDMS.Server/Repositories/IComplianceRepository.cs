using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Repositories;

public interface IComplianceRepository
{
    Task<IEnumerable<ComplianceDocument>> GetAllAsync();
    Task<IEnumerable<ComplianceDocument>> GetByGrowerIdAsync(string growerId);
    Task<ComplianceDocument?> GetByGrowerAndTypeAsync(string growerId, int docTypeId);
    Task<ComplianceDocument> UpsertAsync(ComplianceDocument doc);
    Task<ComplianceDocument> UpdateAsync(ComplianceDocument doc);
}
