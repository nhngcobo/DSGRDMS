using Microsoft.EntityFrameworkCore.Migrations;
using DSGRDMS.Server.Helpers;

#nullable disable

namespace DSGRDMS.Server.Migrations
{
    /// <inheritdoc />
    public partial class SetFieldOfficerPasswords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Hash the default password: Officer123!
            string hashedPassword = PasswordHelper.Hash("Officer123!");

            // Set password for all field officers
            migrationBuilder.Sql($@"
                UPDATE Users 
                SET PasswordHash = '{hashedPassword}' 
                WHERE Email IN (
                    'officer@demo.com',
                    'officer1@demo.com',
                    'officer2@demo.com',
                    'officer3@demo.com',
                    'officer4@demo.com',
                    'officer5@demo.com'
                )
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Rollback - set to empty/null or another default
        }
    }
}
