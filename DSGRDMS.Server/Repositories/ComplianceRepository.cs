using Microsoft.EntityFrameworkCore;
using DSGRDMS.Server.Data;
using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Repositories;

public class ComplianceRepository(AppDbContext db) : IComplianceRepository
{
    public async Task<IEnumerable<ComplianceDocument>> GetAllAsync() =>
        await db.ComplianceDocuments.ToListAsync();

    public async Task<IEnumerable<ComplianceDocument>> GetByGrowerIdAsync(string growerId) =>
        await db.ComplianceDocuments.Where(d => d.GrowerId == growerId).ToListAsync();

    public async Task<ComplianceDocument?> GetByGrowerAndTypeAsync(string growerId, int docTypeId) =>
        await db.ComplianceDocuments
            .FirstOrDefaultAsync(d => d.GrowerId == growerId && d.DocumentTypeId == docTypeId);

    public async Task<ComplianceDocument> UpsertAsync(ComplianceDocument incoming)
    {
        var existing = await GetByGrowerAndTypeAsync(incoming.GrowerId, incoming.DocumentTypeId);
        if (existing is null)
        {
            db.ComplianceDocuments.Add(incoming);
            await db.SaveChangesAsync();
            return incoming;
        }

        existing.Status         = incoming.Status;
        existing.FileName       = incoming.FileName;
        existing.StoredFileName = incoming.StoredFileName;
        existing.UploadedAt     = incoming.UploadedAt;
        existing.ReviewedAt     = null;
        existing.RejectionReason = null;
        await db.SaveChangesAsync();
        return existing;
    }

    public async Task<ComplianceDocument> UpdateAsync(ComplianceDocument doc)
    {
        db.ComplianceDocuments.Update(doc);
        await db.SaveChangesAsync();
        return doc;
    }
}
