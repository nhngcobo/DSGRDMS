using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DSGRDMS.Server.Migrations
{
    /// <inheritdoc />
    public partial class DeleteAllGrowers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Delete all grower records (cascading deletes will handle related data)
            migrationBuilder.Sql("DELETE FROM Growers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Rollback would require restoring data, which is not practical
            // This is intentionally left empty
        }
    }
}
