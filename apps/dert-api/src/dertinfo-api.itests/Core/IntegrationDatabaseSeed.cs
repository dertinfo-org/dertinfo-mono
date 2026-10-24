using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;

namespace DertInfo.Api.ITests.Core
{
    /// <summary>
    /// Inserts the event, groups, and image rows the API integration tests call.
    /// The names and ids match the website and app personas: group 1 is "The Simpsons"
    /// with family.jpg, group 2 is "The Flanders", and event 1 is "City Zoo Gathering"
    /// with giraffe.jpg. The picture URL is built from the row. The image bytes are not stored.
    /// System settings written by startup are left in place.
    /// </summary>
    public static class IntegrationDatabaseSeed
    {
        private const string Actor = "api-itests";
        private static readonly Regex Identifier = new Regex("^[A-Za-z_][A-Za-z0-9_]*$", RegexOptions.CultureInvariant);

        public static void Apply()
        {
            using var connection = new SqlConnection(BuildConnectionString());
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try
            {
                ClearFixtureTables(connection, transaction);
                InsertPack(connection, transaction);
                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        private static string BuildConnectionString()
        {
            var contentRoot = Path.GetDirectoryName(typeof(IntegrationDatabaseSeed).Assembly.Location)
                ?? Directory.GetCurrentDirectory();
            var configuration = new ConfigurationBuilder()
                .SetBasePath(contentRoot)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
                .AddEnvironmentVariables()
                .Build();

            var server = configuration["SqlConnection:ServerName"];
            var database = configuration["SqlConnection:DatabaseName"];
            var user = configuration["SqlConnection:ServerAdminName"];
            var password = configuration["SqlConnection:ServerAdminPassword"];
            if (string.IsNullOrWhiteSpace(server) || string.IsNullOrWhiteSpace(database)
                || string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(password))
            {
                throw new InvalidOperationException("SQL connection settings are missing. Set SqlConnection__ServerName, SqlConnection__DatabaseName, SqlConnection__ServerAdminName, and SqlConnection__ServerAdminPassword.");
            }

            var connectionString =
                "Server=" + server + ";" +
                "Database=" + database + ";" +
                "User Id=" + user + ";" +
                "Password=" + password + ";" +
                "Persist Security Info=False;";

            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
                ?? "Development";
            if (string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase))
            {
                connectionString += "Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;";
            }

            return connectionString;
        }

        private static void ClearFixtureTables(SqlConnection connection, SqlTransaction transaction)
        {
            var tables = new List<string>();
            using (var command = connection.CreateCommand())
            {
                command.Transaction = transaction;
                command.CommandText = @"
                    SELECT t.name
                    FROM sys.tables t
                    INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
                    WHERE s.name = 'dbo'";
                using var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    var name = reader.GetString(0);
                    if (name == "SystemSettings" || name == "__EFMigrationsHistory")
                    {
                        continue;
                    }

                    if (!Identifier.IsMatch(name))
                    {
                        throw new InvalidOperationException($"Refusing to clear unexpected table name \"{name}\".");
                    }

                    tables.Add(name);
                }
            }

            Execute(connection, transaction, @"
                DECLARE @sql nvarchar(max) = N'';
                SELECT @sql = @sql + N'ALTER TABLE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N' NOCHECK CONSTRAINT ALL;'
                FROM sys.tables t
                INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
                WHERE s.name = 'dbo';
                EXEC sp_executesql @sql;");

            foreach (var name in tables)
            {
                Execute(connection, transaction, $"DELETE FROM [dbo].[{name}]");
            }

            Execute(connection, transaction, @"
                DECLARE @sql nvarchar(max) = N'';
                SELECT @sql = @sql + N'ALTER TABLE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N' WITH CHECK CHECK CONSTRAINT ALL;'
                FROM sys.tables t
                INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
                WHERE s.name = 'dbo';
                EXEC sp_executesql @sql;");
        }

        private static void InsertPack(SqlConnection connection, SqlTransaction transaction)
        {
            var now = DateTime.UtcNow;
            var familyImageId = InsertImage(connection, transaction, now, "family.jpg", "groupimages", "The Simpsons");
            var giraffeImageId = InsertImage(connection, transaction, now, "giraffe.jpg", "eventimages", "City Zoo Gathering");

            InsertWithId(connection, transaction, "Events", 1, new (string, object)[]
            {
                ("CreatedBy", Actor),
                ("DateCreated", now),
                ("DateModified", now),
                ("ModifiedBy", Actor),
                ("IsDeleted", false),
                ("AccessToken", DBNull.Value),
                ("Name", "City Zoo Gathering"),
                ("ContactName", "Event Keeper"),
                ("ContactEmail", "event-admin-1@dertinfo.co.uk"),
                ("ContactTelephone", "01234567891"),
                ("RegistrationOpenDate", new DateTime(2026, 1, 1)),
                ("RegistrationCloseDate", new DateTime(2027, 5, 1)),
                ("EventSynopsis", "A day riding a giraffe at the city zoo"),
                ("EventStartDate", new DateTime(2027, 6, 1)),
                ("EventEndDate", new DateTime(2027, 6, 2)),
                ("EventTemplateType", 1),
                ("EventVisibilityType", 0),
                ("LocationTown", "Springfield"),
                ("LocationPostcode", "SP1 1AA"),
                ("IsConfigured", true),
                ("IsPromoted", false),
                ("IsCancelled", false),
                ("TermsAndConditionsAgreed", true),
                ("TermsAndConditionsAgreedBy", Actor),
                ("SentEmailsBcc", DBNull.Value),
            });
            InsertRow(connection, transaction, "EventImages", new (string, object)[]
            {
                ("EventId", 1),
                ("ImageId", giraffeImageId),
                ("IsPrimary", true),
            });
            InsertActivity(connection, transaction, now, 1, 1, "Adult Giraffe Ride", "A ticket for an adult to ride a giraffe", 15m, true);
            InsertActivity(connection, transaction, now, 1, 1, "Child Giraffe Ride", "A ticket for a child to ride a giraffe", 8m, false);
            InsertActivity(connection, transaction, now, 1, 2, "Carry a Giraffe", "A team carries a giraffe across the zoo", 20m, false);

            InsertGroup(connection, transaction, now, familyImageId, 1, "The Simpsons", "The family from Springfield", "Springfield", "SP1 1AA", "Homer Simpson", "group-admin-1@dertinfo.co.uk", "01234567890", "1001");
            InsertMember(connection, transaction, now, 1, "Homer Simpson", 1, "group-member-1@dertinfo.co.uk");
            InsertMember(connection, transaction, now, 1, "Marge Simpson", 2, DBNull.Value);
            InsertTeam(connection, transaction, now, 1, "Springfield", "A team from Springfield");

            InsertGroup(connection, transaction, now, familyImageId, 2, "The Flanders", "The neighbours from Evergreen Terrace", "Springfield", "SP1 2BB", "Ned Flanders", "group-admin-2@dertinfo.co.uk", "01234567892", "1002");
            InsertMember(connection, transaction, now, 2, "Ned Flanders", 1, "group-admin-2@dertinfo.co.uk");
            InsertMember(connection, transaction, now, 2, "Maude Flanders", 2, DBNull.Value);
            InsertTeam(connection, transaction, now, 2, "Leftorium", "The shop team from Springfield");
        }

        private static void InsertGroup(
            SqlConnection connection,
            SqlTransaction transaction,
            DateTime now,
            int imageId,
            int id,
            string name,
            string bio,
            string town,
            string postcode,
            string contactName,
            string contactEmail,
            string contactNumber,
            string pin)
        {
            InsertWithId(connection, transaction, "Groups", id, new (string, object)[]
            {
                ("CreatedBy", Actor),
                ("DateCreated", now),
                ("DateModified", now),
                ("ModifiedBy", Actor),
                ("IsDeleted", false),
                ("AccessToken", DBNull.Value),
                ("GroupName", name),
                ("GroupBio", bio),
                ("PrimaryContactName", contactName),
                ("PrimaryContactNumber", contactNumber),
                ("PrimaryContactEmail", contactEmail),
                ("GroupImageUrl", DBNull.Value),
                ("GroupMemberJoiningPinCode", pin),
                ("OriginTown", town),
                ("OriginPostcode", postcode),
                ("GroupVisibilityType", 0),
                ("TermsAndConditionsAgreed", true),
                ("TermsAndConditionsAgreedBy", Actor),
                ("IsConfigured", true),
            });
            InsertRow(connection, transaction, "GroupImages", new (string, object)[]
            {
                ("GroupId", id),
                ("ImageId", imageId),
                ("IsPrimary", true),
            });
        }

        private static void InsertMember(SqlConnection connection, SqlTransaction transaction, DateTime now, int groupId, string name, int memberType, object email)
        {
            InsertRow(connection, transaction, "GroupMembers", new (string, object)[]
            {
                ("CreatedBy", Actor),
                ("DateCreated", now),
                ("DateModified", now),
                ("ModifiedBy", Actor),
                ("IsDeleted", false),
                ("AccessToken", DBNull.Value),
                ("Name", name),
                ("MemberType", memberType),
                ("EmailAddress", email),
                ("GroupId", groupId),
                ("DateJoined", now),
                ("DateOfBirth", DBNull.Value),
                ("Facebook", DBNull.Value),
                ("TelephoneNumber", DBNull.Value),
            });
        }

        private static void InsertTeam(SqlConnection connection, SqlTransaction transaction, DateTime now, int groupId, string name, string bio)
        {
            InsertRow(connection, transaction, "Teams", new (string, object)[]
            {
                ("CreatedBy", Actor),
                ("DateCreated", now),
                ("DateModified", now),
                ("ModifiedBy", Actor),
                ("IsDeleted", false),
                ("AccessToken", DBNull.Value),
                ("GroupId", groupId),
                ("ShowShowcase", false),
                ("TeamBio", bio),
                ("TeamName", name),
            });
        }

        private static void InsertActivity(
            SqlConnection connection,
            SqlTransaction transaction,
            DateTime now,
            int eventId,
            int audienceTypeId,
            string title,
            string description,
            decimal price,
            bool isDefault)
        {
            InsertRow(connection, transaction, "Activities", new (string, object)[]
            {
                ("CreatedBy", Actor),
                ("DateCreated", now),
                ("DateModified", now),
                ("ModifiedBy", Actor),
                ("IsDeleted", false),
                ("EventId", eventId),
                ("AudienceTypeId", audienceTypeId),
                ("CompetitionId", DBNull.Value),
                ("Title", title),
                ("Description", description),
                ("IsDefault", isDefault),
                ("PriceTBC", false),
                ("Price", price),
                ("SoldOut", false),
            });
        }

        private static int InsertImage(SqlConnection connection, SqlTransaction transaction, DateTime now, string fileName, string container, string alt)
        {
            var extension = Path.GetExtension(fileName).TrimStart('.');
            return InsertRow(connection, transaction, "Images", new (string, object)[]
            {
                ("CreatedBy", Actor),
                ("DateCreated", now),
                ("DateModified", now),
                ("ModifiedBy", Actor),
                ("IsDeleted", false),
                ("ImageAlt", alt),
                ("ImagePath", fileName),
                ("ImageUri", DBNull.Value),
                ("MarkedForRemoval", false),
                ("BlobName", fileName),
                ("Extension", extension),
                ("Container", container),
                ("BlobPath", "originals"),
                ("IsProtected", false),
                ("HasBeenMovedForMigration", false),
                ("HasBeenProcessedForMigration", false),
            });
        }

        private static int InsertRow(SqlConnection connection, SqlTransaction transaction, string table, IReadOnlyList<(string Name, object Value)> columns)
        {
            using var command = BuildInsert(connection, transaction, table, columns, null);
            var id = command.ExecuteScalar();
            return Convert.ToInt32(id);
        }

        private static void InsertWithId(SqlConnection connection, SqlTransaction transaction, string table, int id, IReadOnlyList<(string Name, object Value)> columns)
        {
            using var command = BuildInsert(connection, transaction, table, columns, id);
            command.ExecuteNonQuery();
        }

        private static SqlCommand BuildInsert(
            SqlConnection connection,
            SqlTransaction transaction,
            string table,
            IReadOnlyList<(string Name, object Value)> columns,
            int? explicitId)
        {
            if (!Identifier.IsMatch(table))
            {
                throw new InvalidOperationException($"Refusing to insert into unexpected table \"{table}\".");
            }

            var command = connection.CreateCommand();
            command.Transaction = transaction;
            var names = new List<string>();
            var parameters = new List<string>();
            if (explicitId.HasValue)
            {
                names.Add("[Id]");
                parameters.Add("@id");
                command.Parameters.AddWithValue("@id", explicitId.Value);
            }

            for (var index = 0; index < columns.Count; index++)
            {
                var column = columns[index];
                if (!Identifier.IsMatch(column.Name))
                {
                    throw new InvalidOperationException($"Refusing to insert unexpected column \"{column.Name}\".");
                }

                var parameterName = "@p" + index;
                names.Add("[" + column.Name + "]");
                parameters.Add(parameterName);
                command.Parameters.AddWithValue(parameterName, column.Value ?? DBNull.Value);
            }

            var insert = $"INSERT INTO [dbo].[{table}] ({string.Join(", ", names)}) VALUES ({string.Join(", ", parameters)});";
            if (explicitId.HasValue)
            {
                command.CommandText =
                    $"SET IDENTITY_INSERT [dbo].[{table}] ON; {insert} SET IDENTITY_INSERT [dbo].[{table}] OFF; DBCC CHECKIDENT (N'dbo.{table}', RESEED, {explicitId.Value});";
            }
            else
            {
                command.CommandText = insert + " SELECT CAST(SCOPE_IDENTITY() AS int);";
            }

            return command;
        }

        private static void Execute(SqlConnection connection, SqlTransaction transaction, string sql)
        {
            using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = sql;
            command.ExecuteNonQuery();
        }
    }
}
