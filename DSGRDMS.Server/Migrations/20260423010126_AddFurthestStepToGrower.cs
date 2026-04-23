using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DSGRDMS.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddFurthestStepToGrower : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FurthestStep",
                table: "Growers",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FurthestStep",
                table: "Growers");
        }
    }
}
