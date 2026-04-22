using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DSGRDMS.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageReplyFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RepliedAt",
                table: "Messages",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReplyStatus",
                table: "Messages",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RepliedAt",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "ReplyStatus",
                table: "Messages");
        }
    }
}
