# Development API src deploy and App Service SQL contained user

## Summary of the work completed

The new-stack API is running in **development**. Swagger UI is at `https://app-dev-dertinfo-api-uks.azurewebsites.net/swagger/index.html`. Hosted SQL login for the site uses a **contained database user named after the App Service** (`app-dev-dertinfo-api-uks`), created with `CREATE USER ... FROM EXTERNAL PROVIDER` and `db_datareader` / `db_datawriter` / `db_ddladmin`. Operator script: [`New-DertInfoSqlAppServiceUser.ps1`](../../../infra/scripts/New-DertInfoSqlAppServiceUser.ps1). How-to: [Secrets and rotation — hosted Azure SQL](../../technical/infra/secrets-and-rotation.md#hosted-azure-sql-entra-only).

## Why the work was completed

API Src CD can zip-deploy the site, but Azure SQL does not treat a **managed identity** as a member of `dertinfo-sql-db-access-development` for login. Adding the MI to that Entra group is valid in the directory and still fails SQL with `Login failed for user '<token-identified principal>'`. The group user remains for **people**. The site needs its own principal. Documenting that (and the script) so production and the Azure bring-up guide do not repeat the same miss.

## Date the work was started

2026-09-07

## Date the work was completed

2026-09-07

## Issues that were encountered on the way

- After Src CD, `Startup.Configure` `Migrate()` failed with SqlException 18456 `<token-identified principal>`. The Entra token was valid (routing reached UK South SQL); there was no database user for the site object ID.
- Putting the system-assigned MI in `dertinfo-sql-db-access-development` did not fix it. Azure SQL authorizes users via that group; it does not authorize managed identities / service principals via the same group.
- Docs and [`New-DertInfoSqlDbAccessUser.ps1`](../../../infra/scripts/New-DertInfoSqlDbAccessUser.ps1) had said to add the App Service MI to the group later. That was wrong for the hosted API.

## References to any best practices that we found

- [Microsoft Entra authentication for Azure SQL](https://learn.microsoft.com/en-us/azure/azure-sql/database/authentication-aad-overview)
- [Create contained users mapped to Microsoft Entra identities](https://learn.microsoft.com/en-us/azure/azure-sql/database/authentication-aad-configure#create-contained-users-mapped-to-microsoft-entra-identities)
- Earlier group bind (operators): [2026-08-31-003](./2026-08-31-003-sql-db-access-user-odbc-mfa.md)

## Any remaining issues that we may wish to address

- Production: after PRD API infra exists, run `New-DertInfoSqlAppServiceUser.ps1 -GitHubEnvironment production`, then API Src CD `target: full` (or a production-only path).
- Functions (and any other app identities) will need the same pattern: a contained user per MI, not group membership.
- Carry this order into the Azure bring-up guide: API infra CD → KV secrets + App Config import → **App Service SQL user** → then Src CD → restart if 18456 persists.
- Remove temporary src `workflow_dispatch` when Azure settings testing is done ([issue 116](https://github.com/dertinfo/dertinfo-mono/issues/116)).
