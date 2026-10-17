# Operator script to copy production SQL onto development

## Summary of the work completed

[`Copy-DertInfoSqlToDevelopment.ps1`](../../../infra/scripts/Copy-DertInfoSqlToDevelopment.ps1) ARM-copies a production Azure SQL database onto `sql-dev-dertinfo-storage-uks`, swaps it to the Bicep name `sqldb-dev-dertinfo-storage-uks`, binds DEV Entra users, and pauses for **Continue** (delete the previous DEV database) or **Revert** (swap back). How-to: [`infra/scripts/README.md`](../../../infra/scripts/README.md). Future SQL network bar (not applied here): [issue 118](https://github.com/dertinfo/dertinfo-mono/issues/118).

## Why the work was completed

Development needs a repeatable refresh from production data before the same process is used at cutover. Azure SQL copy is control-plane and works with Entra-only destinations. A bacpac import would need a SQL admin password the new servers do not have. After a copy, live SQL users are useless on DEV; the existing Entra user scripts must run against the official database name. A sidecar plus Continue/Revert keeps the Bicep name in place so storage infra CD does not recreate an empty database.

## Date the work was started

2026-09-19

## Date the work was completed

2026-09-20

## Issues that were encountered on the way

- This machine’s Azure CLI `az sql db copy` has no `--dest-subscription`. Cross-subscription copy uses ARM `PUT` with `createMode: Copy` and the source database resource id.
- Resource group names are in Bicep; subscription ids are not. The script finds each subscription by looking up those groups under `az login`. The current default subscription does not matter.
- First live run (`dertinfo-live-rg` / `dertinfo-live-sqlsvr` / `dertinfo-live-sqldb` → DEV) succeeded. A PowerShell backtick immediately before `-SourceDatabase` was parsed as the database name; a FQDN for `-SourceServer` is now stripped. After the rename swap, `sqlcmd -G` waited on an Entra MFA window that opened behind Cursor; completing MFA unblocked both user-bind scripts.

## References to any best practices that we found

- [Copy a database - Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/database-copy) — ARM copy; T-SQL `CREATE DATABASE … AS COPY OF` needs the client IP on both servers and was not used
- [IP firewall rules - Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/firewall-configure) — Allow Azure services (`0.0.0.0`) permits any Azure resource in any subscription
- Existing operator bind: [`New-DertInfoSqlDbAccessUser.ps1`](../../../infra/scripts/New-DertInfoSqlDbAccessUser.ps1), [`New-DertInfoSqlAppServiceUser.ps1`](../../../infra/scripts/New-DertInfoSqlAppServiceUser.ps1)

## Any remaining issues that we may wish to address

- Apply the agreed SQL firewall bar (drop Allow Azure services; App Service outbound IPs plus administrator IP) — [issue 118](https://github.com/dertinfo/dertinfo-mono/issues/118).
- Finish hosted testing of the restored development database (API, web, app) before using the same process to cut over production.
- `-Source production` needs the new-stack PRD database. Until then use `-Source live` with the old-stack names.
- Auth0 user ids on a copied live database will not match the development tenant (`dertinfotest`); this refresh is data/schema, not a full identity dry-run.
