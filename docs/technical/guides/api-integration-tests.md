---
name: API integration tests
type: guide
status: active
updated: 2026-10-24
---

# API integration tests

How to run `dertinfo-api.itests` from the command line. API source CI runs this same assembly. What that job gates is in [CI/CD](../infra/cicd.md).

## Before you run

Install the .NET 8 SDK. The API projects target `net8.0` (`Directory.Build.props`).

The suite needs a SQL Server it can migrate. It does not need the website, the app, Azurite, or an Auth0 login. Authenticated cases send a token the test host signs from the persona claims in `apps/dert-api/src/dertinfo-api.itests`. Only that host accepts the signing key.

On each run the suite deletes every `dbo` table in the named database except `SystemSettings` and `__EFMigrationsHistory`, then inserts the rows in `IntegrationTestData`. Start a SQL Server that exists only for this command. The estate Compose file publishes its own SQL Server on port `44000` and keeps that data in a volume. This command publishes a separate container on port `1433`.

Leave `AZURE_APP_CONFIG` unset. When that variable is set, startup connects with Entra authentication. With it unset, and with `ASPNETCORE_ENVIRONMENT=Development`, startup uses the SQL login below and trusts the container certificate.

## Start SQL Server

From the repo root. The image tag matches `sqlserver` in [`docker-compose.yml`](../../../docker-compose.yml). The `sa` password is a throwaway value for this container. It is the same value API source CI uses, and it is not a hosted credential.

```bash
docker rm -f dertinfo-api-itests-sql
docker run --name dertinfo-api-itests-sql \
  -e ACCEPT_EULA=Y \
  -e MSSQL_SA_PASSWORD='CiOnlySqlPassw0rd' \
  -p 1433:1433 \
  -d mcr.microsoft.com/mssql/server:2025-CU9-ubuntu-24.04
```

Wait until the server accepts a connection:

```bash
until docker exec dertinfo-api-itests-sql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'CiOnlySqlPassw0rd' -C -Q 'SELECT 1' -b; do
  sleep 5
done
```

If port `1433` is already taken, change the host side of `-p` (for example `-p 1434:1433`) and set `SqlConnection__ServerName` to `localhost,1434`.

Startup creates `DertInfoDb` on the first run when that database is missing.

Stop the container when you are finished:

```bash
docker rm -f dertinfo-api-itests-sql
```

## Run the suite

From the repo root.

```bash
export ASPNETCORE_ENVIRONMENT=Development
export DOTNET_ENVIRONMENT=Development
unset AZURE_APP_CONFIG
export SqlConnection__ServerName='localhost,1433'
export SqlConnection__DatabaseName=DertInfoDb
export SqlConnection__ServerAdminName=sa
export SqlConnection__ServerAdminPassword='CiOnlySqlPassw0rd'

dotnet test apps/dert-api/src/dertinfo-api.itests/dertinfo-api.itests.csproj --configuration Release
```

PowerShell:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:DOTNET_ENVIRONMENT = 'Development'
Remove-Item Env:AZURE_APP_CONFIG -ErrorAction SilentlyContinue
$env:SqlConnection__ServerName = 'localhost,1433'
$env:SqlConnection__DatabaseName = 'DertInfoDb'
$env:SqlConnection__ServerAdminName = 'sa'
$env:SqlConnection__ServerAdminPassword = 'CiOnlySqlPassw0rd'

dotnet test apps/dert-api/src/dertinfo-api.itests/dertinfo-api.itests.csproj --configuration Release
```

Those environment variables override the placeholders in the test `appsettings.json`. `SqlConnection__ServerName` maps to `SqlConnection:ServerName`.

One collection fixture starts the API, which migrates, then seeds, before the cases run. The cases in the assembly share that database, and the assembly runs them one at a time.

A passing run reports each case, then `Passed!`. The current assembly covers:

- `GET /api/status` returns 200 after migration
- `GET /api/group` with no token returns 401
- `GET /api/group` as the group-member persona returns 200 and each group that persona’s claims cover, matching that record’s name and image file
- `GET /api/group/{id}` as that persona returns each of those groups
- `GET /api/group/{id}` for a group outside those claims returns 403

The cases compare the response with the records in `IntegrationTestData`. They do not name the contents of those records.

## Run one case

`--filter` still starts the collection fixture, so the named database is migrated and seeded.

```bash
dotnet test apps/dert-api/src/dertinfo-api.itests/dertinfo-api.itests.csproj --configuration Release --filter "FullyQualifiedName~StatusController_Fixture_CheckStatus"
```

## Related

- [Local development](local-development.md) — the estate SQL Server on port `44000`
- [CI/CD](../infra/cicd.md) — the API source CI job that runs this assembly
- [`apps/dert-api/README.md`](../../../apps/dert-api/README.md) — install and debug the API
