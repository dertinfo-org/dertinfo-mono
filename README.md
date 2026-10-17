# DertInfo Monorepo

Consolidated repository for the DertInfo platform.

## Apps

| App       | Path                   | Stack                             |
| --------- | ---------------------- | --------------------------------- |
| API       | `apps/dert-api/`       | .NET 8, EF Core, MSSQL            |
| Functions | `apps/dert-functions/` | C# Azure Functions (image resize) |
| Website   | `apps/dert-web/`       | Angular                           |
| App (PWA) | `apps/dert-app/`       | Ionic + Angular (PWA)             |

## Packages

| Package          | Path                         | Purpose                                |
| ---------------- | ---------------------------- | -------------------------------------- |
| Shared contracts | `packages/shared-contracts/` | OpenAPI spec and generated API clients |

## First-time setup (clone → running locally)

Do this once after cloning. Default path runs the **website + API + image resize** on the host (recommended for day-to-day work). **Docker Desktop is not required** for that path.

### 1. Install host tools

| Tool | Notes |
|------|--------|
| [.NET 8 SDK](https://dotnet.microsoft.com/download) | `dotnet --version` |
| [Node.js](https://nodejs.org/) ≥ 16.10 (20/24 LTS recommended) | `node --version` |
| [SQL Server](https://www.microsoft.com/sql-server/sql-server-downloads) / Express | Local DB for the API |
| [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite) ≥ 3.34 | `npm install -g azurite@latest` |
| [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) v4 | `func --version` |
| [SWA CLI](https://azure.github.io/static-web-apps-cli/) | `npm install -g @azure/static-web-apps-cli` |
| `sqlcmd` | On `PATH` for `npm run doctor` |

Optional: [nvm-windows](https://github.com/coreybutler/nvm-windows). After `nvm use`, reinstall globals (`azurite`, `@azure/static-web-apps-cli`).

### 2. Copy config templates

```bash
cp infra/secrets/api.env.example infra/secrets/api.env
cp infra/dev/runtime.example.json infra/dev/runtime.json
cp apps/dert-functions/src/dertinfo-image-resize/local.settings.json.example \
   apps/dert-functions/src/dertinfo-image-resize/local.settings.json
```

### 3. Fill `infra/secrets/api.env`

| Kind | What to put |
|------|-------------|
| **SQL (you)** | Server (e.g. `.\SQLEXPRESS`), login, password, and **database name** |
| **Auth0 (team)** | Shared **dev** tenant: domain, audience, SPA client IDs, management client id/secret — ask a teammate or your secrets vault; do not invent a new tenant unless you update Auth0 callbacks |
| **Storage** | Leave the example Azurite key unless you know you need otherwise |

Create an **empty** SQL database matching `SqlConnection__DatabaseName` (SSMS or `sqlcmd`). The API applies EF migrations on first start.

Auth0 callbacks for local are already `http://localhost:44200` and `http://localhost:44300` in `appsettings.json` — they must be allowed on the SPA apps in the shared tenant.

Details: [`docs/technical/infra/configuration.md`](docs/technical/infra/configuration.md), [`infra/secrets/README.md`](infra/secrets/README.md).

### 4. Install website deps and verify

```bash
npm run web:install          # required for recommended runtime (website on, PWA off)
# npm run app:install        # only if you set "app" mode to native or docker

npm run doctor
npm run start
npm run status
```

`runtime.example.json` is the recommended config: API + website with hot reload, image resize on, PWA off, SQL Express via `api.env`. Timings and alternatives: [`infra/dev/README.md`](infra/dev/README.md#recommended-day-to-day-website--api).

| URL | Service |
|-----|---------|
| http://localhost:44100 | API |
| http://localhost:44200 | Website |
| http://localhost:44400 | Image resize |
| http://127.0.0.1:10000 | Azurite blob |
| http://localhost:44300 | PWA (only if enabled in `runtime.json`) |

Stop with `npm run stop`. Re-run `npm run start` anytime; with `rebuild: false` healthy services are skipped.

**Visual Studio (API F5):** set `"api": { "mode": "off", "rebuild": false }` and use user secrets — see [`apps/dert-api/README.md`](apps/dert-api/README.md#2-visual-studio-f5--debug-the-api-project).

Resolved local website investigations (historical): [warmup race](docs/operations/investigations/web-warmup-race-condition.md), [silent auth on localhost](docs/operations/investigations/local-silent-auth-localhost.md). Estate how-to: [Local development](docs/technical/guides/local-development.md). Architecture: [overview](docs/technical/architecture/overview.md).

## Prerequisites (reference)

Full tool matrix and Azurite/Functions notes: [`docs/technical/infra/configuration.md`](docs/technical/infra/configuration.md#base-settings-for-local-native-development).

**Azurite + Functions:** Core Tools 4.12+ needs Storage API `2024-11-04` → Azurite **≥ 3.34** (not 3.31). After upgrading, stop old processes on `:10000–10002`.

## Local run modes

`npm run start` reads [`infra/dev/runtime.json`](infra/dev/runtime.json) (gitignored). Each service: `mode` (`native` \| `docker` \| `off`), `rebuild`, optional `hotReload`.

| Goal | Approach |
|------|----------|
| Edit website + API (usual) | Recommended example above — **no Docker Desktop** |
| Mix docker deps + native apps | Set individual `mode` values; Docker Desktop required only for `docker` services — [`infra/dev/README.md`](infra/dev/README.md) |
| Whole stack in Compose | See [Docker](#docker-optional) — easier “just run it”, slower for editing API/web |

## Docker (optional)

**When you need Docker Desktop:** any service with `"mode": "docker"` under `npm run start`, or a full `docker compose up` estate.

```bash
cp infra/secrets/api.env.example infra/secrets/api.env
cp infra/secrets/web.env.example infra/secrets/web.env
cp infra/secrets/app.env.example infra/secrets/app.env
cp infra/secrets/functions.env.example infra/secrets/functions.env
docker compose up --build
```

Compose uses the same `infra/secrets/api.env` and Azurite data under `infra/data/azurite`. Prefer native hot reload for work on the API or website; use Compose when you want containers without host Azurite/func/swa.

## Common commands

```bash
npm run doctor
npm run start
npm run status
npm run stop

dotnet build dertinfo.sln
dotnet test dertinfo.sln

npm run web:build
npm run app:build
```

## Importing existing repositories

| Repo                                                                             | Status   | Path                                             |
| -------------------------------------------------------------------------------- | -------- | ------------------------------------------------ |
| [dertinfo-api](https://github.com/dertinfo/dertinfo-api)                         | Imported | `apps/dert-api/`                                 |
| [dertinfo-image-resize-v4](https://github.com/dertinfo/dertinfo-image-resize-v4) | Imported | `apps/dert-functions/`                           |
| [dertinfo-web](https://github.com/dertinfo/dertinfo-web)                         | Imported | `apps/dert-web/` (Angular client: `src/client/`) |
| [dertinfo-app](https://github.com/dertinfo/dertinfo-app)                         | Imported | `apps/dert-app/` (Ionic client: `src/client/`)   |

API solution file (legacy): `apps/dert-api/src/DertInfoApiSolution.sln`  
Root solution: `dertinfo.sln` (includes API projects)

## Contributing

Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). The project is licensed under GNU GPLv3 — see [LICENCE.md](LICENCE.md).

## CI/CD

- **Src CI:** GitHub Actions workflows (`*-src-ci.yml`) build and test on pull requests into `main` (path-filtered per app).
- **Src CD / infra CD:** `*-src-cd.yml` and `*-infra-cd.yml` deploy on pushes to `main` (GitHub Environments `development` then gated `production`).

See [docs/technical/infra/cicd.md](docs/technical/infra/cicd.md) for workflow inventory, secrets setup, and ADO mapping.

## Documentation

Platform docs hub: [`docs/README.md`](docs/README.md) (capabilities, technical, operations).
