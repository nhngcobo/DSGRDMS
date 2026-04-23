using Microsoft.EntityFrameworkCore;
using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Grower> Growers { get; set; }
    public DbSet<ComplianceDocument> ComplianceDocuments { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<FieldVisit> FieldVisits { get; set; }
    public DbSet<PlantingRecord> PlantingRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Grower>(e =>
        {
            e.HasKey(g => g.Id);
            e.HasIndex(g => g.InternalId).IsUnique();
            e.HasIndex(g => g.GrowerId).IsUnique();
            e.HasIndex(g => g.IdNumber).IsUnique();
            e.Property(g => g.PlantationSize).HasColumnType("decimal(10,2)");
            e.Property(g => g.PasswordHash).HasMaxLength(256);
        });

        modelBuilder.Entity<ComplianceDocument>(e =>
        {
            e.HasKey(d => d.Id);
            e.HasIndex(d => new { d.GrowerId, d.DocumentTypeId }).IsUnique();
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Message>(e =>
        {
            e.HasKey(m => m.Id);
            e.HasIndex(m => m.GrowerId);
            e.HasIndex(m => m.SenderUserId);
        });

        modelBuilder.Entity<FieldVisit>(e =>
        {
            e.HasKey(v => v.Id);
            e.HasIndex(v => v.GrowerId);
            e.HasIndex(v => v.Status);
            e.HasIndex(v => v.ScheduledDate);
            e.Property(v => v.OfficerId).HasMaxLength(255);
            e.Property(v => v.OfficerName).HasMaxLength(255);
        });

        modelBuilder.Entity<PlantingRecord>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.GrowerId);
            e.HasIndex(p => p.Status);
            e.HasIndex(p => p.DatePlanted);
            e.Property(p => p.PlantSpecies).HasMaxLength(255);
            e.Property(p => p.PlantingArea).HasMaxLength(500);
            e.Property(p => p.Status).HasMaxLength(50);
            e.Property(p => p.PhotoFilenames).HasConversion(
                v => string.Join(',', v),
                v => v.Split(',', System.StringSplitOptions.RemoveEmptyEntries).ToList()
            );
        });
    }
}
