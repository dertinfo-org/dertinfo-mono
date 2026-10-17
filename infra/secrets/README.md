# Local secrets

Gitignored secret files live **beside** their checked-in `*.example` siblings.

| File | Used by | Purpose |
|------|---------|---------|
| `api.env.example` | (template) | Required keys for the API when running without Azure App Configuration |
| `api.env` | `npm run start` (process env); Compose `env_file` | Real values — copy from the example and fill in |
| `web.env.example` / `web.env` | Compose website container | `API_URL`, `AUTH_CALLBACK_URL`, `ALLOWED_DOMAINS` written into `app.config.json` at start |
| `app.env.example` / `app.env` | Compose PWA container | Same three values for the app |
| `functions.env.example` / `functions.env` | Compose `functions` service | Turns the Event Grid resize triggers off for local Docker |

```bash
cp infra/secrets/api.env.example infra/secrets/api.env
cp infra/secrets/web.env.example infra/secrets/web.env
cp infra/secrets/app.env.example infra/secrets/app.env
cp infra/secrets/functions.env.example infra/secrets/functions.env
# Edit api.env — see below
```

## What to fill in (first clone)

| Keys | Source |
|------|--------|
| `SqlConnection__*` | **Your machine** — SQL Express/Server instance, SQL login, and database name. Create an **empty** database with that name before first API start. |
| `Auth0__*` and SPA `*ClientId` | **Shared team dev tenant** — get domain, audience, client IDs, and Management API secret from a teammate or your team vault. Do not invent a new tenant unless you also configure Auth0 callbacks for `http://localhost:44200` / `44300`. |
| `StorageAccount__Images__Key` | Keep the example **Azurite** well-known key for local. |

Never commit `api.env`, `web.env`, `app.env`, or `functions.env`.

## Behaviour vs Azure App Configuration

- **Hosted:** `AZURE_APP_CONFIG` is set → the API overlays App Configuration (+ Key Vault) on `appsettings.json`.
- **Local (`npm run start` / Compose):** `AZURE_APP_CONFIG` is unset → secrets from `api.env` are injected into the **process environment** before the API starts. .NET’s default configuration precedence applies `Auth0__X` → `Auth0:X` over `appsettings.json`.
- **Visual Studio F5:** VS does not load `api.env`. Set the same values via **Manage User Secrets** (`:` keys). See [`apps/dert-api/README.md`](../../apps/dert-api/README.md#2-visual-studio-f5--debug-the-api-project).

Do not put non-secrets here if they already belong in `appsettings.json`.

See also: [Configuration](../../docs/technical/infra/configuration.md), [First-time setup](../../README.md#first-time-setup-clone--running-locally).
