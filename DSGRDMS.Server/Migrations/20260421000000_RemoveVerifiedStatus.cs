using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DSGRDMS.Server.Migrations
{
    /// <inheritdoc />
    public partial class RemoveVerifiedStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update any existing "verified" status records to "approved"
            migrationBuilder.Sql(
                "UPDATE Growers SET Status = 'approved' WHERE Status = 'verified'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // In case of rollback, we can't reliably restore "verified" status
            // so we just do nothing on Down
        }
    }
}
