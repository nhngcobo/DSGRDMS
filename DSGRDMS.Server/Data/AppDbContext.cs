using Microsoft.EntityFrameworkCore;
using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Grower> Growers { get; set; }
    public DbSet<ComplianceDocument> ComplianceDocuments { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Message> Messages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Grower>(e =>
        {
            e.HasKey(g => g.Id);
            e.HasIndex(g => g.InternalId).IsUnique();
            e.HasIndex(g => g.GrowerId).IsUnique();
            e.HasIndex(g => g.IdNumber).IsUnique();
            e.Property(g => g.PlantationSize).HasColumnType("decimal(10,2)");
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
    }
}
