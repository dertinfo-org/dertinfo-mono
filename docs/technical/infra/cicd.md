# CI/CD

How continuous integration and deployment are organised in the DertInfo monorepo.

Completed CD migration work is recorded in the [change log](changelogs/README.md) (see [2026-07-03 GitHub Actions CD pipelines](changelogs/2026-07-03-001-github-actions-cd-pipelines.md)).

## Overview

| Concern | Workflows | Trigger |
|---------|-----------|---------|
| **CI** (build, test, lint) | `*-src-ci.yml` | Pull requests **into `main`** (path-filtered). GitHub Flow — no `develop` branch. Temporary: `workflow_dispatch` ([remove later](https://github.com/dertinfo/dertinfo-mono/issues/116)). |
| **Src CD** (app deploy + Docker Hub) | `*-src-cd.yml` | Push to **`main`** after merge (path-filtered). Temporary: `workflow_dispatch` with `target` `full` or `dev-only` (default **`dev-only`**) so we can deploy while testing Azure settings ([remove later](https://github.com/dertinfo/dertinfo-mono/issues/116)). |
| **Infra CD** (Bicep) | `*-infra-cd.yml`, `subscription-infra-cd.yml` | Push to **`main`** after merge (path-filtered), plus `workflow_dispatch` (`full` / `dev-only`, default **`full`**) for Bicep re-runs without template diffs. |

Each `*-src-cd.yml` builds and deploys that app, and publishes its local Docker image. GitHub Actions is the deploy path. The old Azure DevOps YAML has been removed from this repo.

## Environments

**New stack** (this monorepo) uses GitHub Environments **`development`** and **`production`**, matching Azure tags `dev` / `prd`. Live traffic today is still deployed from **separate repositories + Azure DevOps**; these Environments are the GitHub Actions + Bicep path.

| GitHub Environment | Azure tag | Typical RG prefix |
|--------------------|-----------|-------------------|
| `development` | `dev` | `rg-dev-dertinfo-*-uks` |
| `production` | `prd` | `rg-prd-dertinfo-*-uks` |

Each Environment has its **own** Entra app (OIDC) and subscription id. Both require approval from `dertinfo` or `davidsmonkeys` before deploy jobs run.

OIDC and naming for the older ADO-mapped `test` / `prod` Environments are historical; new workflows do not use them. See [GitHub Actions OIDC](../guides/github-azure-federated-credentials.md).

### ADO → GitHub mapping

Naming follows `[SERVICEPROVIDER]_[SERVICETYPE]_[WORKLOADNAME]_[DESCRIPTION]_[TARGETENV]` — see [naming convention](#naming-convention) below. `STG` maps to GitHub environment **`test`**; `PRD` maps to **`prod`**.

| Layer | GitHub (`test`) | ADO |
|-------|-----------------|-----|
| API App Service | `AZURE_WEBAPP_API_RESOURCENAME_STG` (variable) | `CD_Pipeline.TestEnvApiWebAppName` |
| Functions App | `AZURE_FUNCTIONAPP_FUNCTIONS_RESOURCENAME_STG` (variable) | `DertInfoImageResizeV4_VariablesGroup.FunctionAppName_Stg` |
| Web SWA deploy token | `AZURE_STATICWEBAPP_WEB_DEPLOYTOKEN_STG` (secret) | `staging_deployment_token` |
| App SWA deploy token | `AZURE_STATICWEBAPP_APP_DEPLOYTOKEN_STG` (secret) | `staging_deployment_token` |
| Angular build | `npm run build:hosted` + runtime `app.config.json` | GitHub CD injects API/callback per Environment |
| Hosted URLs | `staging.dertinfo.co.uk`, etc. | unchanged |

### `prod` placeholders (not wired yet)

| Kind | Name | ADO source |
|------|------|------------|
| Variable | `AZURE_WEBAPP_API_RESOURCENAME_PRD` | `LiveEnvApiWebAppName` |
| Variable | `AZURE_FUNCTIONAPP_FUNCTIONS_RESOURCENAME_PRD` | `FunctionAppName_Prod` |
| Secret | `AZURE_STATICWEBAPP_WEB_DEPLOYTOKEN_PRD` | `live_deployment_token` |
| Secret | `AZURE_STATICWEBAPP_APP_DEPLOYTOKEN_PRD` | `live_deployment_token` |

Reusable deploy workflows accept an `environment` input (`development` \| `production`).

Callers that use reusable workflows and need repository secrets must set `secrets: inherit` (or pass secrets explicitly). Secrets are not available inside `workflow_call` jobs by default.

## Workflows

### Reusable templates (`.github/workflows/reusable-src-*.yml` / `reusable-infra-*.yml`)

GitHub requires reusable workflows at the **top level** of `.github/workflows/` (not in a subfolder).

| Workflow | Purpose |
|----------|---------|
| `reusable-src-build-push-docker.yml` | Build and push to Docker Hub (`latest-dev` / `{run_id}-dev` for `development`; `latest` / `{run_id}` for `production`) |
| `reusable-src-deploy-dotnet-appservice.yml` | OIDC login (`azure_oidc_workload` → `CLIENTID_WORKLOAD_*`) + zip/folder deploy to **API** App Service (`azure/webapps-deploy`) |
| `reusable-src-deploy-functionapp.yml` | OIDC login + **One Deploy** to Flex Consumption Function Apps (`Azure/functions-action@v1`). Do not use `webapps-deploy` for Functions. Upload identity and host-storage firewall: [Security](../subsystems/security.md). |
| `reusable-src-deploy-static-web-app.yml` | Download prebuilt SPA artefact, write `assets/app.config.json` from Environment variables, deploy to Azure Static Web Apps (`skip_app_build`) |
| `reusable-src-deploy-static-web-app.yml` | Download prebuilt SPA artefact, write `assets/app.config.json` from Environment variables, deploy to Azure Static Web Apps (`skip_app_build`) |
| `reusable-infra-deploy-bicep-resourcegroup.yml` | OIDC (`azure_oidc_workload` → `CLIENTID_WORKLOAD_*`) + `az deployment group create` (workload infra) |
| `reusable-infra-deploy-bicep-subscription.yml` | OIDC (`CLIENTID_SUBSCRIPTION`) + register resource providers + `az deployment sub create` (subscription foundation) |

### Infrastructure CD

| Workflow | Scope | Notes |
|----------|-------|-------|
| `subscription-infra-cd.yml` | Subscription | Privileged SP **per Environment**; **this pipeline registers resource providers on the subscription**, then deploys RGs + policy + RBAC. Identity setup is [GitHub Actions OIDC](../guides/github-azure-federated-credentials.md). Showing that policy denies a disallowed SKU is [issue 126](https://github.com/dertinfo/dertinfo-mono/issues/126). |
| `config-infra-cd.yml` | `rg-<env>-dertinfo-config-uks` | Key Vault + App Configuration (including labelled Key Vault references for four API secrets) |
| `monitoring-infra-cd.yml` | `rg-<env>-dertinfo-monitoring-uks` | Log Analytics (1 GB/day) + Application Insights |
| `storage-infra-cd.yml` | `rg-<env>-dertinfo-storage-uks` | Images SA always; Entra-only SQL when `flagSqlServerIsReady` is true (passes `AZURE_ENTRA_SQL_ADMIN_GROUP_*` and tenant id). Images Blob Data Contributor when `flagImagesFunctionAppReady` (pipeline looks up the Function App site MI from `AZURE_FUNCTIONAPP_FUNCTIONS_RESOURCENAME`). Event Grid system topic + blob webhooks when `flagImagesEventGridReady` after Src CD. After subscription CD, delete leftover storage-SP Reader and Key Vault Secrets User on the config RG, and leftover FUNCTIONS Reader / EventGrid Contributor / nested-deploy / UAA on the storage RG (incremental ARM will not drop them). |
| `api-infra-cd.yml` | `rg-<env>-dertinfo-api-uks` | Windows App Service when `prerequisitesExist` is true. Site MI roles on config are one nested deployment (`site-mi-config-roles`); the API SP needs the nested-deploy custom role on config (subscription CD). |
| `web-infra-cd.yml` | `rg-<env>-dertinfo-web-uks` | Free Static Web App in **westeurope** (not uksouth — `Microsoft.Web/staticSites` is not available there). RG stays uksouth. Created when `prerequisitesExist` is true (hosted API `app-<env>-dertinfo-api-uks` must exist). Custom-domain bind needs the subscription custom role `dertinfo-swa-operation-status-read-<env>` (OIDC `WEB`). |
| `app-infra-cd.yml` | `rg-<env>-dertinfo-app-uks` | Same pattern as web. Names `swa-<env>-dertinfo-app-uks`. OIDC `APP`. Same SWA operation-status role. |
| `functions-infra-cd.yml` | `rg-<env>-dertinfo-functions-uks` | Linux **Flex Consumption (FC1)** Function App when `prerequisitesExist` is true. Host storage + host-storage site MI roles + excess-use alerts. Notify email from Environment variable `AZURE_MONITOR_FUNCTIONS_EXCESSIVEUSE_EMAIL` (fail if empty). Images Blob Data Contributor and Event Grid are **storage** infra CD (`flagImagesFunctionAppReady` / `flagImagesEventGridReady`). |

**Resource providers:** [`subscription-infra-cd.yml`](../../../.github/workflows/subscription-infra-cd.yml) (via [`reusable-infra-deploy-bicep-subscription.yml`](../../../.github/workflows/reusable-infra-deploy-bicep-subscription.yml)) is what applies them to the Azure subscription. After OIDC login it runs `az provider register` for each namespace in that workflow’s bash array, then deploys the subscription Bicep. The list is not in Bicep. Workload infra CD does not register providers (those identities are RG Contributor only). Local / break-glass: [`Register-DertInfoResourceProviders.ps1`](../../../infra/scripts/Subscription/Register-DertInfoResourceProviders.ps1) (keep in sync with the reusable workflow).

Bicep house rules: [Bicep standards](../standards/bicep/). Operator scripts: [`infra/scripts/`](../../../infra/scripts/).

Source CI workflows, source CD workflows, and the Docker build reusable workflow set `permissions: contents: read` for `GITHUB_TOKEN`. That is the checkout, fetch, and same-workflow artifact scope. A job that signs in to Azure keeps its own block (`id-token: write` and `contents: read`), which replaces the workflow default for that job. Static Web App deploy jobs also set `actions: read`. [Assigning permissions to jobs](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs).

### Per-app src CD

| Workflow | Build | Docker image | Deploy target |
|----------|-------|--------------|---------------|
| `api-src-cd.yml` | .NET `win-x86` publish; unit tests **gate** deploy | `dertinfo/dertinfo-api` | New-stack API App Service (`development` then gated `production`) |
| `web-src-cd.yml` | One `npm run build:hosted`; CD writes `app.config.json` per Environment | `dertinfo/dertinfo-web` | Static Web App (`development` / `production`) — needs SWA tokens and callback URL var |
| `app-src-cd.yml` | One `npm run build:hosted`; CD writes `app.config.json` per Environment | `dertinfo/dertinfo-app` | Static Web App (`development` / `production`) — needs SWA tokens and callback URL var |
| `functions-src-cd.yml` | .NET publish | `dertinfo/dertinfo-imageresizev4` | Flex Function App via One Deploy (`development` / `production`) — needs `AZURE_FUNCTIONAPP_FUNCTIONS_RESOURCENAME`. Upload identity is the site MI ([Security](../subsystems/security.md)). The build artefact must include hidden files (`include-hidden-files: true`) so `.azurefunctions` survives `upload-artifact@v4`; Flex rejects the zip without it. |

API source CI (`api-src-ci.yml`) runs the `dertinfo-api.itests` assembly on `ubuntu-latest` against a SQL Server service container. The image tag matches root [`docker-compose.yml`](../../../docker-compose.yml) (`mcr.microsoft.com/mssql/server:2025-CU9-ubuntu-24.04`). The job sets `ASPNETCORE_ENVIRONMENT=Development` and `SqlConnection__*` so startup uses SQL authentication and trusts the container certificate (`Startup` adds `TrustServerCertificate` only when the environment is Development). A collection fixture starts the API once, which migrates, then inserts the event, groups, and image rows that ship in that test project. Authenticated cases send a token signed in the test host from the persona claims in that project. The test host trusts that token’s signing key; the API process outside the test host still validates Auth0. The job does not call Auth0, and it does not run the website or app Playwright suite. A failed integration-test job fails the workflow. API source CD does not repeat it. On a pull request, the `up-to-date` job fails unless the pull request head already contains every commit on `main`, and `build` waits for that job. The container `sa` password is a throwaway value for that job; it is not a hosted credential.

Docker images are for **local development** (root `docker-compose.yml`, Codespaces). Hosted Azure deployments use native App Service / SWA deploy, not containers.

After API infra exists, create the site’s SQL contained user **before** expecting Swagger to work ([Secrets and rotation — hosted Azure SQL](secrets-and-rotation.md#hosted-azure-sql-entra-only)). Development Swagger: `https://app-dev-dertinfo-api-uks.azurewebsites.net/swagger/index.html`.

Hosted API sites use `ASPNETCORE_ENVIRONMENT=Production`. The development store’s App Configuration label stays `Development` via `AZURE_APP_CONFIG_LABEL`. Deploy **API src CD before API infra CD** when that split changes: an older API build treats `ASPNETCORE_ENVIRONMENT` as the label and will miss the development keys if infra flips the runtime first. See [Configuration](configuration.md#hosted-api-runtime-and-app-configuration-label).

### SPA runtime config (web / app)

`web-src-cd.yml` and `app-src-cd.yml` run **one** `npm run build:hosted` (`ng build --configuration production`) and upload the `dist` artefact. Each Environment deploy overwrites `assets/app.config.json` then publishes with `skip_app_build`:

| Field | Source |
|-------|--------|
| `apiUrl` | `https://<AZURE_WEBAPP_API_RESOURCENAME>.azurewebsites.net/api` |
| `allowedDomains` | `<AZURE_WEBAPP_API_RESOURCENAME>.azurewebsites.net` |
| `auth0CallbackUrl` | `AZURE_STATICWEBAPP_WEB_CALLBACKURL` or `AZURE_STATICWEBAPP_APP_CALLBACKURL` (no trailing slash) |

Local `ng serve` keeps the checked-in `src/assets/app.config.json`. Docker still patches the same file at container start (`docker-launch.sh`).


## GitHub setup checklist

Complete these steps in the GitHub repository **before the first CD run**.

### 0. Protect `main` (GitHub Flow)

CI on a PR does not block merge by itself. On `main`, require a pull request and require the relevant `*-src-ci.yml` job names to pass (and be up to date) before merge.

Path-filtered CI jobs are **skipped** when the PR does not touch those paths. Prefer a ruleset that treats skipped checks as non-blocking, or do not mark a path-specific job as required unless every PR is expected to run it.

Branching rule: [`.cursor/rules/github-flow.mdc`](../../../.cursor/rules/github-flow.mdc). Guide: [Contributing workflow](../guides/contributing-workflow.md).

### 1. Create GitHub Environments

- **`development`** and **`production`** — required for new-stack infra and app CD
- Set Environment-scoped `AZURE_ENTRA_OIDC_CLIENTID_SUBSCRIPTION`, `AZURE_ENTRA_OIDC_TENANTID`, `AZURE_SUBSCRIPTION_DEPLOY_SUBSCRIPTIONID`
- Set per-workload `AZURE_ENTRA_OIDC_CLIENTID_WORKLOAD_<PART>` and `AZURE_ENTRA_OIDC_PRINCIPALID_WORKLOAD_<PART>` (paste from [`New-DertInfoWorkloadOidcIdentities.ps1`](../../../infra/scripts/Entra/New-DertInfoWorkloadOidcIdentities.ps1))
- After [`New-DertInfoSqlEntraGroups.ps1`](../../../infra/scripts/Entra/New-DertInfoSqlEntraGroups.ps1): `AZURE_ENTRA_SQL_ADMIN_GROUP_NAME` and `AZURE_ENTRA_SQL_ADMIN_GROUP_OBJECTID` (storage infra CD). Keep `AZURE_ENTRA_SQL_DBACCESS_GROUP_*` for operator scripts; do not commit object ids.
- Set `AZURE_WEBAPP_API_RESOURCENAME` = `app-<env>-dertinfo-api-uks` after API infra exists (SPA CD derives `https://<name>.azurewebsites.net/api`)
- After Functions infra exists: `AZURE_FUNCTIONAPP_FUNCTIONS_RESOURCENAME` = `func-<env>-dertinfo-functions-uks` (no `_DEV` suffix)
- Before Functions infra CD: Environment **variable** `AZURE_MONITOR_FUNCTIONS_EXCESSIVEUSE_EMAIL` (one address, or comma-separated). Not a secret; not Key Vault / App Configuration.
- `AZURE_ENTRA_OIDC_CLIENTID_WORKLOAD_FUNCTIONS` is already set on Environment `development`. Confirm `AZURE_ENTRA_OIDC_PRINCIPALID_WORKLOAD_FUNCTIONS` as well (subscription CD uses the principal id). Repeat client id, principal id, notify email, and resource name on `production` before PRD.
- After web/app SWAs exist and custom hosts resolve: `AZURE_STATICWEBAPP_WEB_CALLBACKURL` = `https://dev.dertinfo.co.uk` and `AZURE_STATICWEBAPP_APP_CALLBACKURL` = `https://app-dev.dertinfo.co.uk` on Environment `development` (no trailing slash). Do not use the default `*.azurestaticapps.net` hostname once those custom domains are bound.
- SWA tokens: `AZURE_STATICWEBAPP_WEB_DEPLOYTOKEN_DEV` / `_PRD` (and the `APP` equivalents) from each site’s **apiKey** (never stored in Bicep or App Configuration)

### First development SWA deploy (operator)

Do **web and app in parallel**. Production custom domains and production src deploy stay a later pass (`dev-only` only). Confirm `AZURE_ENTRA_OIDC_CLIENTID_WORKLOAD_WEB` and `…_APP` on Environment `development`. If OIDC fails, re-run subscription CD with `pipelinePrincipalIdWeb` / `pipelinePrincipalIdApp`.

1. Confirm the hosted API is up (`https://app-dev-dertinfo-api-uks.azurewebsites.net`). DEV leaves already set `prerequisitesExist = true`.
2. Run **Web infra CD** and **App infra CD** with target **`dev-only`**.
3. From each deployment output (or the portal), copy **defaultHostname** (for DNS) and the SWA **apiKey** into secrets `AZURE_STATICWEBAPP_WEB_DEPLOYTOKEN_DEV` and `AZURE_STATICWEBAPP_APP_DEPLOYTOKEN_DEV`.
4. Create DNS: `dev.dertinfo.co.uk` and `app-dev.dertinfo.co.uk` CNAME (and any TXT Azure shows) to those default hostnames. Set `customDomainReady = true` in both `main.dev.bicepparam` files. Run **subscription infra CD** `dev-only` first so WEB and APP get `dertinfo-swa-operation-status-read-dev` (ARM polls custom-domain status at subscription/location scope; RG Contributor is not enough). Then re-run both web/app infra CD (or bind in the portal). Wait until SWA-managed TLS shows the custom domain ready. If policy denies the child type, add `Microsoft.Web/staticSites/customDomains` (already in the subscription allow-list) and re-run subscription CD.
5. GitHub Environment **`development` variables:** `AZURE_STATICWEBAPP_WEB_CALLBACKURL` = `https://dev.dertinfo.co.uk`, `AZURE_STATICWEBAPP_APP_CALLBACKURL` = `https://app-dev.dertinfo.co.uk`, `AZURE_WEBAPP_API_RESOURCENAME` = `app-dev-dertinfo-api-uks`.
6. Auth0 tenant **`dertinfotest.eu.auth0.com`**: configure the **website** and **PWA** applications separately (different client ids). Exact URLs: [Authentication](../subsystems/authentication.md#hosted-development-auth0-application-urls). Push catalog callbacks and `Cors:AllowedOrigins` into App Configuration ([`Import-DertInfoAppConfiguration.ps1`](../../../infra/scripts/Configuration/Import-DertInfoAppConfiguration.ps1) `-Force`, or set the same keys in the portal) and restart the API.
7. Run **Web Src CD** and **App Src CD** with target **`dev-only`**. Do not src-deploy until DNS resolves and TLS is ready.

**Development first-pass status (2026-09-19):** steps 1–7 are **done**. Website (`https://dev.dertinfo.co.uk`) and PWA (`https://app-dev.dertinfo.co.uk`) serve from Src CD; login, page refresh, and sign-out work on both. Changelog: [2026-09-19-002](../../operations/changelogs/2026-09-19-002-dev-swa-first-pass.md). Custom-domain bind needed the subscription role in [2026-09-19-001](../../operations/changelogs/2026-09-19-001-swa-operation-status-rbac.md).

Auth0 tenant names vs GitHub Environments: [Authentication](../subsystems/authentication.md). Tenant rename is [issue 117](https://github.com/dertinfo/dertinfo-mono/issues/117), not this deploy.

### First development Functions deploy (operator)

Templates and workflows are in the repo. You run Azure and GitHub. Do this in order after merge to `main`.

**Before the first DEV deploy**

1. Confirm GitHub Environment `development` has `AZURE_ENTRA_OIDC_PRINCIPALID_WORKLOAD_FUNCTIONS` (`AZURE_ENTRA_OIDC_CLIENTID_WORKLOAD_FUNCTIONS` is already set).
2. Set Environment **variable** `AZURE_MONITOR_FUNCTIONS_EXCESSIVEUSE_EMAIL` on `development`.
3. Confirm Flex Consumption exists in **uksouth**: `az functionapp list-flexconsumption-locations`.
4. Confirm `stdevdertinfoimagesuks` and `appi-dev-dertinfo-monitoring-uks` still exist.

**DEV**

5. Run **Subscription infra CD** `dev-only` and approve. Wait until `rg-dev-dertinfo-functions-uks` exists and the FUNCTIONS SP is Contributor plus the extras in [Bicep standards](../standards/bicep/README.md) (monitoring Reader; functions-RG conditioned UAA). Storage SP gets conditioned UAA on the storage RG and listKeys on the functions RG.
6. Run **Functions infra CD** `dev-only`. Approve.
7. Set `AZURE_FUNCTIONAPP_FUNCTIONS_RESOURCENAME` = `func-dev-dertinfo-functions-uks`.
8. Set `flagImagesFunctionAppReady = true` in [`infra/bicep/storage/main.dev.bicepparam`](../../../infra/bicep/storage/main.dev.bicepparam), merge, run **Storage infra CD** `dev-only` (assigns Blob Data Contributor on the images account to the Function App site MI).
9. Run **Functions Src CD** `dev-only`. Approve. If you get `InaccessibleStorageException` / blob 403, see [Security](../subsystems/security.md#flex-one-deploy-identity). If One Deploy reports a missing `.azurefunctions` directory, the artefact dropped hidden files — `functions-src-cd.yml` must set `include-hidden-files: true` on `upload-artifact@v4`.
10. Set `flagImagesEventGridReady = true` in [`infra/bicep/storage/main.dev.bicepparam`](../../../infra/bicep/storage/main.dev.bicepparam), merge, run **Storage infra CD** `dev-only` again (Event Grid webhook handshake needs a **running** host).
11. Upload one blob to `stdevdertinfoimagesuks` / `groupimages/originals` and confirm `100x100` and `480x360`. Confirm the notify action group shows the email.
12. If a cost-stop fires in testing, **start the Function App again** in the portal. It stays stopped until an operator starts it.

**PRD (only after DEV smoke test works)**

Production order — identities, pipelines, configuration, SQL and image data, the Azure-hostname test, then DNS — is [Set up the production environment](../guides/production-environment-setup.md). Follow that guide rather than a shorter list here.

Cleanup of leftover App Configuration / Key Vault / GitHub items is a **next** step: [issue 115](https://github.com/dertinfo/dertinfo-mono/issues/115).

## Functions infrastructure reference (`test`)

Legacy ADO variable group `DertInfoImageResizeV4_Infrastucture_Staging_VariablesGroup` (old Windows Y1 app on `dertinfotestimagessa`). **New-stack** Functions infra is [`functions-infra-cd.yml`](../../../.github/workflows/functions-infra-cd.yml) against `stdevdertinfoimagesuks` / `stprddertinfoimagesuks`. Do not Event-Grid the old test/live image accounts.

| Variable | Value |
|----------|-------|
| `resourceGroupName` | `di-rg-imageresizev4-stg` |
| `location` | `uksouth` |
| `ownerInitials` | `di` |
| `workloadName` | `imageresizev4` |
| `environmentTag` | `stg` |
| `imagesStorageAccountName` | `dertinfotestimagessa` |
| `imagesStorageAccountResourceGroupName` | `dertinfo-test-rg` |
| `applicationInsightsName` | `dertinfo-test-ais` |
| `applicationInsightsResourceGroupName` | `di-rg-monitoring-stg` |
| `excessiveUseActionGroupName` | `di-agrp-excessiveuse-stg` |
| `excessiveUseActionGroupResourceGroupName` | `di-rg-monitoring-stg` |

### 2. Azure OIDC (recommended)

GitHub Actions signs in to Azure with **OIDC federated credentials** (no client secret). The token **subject must match the job’s GitHub Environment** (for example `repo:dertinfo/dertinfo-mono:environment:development`), not only a branch ref.

**New-stack Environments (`development` / `production`):** apply the checked-in JSON in [`infra/configuration/`](../../../infra/configuration/) via [`New-DertInfoSubscriptionOidcIdentities.ps1`](../../../infra/scripts/Entra/New-DertInfoSubscriptionOidcIdentities.ps1) (subscription foundation) and [`New-DertInfoWorkloadOidcIdentities.ps1`](../../../infra/scripts/Entra/New-DertInfoWorkloadOidcIdentities.ps1) (one Environment at a time) as described in [GitHub Actions OIDC to Azure](../guides/github-azure-federated-credentials.md). Do **not** use `AZURE_ENTRA_OIDC_CLIENTID_SUBSCRIPTION` for workload infra or Src CD.

**Existing app CD (`test` / `prod`):** create an Entra app registration per environment with a federated credential (same issuer and audience; subject `…:environment:test` or `…:environment:prod`). Grant the app **Contributor** on the target resource group(s) or individual web apps.

On the GitHub **`test`** environment, set **variables**:

| Variable | Description |
|----------|-------------|
| `AZURE_ENTRA_OIDC_CLIENTID_STG` | App registration client ID |
| `AZURE_ENTRA_OIDC_TENANTID_STG` | Entra tenant ID |
| `AZURE_SUBSCRIPTION_DEPLOY_SUBSCRIPTIONID_STG` | Test subscription ID (`9ee4f83c-a9a6-41a0-822d-13e18dc6c648` from ADO) |

Repeat for **`prod`** with `_PRD` names and the DertInfo subscription when production deploy is enabled.

### 3. Variables and secrets

Use **variables** for non-sensitive configuration (visible in workflow logs and the GitHub UI). Use **secrets** only for tokens, passwords, and deployment keys.

#### Naming convention

Use **UPPER_SNAKE_CASE** with this pattern for Azure (and similar cloud) values:

```
[SERVICEPROVIDER]_[SERVICETYPE]_[WORKLOADNAME]_[DESCRIPTION]_[TARGETENV]
```

- **Target env:** three-letter acronym only — `STG` for GitHub environment `test` (ADO staging); `DEV` for development; `PRD` for production. **Never `PROD`.** See [`.cursor/rules/env-acronyms.mdc`](../../../.cursor/rules/env-acronyms.mdc).
- **Third-party, non-env-specific** accounts (e.g. Docker Hub) may use `[PROVIDER]_[DESCRIPTION]` — `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.

Avoid prefixing names with `TEST_` or suffixing with `_TEST`; put the environment last as `STG` / `PRD` so the name reads as *what* + *where*.

**Repository variables** (shared across environments):

| Variable | Example | Notes |
|----------|---------|-------|
| `DOCKERHUB_USERNAME` | `dertinfo` | Public Docker Hub org/user — not a secret |

**Repository secrets:**

| Secret | Notes |
|--------|-------|
| `DOCKERHUB_TOKEN` | Docker Hub access token |

**`test` environment variables:**

| Variable | ADO source |
|----------|------------|
| `AZURE_ENTRA_OIDC_CLIENTID_STG` | Entra app registration client ID |
| `AZURE_ENTRA_OIDC_TENANTID_STG` | Entra tenant ID |
| `AZURE_SUBSCRIPTION_DEPLOY_SUBSCRIPTIONID_STG` | Test subscription ID |
| `AZURE_WEBAPP_API_RESOURCENAME_STG` | `CD_Pipeline.TestEnvApiWebAppName` |
| `AZURE_FUNCTIONAPP_FUNCTIONS_RESOURCENAME_STG` | `FunctionAppName_Stg` |

**`test` environment secrets:**

| Secret | ADO source |
|--------|------------|
| `AZURE_STATICWEBAPP_WEB_DEPLOYTOKEN_STG` | Web SWA `staging_deployment_token` |
| `AZURE_STATICWEBAPP_APP_DEPLOYTOKEN_STG` | App SWA `staging_deployment_token` |

If migrating from an earlier setup, rename (do not duplicate) old names such as `TEST_API_WEBAPP_NAME`, `AZURE_CLIENT_ID`, or `AZURE_STATIC_WEB_APPS_API_TOKEN_TEST`.

### 4. Validate

After secrets are configured:

1. Push a change to `main` under one app path (or re-run the workflow from the Actions tab).
2. Confirm the workflow completes: artifact deploy to App Service / SWA, Docker Hub tags `latest-test` and `{run_id}-test` (test CD does not overwrite release tags).
3. Smoke-test hosted URLs (e.g. `staging.dertinfo.co.uk` for web).
4. Compare with the last successful ADO run for the same scope.
5. Leave ADO pipelines enabled until one full release cycle confirms GitHub Actions; then disable ADO triggers.

## Functions infrastructure reference (`test`)

Legacy ADO variable group `DertInfoImageResizeV4_Infrastucture_Staging_VariablesGroup` (old Windows Y1 app on `dertinfotestimagessa`). **New-stack** Functions infra is [`functions-infra-cd.yml`](../../../.github/workflows/functions-infra-cd.yml) against `stdevdertinfoimagesuks` / `stprddertinfoimagesuks`. Do not Event-Grid the old test/live image accounts.

| Variable | Value |
|----------|-------|
| `resourceGroupName` | `di-rg-imageresizev4-stg` |
| `location` | `uksouth` |
| `ownerInitials` | `di` |
| `workloadName` | `imageresizev4` |
| `environmentTag` | `stg` |
| `imagesStorageAccountName` | `dertinfotestimagessa` |
| `imagesStorageAccountResourceGroupName` | `dertinfo-test-rg` |
| `applicationInsightsName` | `dertinfo-test-ais` |
| `applicationInsightsResourceGroupName` | `di-rg-monitoring-stg` |
| `excessiveUseActionGroupName` | `di-agrp-excessiveuse-stg` |
| `excessiveUseActionGroupResourceGroupName` | `di-rg-monitoring-stg` |
