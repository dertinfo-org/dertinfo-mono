# Local hybrid runtime (native / docker)

Scripts for running the estate on the developer machine with per-service **mode**, **rebuild**, and **hotReload**.

**New to the repo?** Start with the root [First-time setup](../../README.md#first-time-setup-clone--running-locally), then return here for modes, timings, and mixed docker/native details.

| File | Role |
|------|------|
| `paths.mjs` | Shared ports, paths, env parsing, `loadRuntime()` |
| `health.mjs` | Healthy probes (HTTP / Azurite API / SQL) |
| `docker.mjs` | Compose up/build/stop + host bridge env |
| `runtime.example.json` | Template for `runtime.json` (recommended website + API) |
| `runtime.json` | Active config (**gitignored**) |
| `doctor.mjs` | Fail-fast preflight (`npm run doctor`) |
| `start.mjs` | Start/skip/rebuild per service (`npm run start`) |
| `stop.mjs` | Stop managed native PIDs + tracked compose services |
| `status.mjs` | Health probes (`npm run status`) |

Full host prerequisites: [`docs/technical/infra/configuration.md`](../../docs/technical/infra/configuration.md#base-settings-for-local-native-development). Estate guide: [`docs/technical/guides/local-development.md`](../../docs/technical/guides/local-development.md).

**Docker Desktop** is required only when at least one service has `"mode": "docker"`. The recommended day-to-day config is all native and does not need Docker.

## Config shape (`runtime.json`)

```bash
cp infra/dev/runtime.example.json infra/dev/runtime.json
```

Each service is an object (booleans are **rejected**):

```json
{
  "api": { "mode": "native", "rebuild": false, "hotReload": true },
  "web": { "mode": "native", "rebuild": false, "hotReload": true },
  "app": { "mode": "off", "rebuild": false },
  "imageResize": { "mode": "native", "rebuild": false, "hotReload": false },
  "azurite": { "mode": "native", "rebuild": false },
  "sql": { "mode": "off", "rebuild": false }
}
```

This matches the [recommended website + API](#recommended-day-to-day-website--api) day-to-day setup (image resize on for website features; PWA off).

| Field | Values | Meaning |
|-------|--------|---------|
| `mode` | `native` \| `docker` \| `off` | How start manages the service. `off` = leave alone (you may run it elsewhere). |
| `rebuild` | boolean | Healthy + `false` → skip. `true` → stop, rebuild, start. |
| `hotReload` | boolean | Native only (api/web/app/imageResize). `true` = watch/serve; `false` = run/build once. |

### Hot reload (native)

| Service | `hotReload: true` | `hotReload: false` |
|---------|-------------------|--------------------|
| api | `dotnet watch run` | `dotnet build` + `dotnet run` |
| web / app | `ng serve` + SWA proxy | `ng build` + `swa start dist` |
| imageResize | `func start --script-root …` | same; `rebuild` forces `dotnet build` |

### Docker

Uses root [`docker-compose.yml`](../../docker-compose.yml) with `--no-deps` so mixed modes work. When API/functions are docker and SQL/Azurite are native, compose substitutes `host.docker.internal` (and credentials from `api.env`). SQL Express must allow TCP for that bridge.

| Logical | Compose service | Host port |
|---------|-----------------|-----------|
| api | `dertinfo-api` | 44100 |
| web | `web-frontend` | 44200 |
| app | `app-frontend` | 44300 |
| imageResize | `image-resize` | 44400 |
| azurite | `azstorage` | 10000–10002 |
| sql | `sqlserver` | 44000 |

## Commands

```bash
cp infra/secrets/api.env.example infra/secrets/api.env
# fill secrets
cp apps/dert-functions/src/dertinfo-image-resize/local.settings.json.example \
   apps/dert-functions/src/dertinfo-image-resize/local.settings.json

npm run doctor
npm run start
npm run status
npm run stop
```

`npm run start` prints **elapsed seconds** when the estate is ready (useful for local benchmarks).

Does **not** auto-install npm packages or run `dotnet restore` on the happy path.

## Tooling versions

| Tool | Check | Recommended |
|------|-------|-------------|
| Node.js | `node --version` | ≥ 16.10; 20/24 LTS recommended |
| Azure Functions Core Tools | `func --version` | **v4** (e.g. 4.12.x) |
| Azurite | `azurite --version` | **≥ 3.34.0** |
| SWA CLI | `swa --version` | for native web/app |
| Docker Compose | `docker compose version` | when any `mode: docker` |

### Azurite (native)

1. Reuse `:10000–10002` only if they accept API `2024-11-04`.
2. Else start disk: `--location <repo>/infra/data/azurite`.
3. If disk fails: `--inMemoryPersistence` **without** `--location`.

### Functions (native)

Build `DertInfoImageResizeV4.csproj`, then `func start --script-root bin/Debug/net8.0` (avoids WorkerExtensions dual-csproj).

## Recommended day-to-day: website + API

For normal feature work on the **website** and **API**, use native processes with hot reload on only those two, keep **image resize** running (the site needs it for some flows), and leave the PWA off.

```json
{
  "api": { "mode": "native", "rebuild": false, "hotReload": true },
  "web": { "mode": "native", "rebuild": false, "hotReload": true },
  "app": { "mode": "off", "rebuild": false },
  "imageResize": { "mode": "native", "rebuild": false, "hotReload": false },
  "azurite": { "mode": "native", "rebuild": false },
  "sql": { "mode": "off", "rebuild": false }
}
```

| Choice | Why |
|--------|-----|
| API / web `hotReload: true` | `dotnet watch` and `ng serve` — edit/save without restarting the estate |
| `imageResize` native, `hotReload: false` | Required for upload/resize behaviour on the website; leave it up, don’t pay for watch |
| `app` off | Avoids a second Angular/SWA stack you aren’t editing |
| `sql` off | Use existing SQL Express from `api.env` |
| `rebuild: false` | Re-running `npm run start` **skips** healthy services |

**Workflow:** bring the estate up once with `npm run start`, then keep coding. Re-run start only if something died — healthy api/web/azurite/imageResize should skip. Set `rebuild: true` on a single service only when you need a clean restart of that process.

Enabling a service that was `off` and running start again is the intended way to add it. Today a **port in use but not healthy** probe still **aborts the whole start** ([issue 113](https://github.com/dertinfo/dertinfo-mono/issues/113)).

### Timing expectations

Figures from one Windows machine (2026-07-25); treat as order-of-magnitude, not a guarantee.

| Situation | Expectation |
|-----------|-------------|
| Cold start of this recommended set (api + web + imageResize + azurite) | Roughly **2–4 minutes** (B1 all-native with PWA too was ~195s; dropping the PWA is faster) |
| Already up; only restart website (`web.rebuild: true`) | Roughly **30–40 seconds** (B4 warm web reload ~38s) |
| Edit API or web with hot reload | Seconds for watch/HMR — no `npm run start` needed |
| API/web in **docker** while actively coding them | Much slower feedback; cold docker API image build can be **15–20+ minutes** the first time (B2 ~1167s) |

**Avoid for this cycle:** leaving `app` on unused; `rebuild: true` on every start; docker mode for the API or website you are editing. Docker (or native without hot reload) is fine for dependencies you are not changing — e.g. you can run `imageResize` as `docker` with `rebuild: false` if you prefer a container over `func start`.

## Benchmark scenarios

Metric: wall-clock from `npm run start` until every **enabled** service is available (skipped healthy services count immediately). Start prints `Start completed in Xs`.

| Id | Intent | Result (this machine) |
|----|--------|------------------------|
| B1 | Cold baseline — all native, hotReload on, rebuild true | **195.2s** |
| B2 | Web native HR; api/azurite/sql docker; app off | **1166.7s** (first API image build + base pulls dominated) |
| B3 | App native HR; sql native; api/azurite docker; web off | **255.8s** |
| B4 | Warm api/azurite/imageResize docker + sql native; web rebuild true | **37.9s** |

Recorded 2026-07-25 on Windows 10, Node v24.18.0, Docker Desktop, .NET SDK 10.0.302, Functions Core Tools 4.12.1. Docker API + native SQL Express uses `host.docker.internal,1433` (TCP must be enabled on Express).

Logs: `infra/dev/logs/bench-b*.log` (gitignored).
