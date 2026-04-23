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
                name: "ComplianceDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GrowerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DocumentTypeId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StoredFileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComplianceDocuments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FieldVisits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GrowerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    VisitType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScheduledDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ScheduledTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OfficerId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    OfficerName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Findings = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FieldVisits", x => x.Id);
                });

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
                    PasswordHash = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    BusinessName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BusinessRegNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LandTenure = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TreeSpecies = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlantationSize = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    GpsLat = table.Column<double>(type: "float", nullable: true),
                    GpsLng = table.Column<double>(type: "float", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FurthestStep = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false),
                    RegisteredAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Growers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SenderUserId = table.Column<int>(type: "int", nullable: false),
                    SenderName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GrowerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    SentByGrower = table.Column<bool>(type: "bit", nullable: false),
                    QueryType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssignedToUserId = table.Column<int>(type: "int", nullable: true),
                    AssignedToName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReplyStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RepliedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlantingRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GrowerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DatePlanted = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NumberOfPlantsPlanted = table.Column<int>(type: "int", nullable: false),
                    PlantSpecies = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PlantingArea = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IssuesEncountered = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FieldOfficerId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OfficerNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PhotoFilenames = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlantingRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GrowerId = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComplianceDocuments_GrowerId_DocumentTypeId",
                table: "ComplianceDocuments",
                columns: new[] { "GrowerId", "DocumentTypeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FieldVisits_GrowerId",
                table: "FieldVisits",
                column: "GrowerId");

            migrationBuilder.CreateIndex(
                name: "IX_FieldVisits_ScheduledDate",
                table: "FieldVisits",
                column: "ScheduledDate");

            migrationBuilder.CreateIndex(
                name: "IX_FieldVisits_Status",
                table: "FieldVisits",
                column: "Status");

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

            migrationBuilder.CreateIndex(
                name: "IX_Messages_GrowerId",
                table: "Messages",
                column: "GrowerId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_SenderUserId",
                table: "Messages",
                column: "SenderUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantingRecords_DatePlanted",
                table: "PlantingRecords",
                column: "DatePlanted");

            migrationBuilder.CreateIndex(
                name: "IX_PlantingRecords_GrowerId",
                table: "PlantingRecords",
                column: "GrowerId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantingRecords_Status",
                table: "PlantingRecords",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ComplianceDocuments");

            migrationBuilder.DropTable(
                name: "FieldVisits");

            migrationBuilder.DropTable(
                name: "Growers");

            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "PlantingRecords");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
