using Microsoft.EntityFrameworkCore;
using DSGRDMS.Server.Models;

namespace DSGRDMS.Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Grower> Growers { get; set; }

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
    }
}
