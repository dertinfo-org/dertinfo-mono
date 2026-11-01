# Infra scripts

Operator scripts for Azure / Entra setup that are not Bicep and not local secrets.

## Start here

From this folder:

```powershell
.\Start-DertInfoControlPlane.ps1
```

The menu lists each script in a category folder that has comment-based help, shows what it does, collects parameters, and runs the one you confirm. Each option is labelled `Category > Script.ps1`. Files whose names start with `Shared-` are helpers and are not listed. Quit leaves the console as it is. You can still run any script directly.

Scripts are grouped by the resource they change. [`Start-DertInfoControlPlane.ps1`](Start-DertInfoControlPlane.ps1) stays in this folder. House style: [PowerShell standards](../../docs/technical/standards/powershell/).

### Configuration

App Configuration and Key Vault.

| Script | Purpose |
|--------|---------|
| [`Export-DertInfoAppConfiguration.ps1`](Configuration/Export-DertInfoAppConfiguration.ps1) | Export non-secret App Configuration keys to a gitignored JSON dump (`--skip-keyvault`, `--auth-mode login`) |
| [`Import-DertInfoAppConfiguration.ps1`](Configuration/Import-DertInfoAppConfiguration.ps1) | Dry-run (or `-Force`) apply catalog `keyValues` (optional dump via `-Path`), then set Key Vault references (`--auth-mode login`) |
| [`New-DertInfoConfigKeyVaultSecrets.ps1`](Configuration/New-DertInfoConfigKeyVaultSecrets.ps1) | **After config KV exists:** load catalog secret values from the gitignored secrets JSON (skip existing unless `-Force`) |
| [`Shared-DertInfoAppConfigCatalog.ps1`](Configuration/Shared-DertInfoAppConfigCatalog.ps1) | Shared helpers for the App Configuration catalog and gitignored secrets JSON. Dot-sourced by the import, export, and Key Vault secret scripts. Not run on its own |

### Database

Azure SQL.

| Script | Purpose |
|--------|---------|
| [`Copy-DertInfoSqlToDevelopment.ps1`](Database/Copy-DertInfoSqlToDevelopment.ps1) | **Operator refresh:** ARM-copy production SQL onto the development server, swap to the Bicep database name, bind DEV Entra users, then Continue or Revert |
| [`Copy-DertInfoSqlToProduction.ps1`](Database/Copy-DertInfoSqlToProduction.ps1) | **Production load:** ARM-copy live SQL onto the production server, swap to the Bicep database name, bind PRD Entra users, then Continue or Revert. Does not touch development |
| [`New-DertInfoSqlAppServiceUser.ps1`](Database/New-DertInfoSqlAppServiceUser.ps1) | **After API App Service exists:** bind the site system-assigned MI as its own database user (required for hosted API SQL) |
| [`New-DertInfoSqlDbAccessUser.ps1`](Database/New-DertInfoSqlDbAccessUser.ps1) | **After SQL:** bind the database access group as a database user (operators / people; ODBC sqlcmd `-G`) |

### Storage

Blob containers on the production images account.

| Script | Purpose |
|--------|---------|
| [`Copy-DertInfoImagesToProduction.ps1`](Storage/Copy-DertInfoImagesToProduction.ps1) | **After the Function App exists:** stop it, AzCopy the four image containers from each named source account onto `stprddertinfoimagesuks`, then start it. Does not enable Event Grid |

### Entra

App registrations and groups.

| Script | Purpose |
|--------|---------|
| [`New-DertInfoSqlEntraGroups.ps1`](Entra/New-DertInfoSqlEntraGroups.ps1) | **Before SQL:** create or reuse the two Entra groups; prints GitHub variable names |
| [`New-DertInfoSubscriptionOidcIdentities.ps1`](Entra/New-DertInfoSubscriptionOidcIdentities.ps1) | Create **isolated** Entra apps + service principals for subscription-scope GitHub Actions OIDC (`development` and `production`), apply federated credentials from [`infra/configuration/`](../configuration/), and grant Contributor + User Access Administrator on each subscription |
| [`New-DertInfoWorkloadOidcIdentities.ps1`](Entra/New-DertInfoWorkloadOidcIdentities.ps1) | Master: create all workload identities for **one** Environment / subscription; prints copy-paste GitHub variables |
| [`New-DertInfoWorkloadOidcIdentity.ps1`](Entra/New-DertInfoWorkloadOidcIdentity.ps1) | Create **one** workload identity (one Environment + one part). No subscription RBAC |
| [`Update-DertInfoSubscriptionOidcIdentities.ps1`](Entra/Update-DertInfoSubscriptionOidcIdentities.ps1) | Add the checked-in federated credential subject to **one** existing subscription OIDC app (`development` or `production`) |
| [`Update-DertInfoWorkloadOidcIdentities.ps1`](Entra/Update-DertInfoWorkloadOidcIdentities.ps1) | Add that subject to **every** existing workload OIDC app for one Environment |
| [`Update-DertInfoWorkloadOidcIdentity.ps1`](Entra/Update-DertInfoWorkloadOidcIdentity.ps1) | Add that subject to **one** existing workload OIDC app. No subscription RBAC |
| [`Remove-DertInfoSubscriptionOidcIdentity.ps1`](Entra/Remove-DertInfoSubscriptionOidcIdentity.ps1) | Tear down **one** subscription-scope identity by app (client) id |
| [`Remove-DertInfoWorkloadOidcIdentity.ps1`](Entra/Remove-DertInfoWorkloadOidcIdentity.ps1) | Tear down **one** workload identity by app (client) id |

### Subscription

Azure subscription resource providers.

| Script | Purpose |
|--------|---------|
| [`Register-DertInfoResourceProviders.ps1`](Subscription/Register-DertInfoResourceProviders.ps1) | Register workload resource providers (local / break-glass; keep in sync with the subscription CD reusable workflow) |

## Why two subscription apps (not one)

Subscription foundation must not use a **shared** service principal across development and production. A shared identity would hold privileged RBAC on both subscriptions and increase blast radius on a **public** monorepo. The create script always provisions **two** apps and scopes each to one subscription. Threat model: [GitHub workflows security review](../../docs/operations/security/github-workflows-security-review.md).

Workload identities are **one app per part per Environment** (`dertinfo-github-workload-<part>-development` / `-production`). They must not use the subscription SP (that identity has User Access Administrator on the subscription).

## Prerequisites

- Azure CLI (`az`) installed and logged in (`az login`)
- Rights to create app registrations (and, for the subscription script, assign roles on the target subscription)
- Run from **PowerShell** (avoids Git Bash `/subscriptions/...` path rewriting)

## Subscription OIDC identities

Full context: [GitHub Actions OIDC to Azure (federated credentials)](../../docs/technical/guides/github-azure-federated-credentials.md).

```powershell
cd C:\Projects\Cursor\DertInfo\infra\scripts

.\Entra\New-DertInfoSubscriptionOidcIdentities.ps1 `
  -DevSubscriptionId '<development-subscription-guid>' `
  -PrdSubscriptionId '<production-subscription-guid>'
```

The script prints the GitHub Environment **variables** to set on **`development`** and **`production`**. It does **not** remove older shared app registrations — use [`Remove-DertInfoSubscriptionOidcIdentity.ps1`](Entra/Remove-DertInfoSubscriptionOidcIdentity.ps1) after Environments point at the new client ids:

```powershell
.\Entra\Remove-DertInfoSubscriptionOidcIdentity.ps1 `
  -ClientId '<app-registration-client-id>'
```

The remove script prints display name, federated credential names, and each role/scope, then prompts for confirmation. Pass `-Force` to skip the prompt. Missing federated credentials, the service principal, or the app are skipped (safe to re-run).

## Add the organization repository credential

The create scripts skip a federated credential when its name already exists (`github-development` / `github-production`). After the move to `dertinfo-org/dertinfo-mono`, use the update scripts. Each run is one GitHub Environment. They show up in [`Start-DertInfoControlPlane.ps1`](Start-DertInfoControlPlane.ps1) as `Entra > Update-DertInfoSubscriptionOidcIdentities.ps1` and `Entra > Update-DertInfoWorkloadOidcIdentities.ps1`.

Run **development** and confirm `azure/login` before **production**:

```powershell
.\Entra\Update-DertInfoSubscriptionOidcIdentities.ps1 -GitHubEnvironment development
.\Entra\Update-DertInfoWorkloadOidcIdentities.ps1 -GitHubEnvironment development
```

Then the same two commands with `-GitHubEnvironment production`.

The subject comes from [`github-azure-dev-credential.json`](../configuration/github-azure-dev-credential.json) or [`github-azure-prd-credential.json`](../configuration/github-azure-prd-credential.json). The script does not create apps or change role assignments or GitHub variables. When the JSON name is already used by another subject, it adds a second credential and leaves the old one in place. An immutable subject `repo:dertinfo-org@347463852/...` is named `github-development-dertinfo-org-347463852` or `github-production-dertinfo-org-347463852`. A second run finds the new subject and does nothing. `-Force` skips the prompt.

## Workload OIDC identities

Run the **master** script once per Environment. It calls [`New-DertInfoWorkloadOidcIdentity.ps1`](Entra/New-DertInfoWorkloadOidcIdentity.ps1) for `config`, `monitoring`, `storage`, `api`, `web`, `app`, and `functions`.

```powershell
.\Entra\New-DertInfoWorkloadOidcIdentities.ps1 `
  -GitHubEnvironment development `
  -SubscriptionId '<development-subscription-guid>'

.\Entra\New-DertInfoWorkloadOidcIdentities.ps1 `
  -GitHubEnvironment production `
  -SubscriptionId '<production-subscription-guid>'
```

Copy the printed `AZURE_ENTRA_OIDC_*` names and values onto that GitHub Environment. Then re-run subscription infra CD so Bicep can grant each SP Contributor on its RG (plus the extra RG-scoped roles API needs).

Tear down one workload app:

```powershell
.\Entra\Remove-DertInfoWorkloadOidcIdentity.ps1 `
  -ClientId '<app-registration-client-id>'
```

## Entra-only Azure SQL groups

```powershell
.\Entra\New-DertInfoSqlEntraGroups.ps1 -GitHubEnvironment development
```

Run this **before** SQL exists. It only creates or reuses the two groups. Paste `AZURE_ENTRA_SQL_ADMIN_GROUP_NAME` and `AZURE_ENTRA_SQL_ADMIN_GROUP_OBJECTID` onto that GitHub Environment. Flip storage `flagSqlServerIsReady`, re-run storage infra CD, then bind the access group to the database:

```powershell
.\Database\New-DertInfoSqlDbAccessUser.ps1 -GitHubEnvironment development
.\Database\New-DertInfoSqlDbAccessUser.ps1 -GitHubEnvironment development -UserName 'someone@contoso.com'
```

Uses ODBC `sqlcmd -G` (SSMS Microsoft Entra MFA) against the user database, not master. `-UserName` defaults from `az account show`. Needs ODBC 17+ (`-G`); the ODBC 13 `sqlcmd` on PATH is not enough.

Add **operators** to `dertinfo-sql-db-access-<environment>` (portal or `az ad group member add`) when they need SQL. Do **not** add the App Service MI to that group expecting a login — Azure SQL does not treat managed identities as group members for authentication.

After **API infra CD** has created the site, bind the system-assigned identity as its own contained user (name = App Service name):

```powershell
.\Database\New-DertInfoSqlAppServiceUser.ps1 -GitHubEnvironment development
```

Then restart the App Service. `Login failed for user '<token-identified principal>'` means this user is missing (the Entra token is valid; SQL has no principal for that object ID). Repeat for production after that App Service exists (`-GitHubEnvironment production`).

## Copy production SQL onto development

Refreshes `sqldb-dev-dertinfo-storage-uks` from production data. Dest names match storage Bicep. Subscriptions are resolved by looking up those resource groups under `az login` (ids are not in the script). ARM copy; not a bacpac. Cross-subscription is expected (live/PRD in one subscription, development in another). The current `az account set` default does not matter; both subscriptions must appear in `az account list`.

You need: `az login` with visibility of the source and development storage RGs; rights to copy/rename/delete databases on the DEV SQL server and stop/start `app-dev-dertinfo-api-uks`; membership of `dertinfo-sql-admins-development` (group **member**, not only owner); a SQL firewall rule for your client IP (user bind uses ODBC `sqlcmd -G`). Do not run this from GitHub OIDC.

```powershell
.\Database\Copy-DertInfoSqlToDevelopment.ps1 -Source production
```

`-Source production` is new-stack PRD (`rg-prd-dertinfo-storage-uks` / `sql-prd-dertinfo-storage-uks` / `sqldb-prd-dertinfo-storage-uks`). Until that database exists, copy from old-stack live:

```powershell
.\Database\Copy-DertInfoSqlToDevelopment.ps1 -Source live `
  -SourceResourceGroup 'dertinfo-live-rg' `
  -SourceServer 'dertinfo-live-sqlsvr' `
  -SourceDatabase 'dertinfo-live-sqldb'
```

`-SourceServer` is the logical name. A FQDN (`….database.windows.net`) is accepted and stripped. Put the backtick at the **end** of a line to continue; do not write it immediately before `-SourceDatabase` (PowerShell then treats `-SourceDatabase` as the database name).

The script copies to `sqldb-dev-dertinfo-storage-uks-copy`, stops the DEV API, renames the current database to `…-old`, promotes the copy to `sqldb-dev-dertinfo-storage-uks`, then runs [`New-DertInfoSqlDbAccessUser.ps1`](Database/New-DertInfoSqlDbAccessUser.ps1) and [`New-DertInfoSqlAppServiceUser.ps1`](Database/New-DertInfoSqlAppServiceUser.ps1) for **development**. Each bind uses `sqlcmd -G` (Entra MFA), not `az login`. A browser or Windows sign-in window **will appear** (often **behind** Cursor). Complete MFA for each of the two scripts; do not Ctrl+C while waiting. After bind it starts the API.

Smoke-test Swagger (`https://app-dev-dertinfo-api-uks.azurewebsites.net/swagger/index.html`), then type **Continue** (delete `…-old`) or **Revert** (swap back and delete the copy). There is no default. Copied live Auth0 user ids will not match the development tenant (`dertinfotest`); treat this as a data/schema check.

Copy does not need Allow Azure services. User bind comes from your machine, so keep an administrator firewall rule. Future network lock-down: [issue 118](https://github.com/dertinfo/dertinfo-mono/issues/118).

## Copy live SQL onto production

Loads `sqldb-prd-dertinfo-storage-uks` from the old live database. Dest names match storage Bicep. The development server is not read or written. The script refuses a source whose `database_size` is over the Basic 2 GB cap. Default source is `dertinfo-live-rg` / `dertinfo-live-sqlsvr` / `dertinfo-live-sqldb`.

```powershell
.\Database\Copy-DertInfoSqlToProduction.ps1
```

When `app-prd-dertinfo-api-uks` exists, the script stops it for the rename, binds the production access user and the App Service user, and starts it again. Type **Continue** to delete the previous production database, or **Revert** to put it back. Guide: [Production environment setup](../../docs/technical/guides/production-environment-setup.md).

## Copy images onto production

Stops `func-prd-dertinfo-functions-uks`, copies `groupimages`, `eventimages`, `sheetimages`, and `defaultimages` from each source account onto `stprddertinfoimagesuks`, then starts the Function App. Run `azcopy login` first. Pass every original account name, including a separate Eventbrite account when that store is not one of the others. The script does not set `flagImagesEventGridReady`.

```powershell
.\Storage\Copy-DertInfoImagesToProduction.ps1 -SourceStorageAccount 'myimagesaccount','myeventbriteaccount'
```

## Hosted API Key Vault secrets and App Configuration

Catalog JSON (store, vault, secret **names**, Key Vault references, optional non-secret `keyValues` — never secret values): [`infra/configuration/app-config.development.json`](../configuration/app-config.development.json) / [`app-config.production.json`](../configuration/app-config.production.json). Pass `-ConfigFile` to use another file; the scripts do not need editing per Environment.

After config infra CD has created the vault, copy the example secrets file, fill empty values, then load them into Key Vault:

```powershell
Copy-Item ..\configuration\kv-secrets.development.json.example `
  ..\configuration\kv-secrets.development.json
# Edit the secrets JSON, then:
.\Configuration\New-DertInfoConfigKeyVaultSecrets.ps1 -GitHubEnvironment development
```

The script reads values from `kv-secrets.<environment>.json` (gitignored) and skips names that already exist unless `-Force`. It does not prompt.

Apply catalog `keyValues` into the store (dry-run until `-Force`), then write Key Vault references so URIs target this Environment’s vault:

```powershell
.\Configuration\Import-DertInfoAppConfiguration.ps1 -GitHubEnvironment development
.\Configuration\Import-DertInfoAppConfiguration.ps1 -GitHubEnvironment development -Force
```

Uses `--auth-mode login` (Entra) on export and import. You need **App Configuration Data Owner** on the config RG; the CLI does not use store access keys. Key Vault secret load uses the same `az login` (vault RBAC).

Optional: import a dump first with `-Path` (gitignored exports; do not commit account keys). Do not use `--resolve-keyvault`.

Related artefacts:

- Federated credential JSON: [`infra/configuration/`](../configuration/)
- Subscription foundation: [CI/CD](../../docs/technical/infra/cicd.md) and [GitHub Actions OIDC](../../docs/technical/guides/github-azure-federated-credentials.md). A disallowed-SKU deny is still unchecked: [issue 126](https://github.com/dertinfo/dertinfo-mono/issues/126).
- Security review: [github-workflows-security-review.md](../../docs/operations/security/github-workflows-security-review.md)
