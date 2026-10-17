# Configuration

How settings are organised across local development, Docker, and Azure-hosted environments.

## Principles

1. **Checked-in configuration should make local development work** — defaults in `appsettings.json` use Azurite endpoints and fixed local callback ports. Tenant- and machine-specific values (SQL, Auth0) live in `infra/secrets/api.env`.
2. **Secrets live outside source control** — under `[infra/secrets/](../../../infra/secrets/)` (gitignored real files beside `*.example` templates). Placeholders in `appsettings.json` use `[located in user secrets | keyvault]`.
3. **Checked-in values must hold for all consumers of the repo** — shared Auth0 domain/audience (and similar) only if they are correct for every developer. Put secrets **and** per-developer / per-tenant values (SQL connection, SPA Auth0 client IDs) in `infra/secrets/api.env` so empty placeholders make the required replacements obvious.
4. **Azure-hosted environments use Azure App Configuration** — when `AZURE_APP_CONFIG` is set, the API overlays labelled settings (and Key Vault references) onto `appsettings.json`.
5. **Local runs without Azure App Configuration** — if `AZURE_APP_CONFIG` is unset, secrets from `[infra/secrets/api.env](../../../infra/secrets/api.env)` are set as **process environment variables** before the API starts (`npm run start` or Compose `env_file`). .NET’s default configuration precedence overlays them on `appsettings.json` (same hierarchical keys as App Configuration; mechanism differs).
6. **Local durable data** lives under `[infra/data/](../../../infra/data/)` (e.g. Azurite). Native and Docker Compose both use this path. Richer sharing across run types is [issue 128](https://github.com/dertinfo/dertinfo-mono/issues/128).
7. **Dependencies are per-project** — do not auto-install on start. If `node_modules` (or tooling) is missing, install that project explicitly (`npm run web:install`; `app:install` only if the PWA is enabled). Whether those installs consolidate is [issue 129](https://github.com/dertinfo/dertinfo-mono/issues/129).



## Local native development (primary)



### Base settings for local native development



#### Host tooling (Node, nvm, npm)


| Item            | Guidance                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Engine floor    | Root `package.json` / doctor: **Node ≥ 16.10**. Website Angular 22 CLI engines are Node `^22.22.3`, `^24.15.0`, or `>=26.0.0`. The Ionic app is still Angular 13.     |
| Recommended     | **Node 22** for website `ng`, matching CI and the website image. Node 18 or newer for the Static Web Apps CLI. The Ionic app is still Angular 13. |
| nvm-windows     | `nvm install <ver>` then **elevated** `nvm use <ver>` if you see `exit status 5: Access is denied` (symlink under `C:\Program Files\nodejs`) |
| After `nvm use` | Reinstall globals on that Node: `npm install -g azurite@latest @azure/static-web-apps-cli`                                                   |
| Per-app deps    | `npm run web:install` / `npm run app:install` (or `npm install` in each `apps/*/src/client`) after Node switches                             |
| Angular CLI     | Prefer **project-local** `npx ng` (web CLI 22, app CLI 13) — avoid one global CLI for both                                                   |


```powershell
node --version
npm --version
where.exe node
nvm list   # if using nvm-windows
```



#### Azurite


| Item                   | Guidance                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Minimum version        | **≥ 3.34.0** (doctor enforces; **3.36.0** verified with Functions Core Tools 4.12)                                                                      |
| Install                | `npm install -g azurite@latest` (not winget — that is for Functions Core Tools)                                                                         |
| Check running          | `npm run status`, or ports `10000/10001/10002` listening; `Server: Azurite-Blob/…` on `:10000`                                                          |
| Data directory         | `infra/data/azurite` (gitignored), used as `--location` by `npm run start`                                                                              |
| Well-known account key | Default in `api.env.example` for `StorageAccount__Images__Key` (Azurite emulator key)                                                                   |
| After upgrade          | Stop old listeners on `:10000–10002` before start — otherwise an old process may be reused                                                              |
| Disk GC crash          | Rename/remove the bad store and use a fresh empty `infra/data/azurite`, **or** allow start’s fallback: `--inMemoryPersistence` **without** `--location` |


Manual disk start (same shape as orchestrator):

```powershell
azurite --blobHost 127.0.0.1 --queueHost 127.0.0.1 --tableHost 127.0.0.1 `
  --blobPort 10000 --queuePort 10001 --tablePort 10002 `
  --location C:\Projects\Cursor\DertInfo\infra\data\azurite
```



#### Functions Core Tools + SWA


| Tool      | Install                                             | Notes                                          |
| --------- | --------------------------------------------------- | ---------------------------------------------- |
| `func` v4 | `winget upgrade Microsoft.Azure.FunctionsCoreTools` | 4.12+ needs modern Azurite (API `2024-11-04`)  |
| `swa`     | `npm install -g @azure/static-web-apps-cli`         | Required for website/PWA under `npm run start` |


Isolated worker build generates `obj/.../WorkerExtensions.csproj` (normal). Orchestrator runs `func start --script-root bin/Debug/net8.0` so Core Tools does not see two projects.

#### Required `infra/secrets/api.env` keys

Copy from `[api.env.example](../../../infra/secrets/api.env.example)`. Uncommented `KEY=VALUE` lines only. .NET maps `Auth0__Domain` → `Auth0:Domain`.

**First clone:** SQL values are yours (create an empty database matching `DatabaseName`). Auth0 values come from the **shared team dev tenant** (teammate / vault) — see `[infra/secrets/README.md](../../../infra/secrets/README.md)`.


| Key                                                                            | Purpose                                                                                         |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `SqlConnection__ServerName`                                                    | e.g. `.\SQLEXPRESS`                                                                             |
| `SqlConnection__ServerAdminName` / `ServerAdminPassword` / `DatabaseName`      | Local SQL Express login + DB (create empty DB first). Hosted Azure SQL uses Entra (no password) |
| `Auth0__Domain` / `Audience` / `ManagementClientId` / `ManagementClientSecret` | Shared dev tenant + M2M                                                                         |
| `WebClient__Auth0__ClientId` / `PwaClient__Auth0__ClientId`                    | SPA client IDs (same tenant)                                                                    |
| `StorageAccount__Images__Key`                                                  | Azurite well-known key (example has default)                                                    |


Callbacks stay in `appsettings.json` at `http://localhost:44200` / `44300` — register them in Auth0 (already expected for the shared tenant).

#### Ports


| Port         | Role                         |
| ------------ | ---------------------------- |
| 44100        | API                          |
| 4200 → 44200 | Website `ng serve` → SWA     |
| 4201 → 44300 | PWA `ng serve` → SWA         |
| 44400        | Functions                    |
| 10000–10002  | Azurite blob / queue / table |


Orchestration waits for each `ng serve` port before starting SWA.

### Prerequisites (summary)

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 16.10+](https://nodejs.org/) (website `ng` needs `^22.22.3`, `^24.15.0`, or `>=26.0.0`; CI and the website image use Node 22); optional [nvm-windows](https://github.com/coreybutler/nvm-windows)
- [SQL Server](https://www.microsoft.com/sql-server/sql-server-downloads) (or Express) — connection details in `infra/secrets/api.env`
- Azurite CLI **≥ 3.34.0**, Functions Core Tools **v4**, SWA CLI — see tables above
- `sqlcmd` on `PATH` (for `npm run doctor` database checks)
- **Docker Desktop** — only if you use `"mode": "docker"` in `runtime.json` or full `docker compose up`

`npm run doctor` fails if Azurite is older than **3.34.0**. After upgrading Azurite, stop any process still bound to `:10000–10002` before `npm run start`.

### First run (aligned with recommended runtime)

Root checklist: `README.md` [— First-time setup](../../../README.md#first-time-setup-clone--running-locally).

```bash
cp infra/secrets/api.env.example infra/secrets/api.env
# Fill SQL + Auth0 (see api.env.example comments). Create empty SQL database.

cp infra/dev/runtime.example.json infra/dev/runtime.json
cp apps/dert-functions/src/dertinfo-image-resize/local.settings.json.example \
   apps/dert-functions/src/dertinfo-image-resize/local.settings.json

npm run web:install          # website; skip app:install unless PWA is enabled
# npm run app:install

npm run doctor
npm run start
npm run status
npm run stop
```

Copy `[infra/dev/runtime.example.json](../../../infra/dev/runtime.example.json)` → `infra/dev/runtime.json`. Each service is `{ "mode": "native"|"docker"|"off", "rebuild": bool, "hotReload"?: bool }` (booleans alone are rejected). The example is the **recommended website + API** day-to-day setup (native api/web with hot reload, image resize on, PWA off, SQL Express via `api.env`). Timing expectations and alternatives: `[infra/dev/README.md](../../../infra/dev/README.md#recommended-day-to-day-website--api)`. Set `"api": { "mode": "off", "rebuild": false }` when debugging the API in Visual Studio.

When the API runs in **docker** and SQL is **native**, Compose sets `SqlConnection__ServerName=host.docker.internal,1433` (SQL Express must allow TCP). Azurite native similarly uses `host.docker.internal:10000`.


| URL                                              | Service              |
| ------------------------------------------------ | -------------------- |
| [http://localhost:44100](http://localhost:44100) | API                  |
| [http://localhost:44200](http://localhost:44200) | Website              |
| [http://localhost:44300](http://localhost:44300) | PWA app (if enabled) |
| [http://localhost:44400](http://localhost:44400) | Image resize         |
| [http://127.0.0.1:10000](http://127.0.0.1:10000) | Azurite blob         |


Auth0 SPA callback URLs in `appsettings.json` use the fixed local ports (`http://localhost:44200`, `http://localhost:44300`). Register those callbacks in whichever Auth0 tenant you configure via `infra/secrets/api.env`.

Orchestration scripts: `[infra/dev/](../../../infra/dev/)`. Estate how-to: [Local development](../guides/local-development.md). Change logs: `[2026-07-25-local-native-dev](../../operations/changelogs/2026-07-25-001-local-native-dev.md)`, `[2026-07-25-hybrid-native-docker-start](../../operations/changelogs/2026-07-25-002-hybrid-native-docker-start.md)`.

## Configuration layers (API)


| Layer                          | When                                       | Purpose                                                                                                              |
| ------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `appsettings.json`             | Always (base)                              | Local-friendly non-secrets; placeholders for secrets                                                                 |
| `infra/secrets/api.env`        | Local via process env / Compose `env_file` | Secret values injected before start (same keys App Configuration would supply)                                       |
| .NET user secrets              | Visual Studio F5 / `dotnet user-secrets`   | Same keys as `api.env` but with `:` nesting — set manually when debugging the API in VS (VS does not load `api.env`) |
| Process environment            | Always                                     | Standard .NET override of `appsettings.json` (`__` → `:`)                                                            |
| `AZURE_APP_CONFIG` + Key Vault | Test / production in Azure                 | Hosted overlay                                                                                                       |




### Local secrets ≈ App Configuration

Deployed hosts set `AZURE_APP_CONFIG` and load labelled configuration (Key Vault for secret values). Locally, with that variable **unset**:

- `npm run start` **/ Compose:** load `infra/secrets/api.env` into the process environment; `CreateDefaultBuilder` applies those variables over `appsettings.json`.
- **Visual Studio F5:** set the same settings via **user secrets** (Manage User Secrets). Map `Auth0__Domain` → `Auth0:Domain`, etc. Details: `[apps/dert-api/README.md](../../../apps/dert-api/README.md#2-visual-studio-f5--debug-the-api-project)`.

No custom secrets parsing in `Program.cs`.

### Hosted API runtime and App Configuration label

Hosted development and production App Services set `ASPNETCORE_ENVIRONMENT=Production`. `IsDevelopment()` is then false, so the API publishes image URLs as `https://{StorageAccount:Images:Name}.blob.core.windows.net` (development account `stdevdertinfoimagesuks`). Local `dotnet run` and Docker keep `ASPNETCORE_ENVIRONMENT=Development`, which rewrites those URLs to Azurite at `http://127.0.0.1:10000/{name}`. Which path each client requests (`originals`, `480x360`, `100x100`) is in [Images](../subsystems/images.md).

App Configuration labels stay `Development` and `Production` in each store (`appConfigurationLabel` in the catalog). The site setting `AZURE_APP_CONFIG_LABEL` selects that label. On the development App Service the runtime is `Production` and the label is still `Development`.

Ship the API build that reads `AZURE_APP_CONFIG_LABEL` before API infra CD changes `ASPNETCORE_ENVIRONMENT`. The previous build uses `ASPNETCORE_ENVIRONMENT` as the label filter. If infra lands first, the development API looks for label `Production` in the development store and does not load its settings.

### Hosted App Configuration Key Vault references

Config Bicep creates the store and vault only. `[Import-DertInfoAppConfiguration.ps1](../../../infra/scripts/Configuration/Import-DertInfoAppConfiguration.ps1)` and `[Export-DertInfoAppConfiguration.ps1](../../../infra/scripts/Configuration/Export-DertInfoAppConfiguration.ps1)` use `--auth-mode login` (App Configuration Data Owner). Set secret values with `[New-DertInfoConfigKeyVaultSecrets.ps1](../../../infra/scripts/Configuration/New-DertInfoConfigKeyVaultSecrets.ps1)` (`az login`, vault RBAC).


| App Configuration key               | Key Vault secret                  |
| ----------------------------------- | --------------------------------- |
| `Auth0:ManagementClientSecret`      | `auth0-managementclientsecret`    |
| `Auth0:ManagementClientId`          | `auth0-managementclientid`        |
| `WebClient:Auth0:ClientId`          | `webclient-auth0-clientid`        |
| `PwaClient:Auth0:ClientId`          | `pwaclient-auth0-clientid`        |
| `PwaClient:AppInsights:TelemetryId` | `appinsights-telemetryid`         |
| `WebClient:AppInsights:TelemetryId` | `appinsights-telemetryid`         |
| `StorageAccount:Images:Key`         | `az-storage-images-accountkey`    |
| `StorageAccount:Functions:Key`      | `az-storage-functions-accountkey` |
| `Mailgun:ApiKey`                    | `mailgun-apikey`                  |
| `SendGrid:ApiKey`                   | `sendgrid-apikey`                 |
| `SqlConnection:ServerName`          | `sqlconnection-servername`        |
| `SqlConnection:DatabaseName`        | `sqlconnection-databasename`      |


The API resolves them at runtime (`ConfigureKeyVault`). It will not start if a referenced secret is missing. Names and targets live in `[infra/configuration/app-config.development.json](../../../infra/configuration/app-config.development.json)` (and the production catalog); values live in the gitignored `kv-secrets.<environment>.json` (copy from `kv-secrets.<environment>.json.example`). Operator scripts take `-GitHubEnvironment` or `-ConfigFile` / `-SecretsFile`.

Non-secret keys for development live in the catalog `keyValues` and are applied with `[Import-DertInfoAppConfiguration.ps1](../../../infra/scripts/Configuration/Import-DertInfoAppConfiguration.ps1)` (`-GitHubEnvironment development -Force`). Optional dump import via `-Path` (`--skip-keyvault`; gitignored). Do not use `--resolve-keyvault`.

### Hosted Azure SQL (Entra-only)

When `AZURE_APP_CONFIG` is set, the API builds the SQL connection with `Authentication=Active Directory Default` (site managed identity). `SqlConnection:ServerName` and `SqlConnection:DatabaseName` are Key Vault references (obfuscation; not login credentials). Do not put `SqlConnection:ServerAdminName` or `ServerAdminPassword` in hosted App Configuration. Local SQL Express still uses those keys in `infra/secrets/api.env`.

The site needs a **contained database user named after the App Service** (`CREATE USER [app-<dev|prd>-dertinfo-api-uks] FROM EXTERNAL PROVIDER`). Putting the MI in `dertinfo-sql-db-access-<environment>` does not grant that login. Operator scripts: [Secrets and rotation](secrets-and-rotation.md).

### Auth0 tenants (local vs hosted)

Do **not** treat GitHub Environment names as Auth0 tenant names. Today:

| Runtime | GitHub / Azure | Auth0 tenant today |
|---------|----------------|--------------------|
| Local native / Docker | none | **`dertinfodev.eu.auth0.com`** (`infra/secrets/api.env`) |
| New-stack Azure **development** | Environment `development` | **`dertinfotest.eu.auth0.com`** ([`app-config.development.json`](../../../infra/configuration/app-config.development.json)) |
| Live / old production | separate estate | `dertinfo.eu.auth0.com` |

Development SPA login on Azure uses **dertinfotest**. Hosted catalog callbacks are `https://dev.dertinfo.co.uk` (website) and `https://app-dev.dertinfo.co.uk` (PWA). Auth0 application lists need the extra paths (`/callback`, `/auth/callback`) — [Authentication](../subsystems/authentication.md#hosted-development-auth0-application-urls). A later rebuild will rename tenants to match environments — [issue 117](https://github.com/dertinfo/dertinfo-mono/issues/117).

### Auth0 (local)


| Setting                                                                       | Where                   | Secret?                              |
| ----------------------------------------------------------------------------- | ----------------------- | ------------------------------------ |
| `Auth0:Domain` / `Audience` / `ManagementClientId` / `ManagementClientSecret` | `infra/secrets/api.env` | Tenant-specific (secret or not)      |
| `WebClient:Auth0:ClientId` / `PwaClient:Auth0:ClientId`                       | `infra/secrets/api.env` | Tenant-specific (not shared in repo) |
| `WebClient:Auth0:CallbackUrl` / `PwaClient:Auth0:CallbackUrl`                 | `appsettings.json`      | No (fixed local ports)               |




### Frontends (web / PWA)


| Environment                        | API URL & Auth0 callback |
| ---------------------------------- | ------------------------ |
| Local `ng serve` / `npm run start` | `apps/*/src/client/src/assets/app.config.json` (localhost ports) |
| Docker                             | Same JSON in `dist/assets`; `docker-launch.sh` substitutes `API_URL` / `AUTH_CALLBACK_URL` / `ALLOWED_DOMAINS` from `infra/docker/web.env` or `app.env` |
| Azure Static Web Apps              | CD writes `dist/assets/app.config.json` from GitHub Environment variables (`AZURE_WEBAPP_API_RESOURCENAME`, `AZURE_STATICWEBAPP_WEB_CALLBACKURL` / `AZURE_STATICWEBAPP_APP_CALLBACKURL`). See [CI/CD](cicd.md). |


`environment.ts` / `environment.prod.ts` only toggle Angular `enableProdMode()` (`ng serve` vs `npm run build:hosted`). They do not contain API or callback URLs.

Client-facing Auth0 client id / domain / audience still come from `GET /api/clientconfiguration/web` and `/app` after the runtime JSON has supplied the API base.

## Data paths


| Path                  | Role                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `infra/data/azurite/` | Azurite persistence (native `--location` and Compose bind mount) |
| SQL Server            | Instance data directories (not under `infra/data/`)              |




## Docker (optional / secondary)

Compose remains available for full-stack containers. Azurite data uses `./infra/data/azurite`. API `env_file` is `./infra/secrets/api.env` (same secrets file as native).

```bash
cp infra/secrets/api.env.example infra/secrets/api.env
# fill secrets
docker compose up --build
```



## What not to do

- Do not hardcode machine-specific SQL connection details in `appsettings.json` — use `infra/secrets/api.env`.
- Do not put secrets under `infra/docker/` for local API runs — use `infra/secrets/`.
- Do not add shared non-secret Auth0 identifiers to `api.env` if they already exist in `appsettings.json`.
- Do not commit secrets; do not require Azure App Configuration for local runs.
- Do not auto-download npm/dotnet dependencies on every `start` — install per project when needed.
- Do not change production/test Azure settings in checked-in files; those are owned by App Configuration labels.



## Future work

- Consolidate dependency install across web/app (and tooling) in the monorepo.
- Stronger shared-storage semantics between native and Docker run types beyond the shared `infra/data/` path.



## Related docs

- [Local development](../guides/local-development.md) — run the whole estate
- [Architecture overview](../architecture/overview.md)
- [Authentication (Auth0)](../subsystems/authentication.md)
- [Secrets and rotation](secrets-and-rotation.md)
- `[infra/secrets/README.md](../../../infra/secrets/README.md)` — secrets layout
- `[infra/dev/README.md](../../../infra/dev/README.md)` — doctor / start / stop
- `[apps/dert-api/README.md](../../../apps/dert-api/README.md)` — API-specific notes
- `[README.md](../../../README.md)` — monorepo quick start

