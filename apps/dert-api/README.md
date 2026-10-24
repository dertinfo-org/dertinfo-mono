


# DertInfo - API

This is the API and business logic code for the DertInfo application.

The producton version of this solution is visible [[https://dertinfo-live-api-wa.azurewebsites.net/swagger/index.html](https://dertinfo-live-api-wa.azurewebsites.net/swagger/index.html)]

> **Note:** If you are unfamilar with the collection of services that are part of DertInfo please refer to the repository dertinfo/dertinfo.

## Table of Contents

- [Technology](#technology)
- [Topology](#topology)
- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Technology

This project is a C# .NET API currently running .NET 8.0 

## Topology

![Application Containers](/docs/images/architecture-dertinfo-api-containerlevel.png)

## Installation

In order to get this project running locally you are going to need.

- Visual Studio Community
- Microsoft SQL Server Express

Experimental: Alternatively, you can use Visual Studio Code running in a devcontainer, with SQL Server running in docker.

## Ways to run the API

Canonical configuration model: [`docs/technical/infra/configuration.md`](../../docs/technical/infra/configuration.md). Secrets and tenant-/machine-specific values live in [`infra/secrets/api.env`](../../infra/secrets/api.env) (copy from [`api.env.example`](../../infra/secrets/api.env.example)).

### 1. Local estate (recommended) — `npm run start`

From the **monorepo root**, with SQL Server and Azurite available and `infra/secrets/api.env` filled in:

```bash
npm run doctor
npm run start
```

`npm run start` injects `api.env` into the API process environment. .NET overlays those values on `appsettings.json` (`Auth0__Domain` → `Auth0:Domain`, etc.). The API listens on **http://localhost:44100**. See also [`infra/dev/README.md`](../../infra/dev/README.md).

### 2. Visual Studio (F5 / debug the API project)

Visual Studio does **not** load `infra/secrets/api.env`. For F5 you must supply the same settings via **.NET user secrets** (or equivalent launch environment variables).

1. Copy [`infra/secrets/api.env.example`](../../infra/secrets/api.env.example) → `infra/secrets/api.env` and fill values (even if you only use VS — keeps one checklist of required keys).
2. In Visual Studio: right-click the `dertinfo-api` project → **Manage User Secrets**, and set the **same** keys using `:` nesting (not `__`). Example mapping from `api.env`:

| `api.env` key | User secrets key |
|---------------|------------------|
| `SqlConnection__ServerName` | `SqlConnection:ServerName` |
| `SqlConnection__ServerAdminName` | `SqlConnection:ServerAdminName` |
| `SqlConnection__ServerAdminPassword` | `SqlConnection:ServerAdminPassword` |
| `SqlConnection__DatabaseName` | `SqlConnection:DatabaseName` |
| `Auth0__Domain` | `Auth0:Domain` |
| `Auth0__Audience` | `Auth0:Audience` |
| `Auth0__ManagementClientId` | `Auth0:ManagementClientId` |
| `Auth0__ManagementClientSecret` | `Auth0:ManagementClientSecret` |
| `WebClient__Auth0__ClientId` | `WebClient:Auth0:ClientId` |
| `PwaClient__Auth0__ClientId` | `PwaClient:Auth0:ClientId` |
| `StorageAccount__Images__Key` | `StorageAccount:Images:Key` |
| `ApiInfo__ContactName` | `ApiInfo:ContactName` |
| `ApiInfo__ContactEmail` | `ApiInfo:ContactEmail` |

Or from a shell in `apps/dert-api/src/dertinfo-api`:

```bash
dotnet user-secrets set "Auth0:Domain" "your-tenant.eu.auth0.com"
dotnet user-secrets set "SqlConnection:ServerName" ".\\SQLEXPRESS"
# …repeat for each key above
```

3. Ensure Azurite (and SQL) are running if you need storage/DB — e.g. start them via the monorepo tools or your own local installs.
4. Run / debug the API project. Default local URL: **http://localhost:44100**.

User secrets are stored under your Windows profile (`%APPDATA%\Microsoft\UserSecrets\…`) and are not committed. Keep them in sync manually when you change `api.env`.

### 3. Docker Compose

```bash
cp infra/secrets/api.env.example infra/secrets/api.env
# fill secrets
docker compose up --build
```

Compose uses `env_file: ./infra/secrets/api.env` for the API container (same file as local native).

### Other / legacy run methods

- Docker image only: `docker run dertinfo/dertinfo-api:latest`
- Build the image from `apps/dert-api`: `docker build -t dertinfo/dertinfo-api -f Dockerfile .`
- Devcontainer + compose: start dependencies via compose, set user secrets or env, then launch the API from VS Code.

### Secrets checklist (`api.env`)

```
Auth0__Domain=...
Auth0__Audience=...
Auth0__ManagementClientId=...
Auth0__ManagementClientSecret=...
WebClient__Auth0__ClientId=...
PwaClient__Auth0__ClientId=...
SqlConnection__ServerName=...
SqlConnection__ServerAdminName=...
SqlConnection__ServerAdminPassword=...
SqlConnection__DatabaseName=...
StorageAccount__Images__Key=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==
ApiInfo__ContactName=...
ApiInfo__ContactEmail=...
```

Notes:
- Auth0 tenant settings, SPA client IDs, and SQL connection details differ per developer — they belong in secrets / user secrets, not in checked-in `appsettings.json`.
- Callback URLs stay in `appsettings.json` (fixed local ports `44200` / `44300`).
- The StorageAccount key above is the well-known Azurite emulator key.
- To request credentials for the project’s shared development Auth0 tenant, email [dertinfo@gmail.com](mailto:dertinfo@gmail.com).

### Database

Create the database named in your secrets if needed. The API applies EF migrations on startup.

### Integration tests

`src/dertinfo-api.itests` starts the API in a test host. Startup migrates on launch, so the process needs a SQL Server it can create a database on. Set `ASPNETCORE_ENVIRONMENT=Development` and `SqlConnection__ServerName`, `SqlConnection__DatabaseName`, `SqlConnection__ServerAdminName`, and `SqlConnection__ServerAdminPassword` on the test process. Those environment variables override the placeholders in the test `appsettings.json`. Before the cases run, the suite applies `tests/e2e/shared-state` pack `system-basic` (events, groups, and the image files named by that pack). From `tests/e2e`, install the SQL client with `npm install --ignore-scripts --no-package-lock` so `node` can run `shared-state/apply.mjs`. Authenticated cases build a token from `tests/e2e/shared-data/auth0-personas.json`. Only this test host accepts that token. API source CI runs the assembly against a SQL Server service container and does not call Auth0; see [CI/CD](../../docs/technical/infra/cicd.md).

## Usage

When the application is successfully running it will provide the endpoints used for both the web and app clients. 

You can inspect the endpoints and models via the swagger definitions at the path /swagger/index.html (e.g. http://localhost:44100/swagger/index.html)

## Features

(API Features documentation to be completed later)

## Contributing

Please refer to [CONTRIBUTING.md](../../CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) for information on how others can contribute to the project.

## License

This project is licenced under the GNU GPLv3 licence. Please refer to the [LICENCE.md](../../LICENCE.md) file for more information. 
