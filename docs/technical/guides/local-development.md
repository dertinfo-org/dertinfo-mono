---
name: Local development
type: guide
status: active
updated: 2026-10-24
---

# Local development

How to run the **whole estate** on a developer machine: native host processes, hybrid native/Docker, or full Compose.

Project-local getting started (F5, single-app install) stays in each app README. Configuration keys, secrets, and ports are canonical in [Configuration](../infra/configuration.md).

Docker/Compose narrative also draws on the legacy wiki: [How we use docker & docker-compose](https://github.com/dertinfo/dertinfo/wiki/How-we-use-docker-&-docker-compose-in-DertInfo) — updated for the monorepo (**native-first** for day-to-day work).

## Recommended path (native)

Day-to-day: API + website + image resize + Azurite on the host. **Docker Desktop is not required.**

1. Follow [First-time setup](../../../README.md#first-time-setup-clone--running-locally) in the root README.
2. Copy and fill [`infra/secrets/api.env`](../../../infra/secrets/README.md) and [`infra/dev/runtime.json`](../../../infra/dev/README.md) from the examples.
3. `npm run doctor` → `npm run start` → `npm run status`.
4. Stop with `npm run stop`.

Default URLs: API `44100`, website `44200`, image resize `44400`, Azurite `10000–10002`. SQL may be host Express or Compose on `44000`. PWA `44300` only if enabled in `runtime.json`.

## Hybrid native / Docker

[`infra/dev/`](../../../infra/dev/README.md) scripts read `runtime.json`. Each service has `mode` (`native` | `docker` | `off`), `rebuild`, and optional `hotReload`.

- Docker Desktop is required only when at least one service uses `"mode": "docker"`.
- Mixed modes use Compose `--no-deps` and `host.docker.internal` where containers talk to host SQL/Azurite.

Details, timings, and recommended day-to-day matrix: [`infra/dev/README.md`](../../../infra/dev/README.md).

## Full Docker Compose

Optional “everything in containers” path — useful to validate the estate with latest images / built Dockerfiles without installing every host tool. Feedback loop for editing API/web is slower than native hot reload.

Root Compose file: [`docker-compose.yml`](../../../docker-compose.yml). Env templates are under [`infra/secrets/`](../../../infra/secrets/).

```bash
cp infra/secrets/api.env.example infra/secrets/api.env
cp infra/secrets/web.env.example infra/secrets/web.env
cp infra/secrets/app.env.example infra/secrets/app.env
cp infra/secrets/functions.env.example infra/secrets/functions.env
docker compose up --build
```

Prefer native/hybrid for editing API or website; use Compose when you want containers without host Azurite/func/SWA. Root README: [Docker (optional)](../../../README.md#docker-optional).

Each app still has a **Dockerfile** for image builds; CD publishes test-tagged images to Docker Hub — see [CI/CD](../infra/cicd.md).

### Codespaces / Docker-in-Docker

If local Docker Desktop is awkward (especially on some Windows setups), GitHub Codespaces can run the estate with Docker-in-Docker. Prefer documenting Codespace specifics in app/repo Codespace config when that path is actively maintained.

## Visual Studio (API only)

Set `"api": { "mode": "off", "rebuild": false }` in `runtime.json` and debug the API with user secrets — [`apps/dert-api/README.md`](../../../apps/dert-api/README.md).

## Related

- [Architecture overview](../architecture/overview.md)
- [Configuration](../infra/configuration.md)
- [Secrets](../../../infra/secrets/README.md)
- [API integration tests](api-integration-tests.md)
- [Contributing workflow](contributing-workflow.md)
