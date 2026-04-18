using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DSGRDMS.Server.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Growers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InternalId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GrowerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IdNumber = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BusinessName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BusinessRegNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LandTenure = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TreeSpecies = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlantationSize = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    GpsLat = table.Column<double>(type: "float", nullable: true),
                    GpsLng = table.Column<double>(type: "float", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false),
                    RegisteredAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Growers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Growers_GrowerId",
                table: "Growers",
                column: "GrowerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Growers_IdNumber",
                table: "Growers",
                column: "IdNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Growers_InternalId",
                table: "Growers",
                column: "InternalId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Growers");
        }
    }
}
