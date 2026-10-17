---
name: Secrets and rotation
type: infra
status: active
updated: 2026-10-17
---

# Secrets inventory and rotation

Credentials used by DertInfo and how to rotate them in hosted environments. Local development uses [`infra/secrets/api.env`](../../../infra/secrets/) (or Visual Studio user secrets) — see [Configuration](configuration.md).

Adapted from the legacy wiki: [Credentials & Secrets](https://github.com/dertinfo/dertinfo/wiki/Credentials-&-Secrets).

## Management plane

Operational / management access to third-party dashboards is typically via the organisation’s admin mailbox with MFA. Prefer **managed identity** and Entra-based access between Azure resources where possible instead of long-lived shared secrets.

## Application secrets (API)

| Secret | Purpose |
|--------|---------|
| Images storage account access key | API writes original images to blob storage (`az-storage-images-accountkey`) |
| Function app storage account access key | **Leftover catalog** (`az-storage-functions-accountkey` / `StorageAccount:Functions:Key`). New-stack Flex host storage is identity-only (`allowSharedKeyAccess: false`); the API does not read this key. Remove with [issue 115](https://github.com/dertinfo/dertinfo-mono/issues/115). |
| Application Insights instrumentation key | Web and PWA telemetry (`appinsights-telemetryid`; not a credential, stored in Key Vault for obfuscation) |
| Auth0 Management Client ID | M2M client id (`auth0-managementclientid`; obfuscated in Key Vault) |
| Web Auth0 Client ID | Website SPA client id (`webclient-auth0-clientid`; obfuscated in Key Vault) |
| PWA Auth0 Client ID | PWA SPA client id (`pwaclient-auth0-clientid`; obfuscated in Key Vault) |
| SQL username / password | **Local only** (`infra/secrets/api.env`). Hosted Azure SQL is Entra-only (contained user for the App Service MI; operators use the database access group) |
| SQL server name / database name | Hosted: Key Vault (`sqlconnection-servername`, `sqlconnection-databasename`) for obfuscation. Local: `infra/secrets/api.env` |
| SendGrid API key | Transactional email (`sendgrid-apikey`) |
| Mailgun API key | Transactional email (`mailgun-apikey`) |
| Auth0 Management Client secret | API updates Auth0 user `app_metadata` (`auth0-managementclientsecret`) |

Never commit these values. Hosted environments: Key Vault (often referenced from App Configuration). Local: `infra/secrets/api.env`.

## Rotating secrets (staging & production)

Restart the API after Key Vault / App Configuration updates unless a configuration refresh mechanism is enabled (it is not, by default).

### Hosted Key Vault secrets (config vault)

Do not put these values in Bicep. Config Bicep creates the vault and App Configuration store only. [`Import-DertInfoAppConfiguration.ps1`](../../../infra/scripts/Configuration/Import-DertInfoAppConfiguration.ps1) writes Key Vault references (labels `Development` / `Production`). Copy [`kv-secrets.development.json.example`](../../../infra/configuration/kv-secrets.development.json.example) to `kv-secrets.development.json` (gitignored), fill the values, then:

```powershell
.\Configuration\New-DertInfoConfigKeyVaultSecrets.ps1 -GitHubEnvironment development
```

| Key Vault secret | App Configuration key |
|------------------|------------------------|
| `auth0-managementclientsecret` | `Auth0:ManagementClientSecret` |
| `auth0-managementclientid` | `Auth0:ManagementClientId` |
| `webclient-auth0-clientid` | `WebClient:Auth0:ClientId` |
| `pwaclient-auth0-clientid` | `PwaClient:Auth0:ClientId` |
| `appinsights-telemetryid` | `PwaClient:AppInsights:TelemetryId` and `WebClient:AppInsights:TelemetryId` |
| `az-storage-images-accountkey` | `StorageAccount:Images:Key` |
| `az-storage-functions-accountkey` | `StorageAccount:Functions:Key` |
| `mailgun-apikey` | `Mailgun:ApiKey` |
| `sendgrid-apikey` | `SendGrid:ApiKey` |
| `sqlconnection-servername` | `SqlConnection:ServerName` |
| `sqlconnection-databasename` | `SqlConnection:DatabaseName` |

To rotate, re-run with `-Force` (overwrites) then restart the API. Store, vault, and secret **names** are in [`infra/configuration/app-config.development.json`](../../../infra/configuration/app-config.development.json) (and the production catalog). Pass `-ConfigFile` for another Environment file.

### Hosted Azure SQL (Entra-only)

There is no SQL admin password and no Key Vault SQL login secrets. Access is:

1. **Before SQL** — create groups with [`New-DertInfoSqlEntraGroups.ps1`](../../../infra/scripts/Entra/New-DertInfoSqlEntraGroups.ps1). The server Entra admin is `dertinfo-sql-admins-<environment>`.
2. **After SQL** — a SQL Entra admin runs [`New-DertInfoSqlDbAccessUser.ps1`](../../../infra/scripts/Database/New-DertInfoSqlDbAccessUser.ps1) (ODBC `sqlcmd -G`, Entra MFA) to bind `dertinfo-sql-db-access-<environment>` (`CREATE USER ... FROM EXTERNAL PROVIDER` plus `db_datareader` / `db_datawriter` / `db_ddladmin`). That database user is for **people** in the group.
3. Add **operators** to the Entra groups (portal or `az ad group member add`). Do not add the App Service MI to the admins group. Do not expect the MI to log in via the access group — Azure SQL does not authorize managed identities through Entra group membership.
4. **After API infra CD** (site exists with system-assigned identity) — run [`New-DertInfoSqlAppServiceUser.ps1`](../../../infra/scripts/Database/New-DertInfoSqlAppServiceUser.ps1) to `CREATE USER` for the App Service name (`app-<dev|prd>-dertinfo-api-uks`) with the same roles. Then **restart** the App Service. Do this **before** (or immediately after) API Src CD; skipping it yields `Login failed for user '<token-identified principal>'` on `Migrate()` at startup.

Hosted App Configuration points `SqlConnection:ServerName` and `SqlConnection:DatabaseName` at Key Vault (obfuscation). There is still no SQL admin password. The API uses `Authentication=Active Directory Default` when `AZURE_APP_CONFIG` is set.

To revoke app access, drop or disable the App Service database user (or disable the site MI). To revoke operator access, remove the person from the admins or access group.

### Local SQL Express

Rotate the login in `infra/secrets/api.env` (`SqlConnection__ServerAdminName` / `ServerAdminPassword`) on your machine. That path is not used in Azure.

### Images storage account keys

New-stack Functions **host** storage (`st<env>dertinfofuncuks`) has shared keys **disabled**. Do not rotate or store keys for that account.

1. In Azure Portal, open the images storage account (`stdevdertinfoimagesuks` / `stprddertinfoimagesuks`).
2. Rotate the primary (or secondary) access key.
3. Update `az-storage-images-accountkey` in `kv-secrets.<environment>.json` and re-run [`New-DertInfoConfigKeyVaultSecrets.ps1`](../../../infra/scripts/Configuration/New-DertInfoConfigKeyVaultSecrets.ps1) `-Force`, or `az keyvault secret set`.
4. Restart the API.

Follow-up: Entra for images and App Configuration cleanup — [issue 115](https://github.com/dertinfo/dertinfo-mono/issues/115).

### Auth0 Management Client secret

1. Open the Auth0 tenant for the environment (dev / test / live).
2. Applications → **DertInfo – \<env\> – API Client** (Management / M2M style client used by the API).
3. Scroll to the danger zone → **Rotate Secret**.
4. Copy the new secret into Key Vault (`auth0-managementclientsecret`), for example [`New-DertInfoConfigKeyVaultSecrets.ps1`](../../../infra/scripts/Configuration/New-DertInfoConfigKeyVaultSecrets.ps1) `-Force`.
5. Restart the API.

![Auth0 applications list](https://github.com/user-attachments/assets/848852be-3858-4415-b1a3-c20c337b8dac)

![Rotate secret](https://github.com/user-attachments/assets/02f65d30-a881-4491-81d8-fd25d3e6ff72)

### SendGrid

Wiki note: account recovery / rotation may need provider support if the account was frozen (e.g. after secret scanning). Treat as follow-up if email is required in an environment.

## Related

- [Configuration](configuration.md)
- [Authentication](../subsystems/authentication.md)
- [`infra/secrets/README.md`](../../../infra/secrets/README.md)
