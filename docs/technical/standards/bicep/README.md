---
name: Bicep standards
type: standards
status: active
updated: 2026-10-17
---

# Bicep standards

House conventions for Azure Bicep in this monorepo. Follow these wherever you add or change templates under [`infra/bicep/`](../../../../infra/bicep/).

**Primary reference:** subscription policy composition [`infra/bicep/subscription/policy/main.bicep`](../../../../infra/bicep/subscription/policy/main.bicep) and the workload folders beside it (`config`, `monitoring`, `storage`, `api`, `web`, `app`). Cursor rule: [`.cursor/rules/bicep.mdc`](../../../../.cursor/rules/bicep.mdc).

Requires **Bicep CLI 0.44.1+** (extendable parameter files).

## Workload layout

Each RG-scoped workload lives under `infra/bicep/<part>/`, not under `apps/*/infra/bicep`.

```
infra/bicep/<part>/
  main.bicep
  main.shared.bicepparam    # using none
  main.dev.bicepparam       # using 'main.bicep' + extends shared
  main.prod.bicepparam      # environmentTag = prd
  <composition>/            # local module only when it adds real composition
    main.bicep              # or a named file such as sql.bicep
```

Same `main.bicep` for development and production. Leaf files override only what differs (`environmentTag`, SKUs, resource names).

## Section order in `main.bicep`

1. Parameters  
2. Variables  
3. References  
4. Resources  
5. Modules  
6. **AVM Modules**  
7. Outputs  

Use the comment banners already in the subscription and workload templates.

## Modules vs AVM Modules

- **AVM Modules** — call Azure Verified Modules (`br/public:avm/res/...`) **directly** from `main.bicep`. Pin the version (for example `:0.14.0`). Do not wrap a single AVM call in a local folder.
- **Modules** — local `.bicep` only when they add composition: multiple resources, shared logic, or **`existing` + `getSecret()`** that must not be evaluated unless a condition is true.

## Parameter files (`extends`)

```bicep
// main.shared.bicepparam
using none
param location = 'uksouth'
// PLACEHOLDER — supply via pipeline / CLI
param pipelinePrincipalIdApi = ''
// SECRET — supply via pipeline / CLI
param sqlAdminPassword = ''
```

```bicep
// main.dev.bicepparam
using 'main.bicep'
extends './main.shared.bicepparam'
param environmentTag = 'dev'
```

- `environmentTag` is `dev` or `prd` (never `prod`). See [env-acronyms](../../../../.cursor/rules/env-acronyms.mdc).
- Never commit secrets, subscription IDs, or principal IDs. Declare empty `// SECRET` / `// PLACEHOLDER` values.
- Non-secret SKUs, public names, and tags belong in shared or leaf files.

## `prerequisitesExist` (do not fail by design)

Workloads that **read or assign into another part** take `param prerequisitesExist bool = false` (default false in `main.shared.bicepparam`).

| Workload | Always deploys | Gated when `prerequisitesExist` is false |
|----------|----------------|------------------------------------------|
| config, monitoring | All resources | n/a |
| storage | Images Storage Account | See **Storage `flag*` params** below (not `prerequisitesExist`). |
| api | Nothing (empty success) | Plan, site, MI role assignments, App Config / Insights settings |
| web | Nothing (empty success) | Free Static Web App `swa-<env>-dertinfo-web-uks` in **westeurope** (`Microsoft.Web/staticSites` is not available in uksouth; RG stays uksouth). Requires hosted API `app-<env>-dertinfo-api-uks`. Custom domain bind is a second flag (`customDomainReady`) after DNS exists. |
| app | Nothing (empty success) | Free Static Web App `swa-<env>-dertinfo-app-uks` in **westeurope**. Same API prerequisite. Same `customDomainReady` pattern. |
| functions | Nothing (empty success) | Linux Flex Consumption plan (`FC1`), Function App, host storage, excess-use alerts, host-storage site MI roles. Requires images SA `st<env>dertinfoimagesuks` and Application Insights. Images data-plane and Event Grid live in storage Bicep. |

Put `existing` Key Vault / App Configuration / Application Insights and `getSecret()` **inside a local module** that is itself `if (prerequisitesExist)`. An unconditional `existing` in `main.bicep` makes ARM resolve the resource even when unused, and the deploy fails.

Set `prerequisitesExist` in the Bicep param file (`main.shared.bicepparam` or a leaf). Workflows do not detect or override it. Comment next to the param in `main.bicep` lists what must exist before you flip it.

## Storage `flag*` params

Storage has several independent gates, so it uses `flag` + PascalCase instead of a single `prerequisitesExist`:

| Param | Enables when true |
|-------|-------------------|
| `flagSqlServerIsReady` | Entra-only SQL server and database |
| `flagImagesFunctionAppReady` | Blob Data Contributor on the images account for Function App site MIs |
| `flagImagesEventGridReady` | Event Grid system topic and blob webhooks on the images account |

Flip each in the storage param file after the thing it names is ready. Workflows do not detect or override them.

## Naming and length limits

Pattern for most resources: `<type>-<env>-dertinfo-<part>-<rgn>` with `env` = `dev` \| `prd` and `rgn` = `uks`.

| Constraint | Limit | House choice |
|------------|-------|----------------|
| Key Vault | 3–24 characters, hyphens allowed | `kv-<env>-dertinfo-uks` (19). `kv-<env>-dertinfo-config-uks` is 26 — too long. |
| Storage Account | 3–24, **no hyphens** | `stdevdertinfoimagesuks` / `stprddertinfoimagesuks` (purpose in the name; other accounts may be added later) |
| App Configuration | 5–50 | `appcs-<env>-dertinfo-config-uks` |
| Log Analytics | 4–63 | `log-<env>-dertinfo-monitoring-uks` |
| Application Insights | | `appi-<env>-dertinfo-monitoring-uks` |
| SQL server | 1–63, globally unique | `sql-<env>-dertinfo-storage-uks` |
| SQL database | | `sqldb-<env>-dertinfo-storage-uks` |
| App Service plan / site | | `plan-<env>-dertinfo-api-uks` / `app-<env>-dertinfo-api-uks` |
| Function App plan / site | | `plan-<env>-dertinfo-functions-uks` / `func-<env>-dertinfo-functions-uks` (SKU **FC1**, Linux Flex Consumption) |
| Functions host storage | 3–24, **no hyphens** | `stdevdertinfofuncuks` / `stprddertinfofuncuks` |
| Static Web App | | `swa-<env>-dertinfo-web-uks` / `swa-<env>-dertinfo-app-uks` (name keeps estate `uks`; resource location is `westeurope`) |

Do not use `prod` in names.

## Secrets

- Key Vault must set AVM `enableVaultForTemplateDeployment: true` if a workload uses `getSecret()`. Hosted SQL does **not** use Key Vault credentials.
- Azure SQL is **Entra-only**. The server Entra admin is the `dertinfo-sql-admins-<environment>` group. The operator database principal is `dertinfo-sql-db-access-<environment>` (people). The hosted API needs a **separate** contained user for the App Service system-assigned identity (`app-<dev|prd>-dertinfo-api-uks`); group membership does not grant a managed identity a SQL login. Before SQL: [`New-DertInfoSqlEntraGroups.ps1`](../../../infra/scripts/Entra/New-DertInfoSqlEntraGroups.ps1). After SQL: [`New-DertInfoSqlDbAccessUser.ps1`](../../../infra/scripts/Database/New-DertInfoSqlDbAccessUser.ps1). After API infra: [`New-DertInfoSqlAppServiceUser.ps1`](../../../infra/scripts/Database/New-DertInfoSqlAppServiceUser.ps1). Do not commit group object ids.
- Storage `flagSqlServerIsReady` means the Entra admin group name, object id, and tenant id are set (pipeline vars / CLI), not that Key Vault SQL secrets exist. Do not create `sql-dertinfo-storage-administrator-login` / `-password`.
- The API uses `AZURE_APP_CONFIG` (store endpoint URI) and `DefaultAzureCredential` — not an App Configuration access key. Hosted SQL uses `Authentication=Active Directory Default`.
- Config Bicep deploys Key Vault and App Configuration only. Keys and Key Vault **references** come from [`infra/configuration/app-config.<environment>.json`](../../../infra/configuration/) via [`Import-DertInfoAppConfiguration.ps1`](../../../infra/scripts/Configuration/Import-DertInfoAppConfiguration.ps1). Secret values are set with [`New-DertInfoConfigKeyVaultSecrets.ps1`](../../../infra/scripts/Configuration/New-DertInfoConfigKeyVaultSecrets.ps1) from gitignored `kv-secrets.<environment>.json` (copy from `*.example`; not in Bicep).
- API infra assigns site MI roles via a **local module** scoped to the config RG (one nested deployment, `site-mi-config-roles`). Bicep cannot put those assignments in the API RG template (BCP139). The API workload SP gets a **custom role** (`dertinfo-api-config-nested-deploy-<env>`) with `Microsoft.Resources/deployments/read|write` and `operationStatuses/read` on config only — not Contributor.
- Functions infra assigns site MI **host-storage** roles in the functions RG. **Images** Blob Data Contributor and Event Grid system topic + blob webhooks are storage Bicep (`flagImagesFunctionAppReady` / `flagImagesEventGridReady`). The FUNCTIONS workload SP gets Contributor **only** on the functions RG, plus **Reader** on monitoring, and **conditioned UAA** on the functions RG (host-storage data-plane roles + `dertinfo-functionapp-stop-<env>`). No EventGrid Contributor, nested-deploy, or UAA on the storage RG. No Storage Account Key Operator.
- The STORAGE workload SP gets Contributor on the storage RG, **conditioned UAA** limited to Storage Blob Data Contributor (owner-assigns named site MIs), and a custom role on the functions RG (`dertinfo-storage-functions-listkeys-<env>`) with `Microsoft.Web/sites/read` and `sites/host/listkeys/action` so Event Grid can form `blobs_extension` webhook URLs. Incremental ARM does not remove leftover FUNCTIONS Reader / EventGrid Contributor / nested-deploy / UAA on storage — delete those in Azure if they remain.
- Excess-use protection lives in the functions RG: notify action group (email from GitHub Environment variable `AZURE_MONITOR_FUNCTIONS_EXCESSIVEUSE_EMAIL`), stop action group + Logic App, metric `OnDemandFunctionExecutionCount`. After a stop, an operator must start the app.
- The Flex Function App uses raw `Microsoft.Web/serverfarms` + `Microsoft.Web/sites@2024-04-01` (`functionAppConfig`). Do not use AVM `web/site` 0.24.0 for Flex. Host storage still uses AVM `storage-account` 0.33.0. Pass `networkAcls.defaultAction: Allow` (with `bypass: AzureServices`) on host and images accounts — AVM 0.33.0 otherwise sets Deny with an empty allow-list. Host storage sets `allowSharedKeyAccess: false` (identity-only; do **not** copy that onto images while the API still uses keys). Why that is the current bar (and why the pipeline SP must not get host-storage blob upload): [Security](../../subsystems/security.md). Hosted connections are identity-based (`AzureWebJobsStorage__accountName` / `StorageConnection__Images__accountName` — Linux Flex does not allow `:` in app setting names; `__` maps to `:` for the `StorageConnection:Images` blob trigger). Event Grid webhooks still use the Functions `blobs_extension` host key.
- Workload SPs get **Contributor on their own RG only**. Do not grant User Access Administrator by default. Cross-RG extras (subscription Bicep): API gets **Reader** on config and monitoring, plus **conditioned UAA** on config only (may assign/delete App Configuration Data Reader and Key Vault Secrets User), plus the nested-deploy custom role. Storage does **not** get roles on the config RG; it does get conditioned UAA on its own RG and listKeys on functions. Incremental ARM does not remove leftover storage Reader / Key Vault Secrets User on config — delete those in Azure if they remain.
- Web and app SPs also get a **subscription-scoped** custom role (`dertinfo-swa-operation-status-read-<env>`) with `Microsoft.Web/locations/operationResults/read` and `Microsoft.Web/locations/*/read`. Custom-domain bind is async; ARM polls at `/subscriptions/…/providers/Microsoft.Web/locations/<region>/…`, which RG Contributor cannot cover. Do not put `staticSitesOperationStatuses/read` on the role — it is not in the Microsoft.Web operations catalog (`InvalidActionOrNotAction`). Do not grant those SPs subscription Contributor.
- Resource providers are **not** in subscription Bicep. [Subscription infra CD](../../infra/cicd.md) registers them on the subscription before it deploys the template. Do not add a `Microsoft.Resources/providers` resource or a provider-namespace param. Local / break-glass: [`Register-DertInfoResourceProviders.ps1`](../../../infra/scripts/Subscription/Register-DertInfoResourceProviders.ps1).

## Pinning AVM

Pin versions in `main.bicep` / local modules. Bump deliberately and rebuild with `az bicep build --file infra/bicep/<part>/main.bicep`. Do not commit compiled `main.json` (`infra/bicep/**/*.json` is gitignored).

Current pins (this workstream):

| Module | Version |
|--------|---------|
| `avm/res/key-vault/vault` | 0.14.0 |
| `avm/res/app-configuration/configuration-store` | 0.9.3 |
| `avm/res/operational-insights/workspace` | 0.16.1 |
| `avm/res/insights/component` | 0.8.0 |
| `avm/res/storage/storage-account` | 0.33.0 |
| `avm/res/sql/server` | 0.22.0 |
| `avm/res/web/serverfarm` | 0.7.0 |
| `avm/res/web/site` | 0.24.0 (Windows API only; Flex Functions use raw `Microsoft.Web@2024-04-01`) |
| `avm/res/web/static-site` | 0.9.0 |
| `avm/res/authorization/role-assignment/rg-scope` | 0.1.1 |
| `avm/res/resources/resource-group` | 0.4.4 |

## Deploy locally (development)

Resource groups must already exist (subscription foundation). Example:

```bash
az deployment group create \
  --resource-group rg-dev-dertinfo-config-uks \
  --template-file infra/bicep/config/main.bicep \
  --parameters infra/bicep/config/main.dev.bicepparam
```

API: leave `prerequisitesExist` false until the prerequisites listed on that param in `main.bicep` exist, then set it true in the param file. Storage: flip `flagSqlServerIsReady` (Entra admin group ids from the pipeline), then `flagImagesFunctionAppReady` after the Function App exists, then `flagImagesEventGridReady` after Src CD.

Related: [CI/CD](../../infra/cicd.md), [configuration](../../infra/configuration.md), [hosting and cost](../../architecture/hosting-and-cost.md).
