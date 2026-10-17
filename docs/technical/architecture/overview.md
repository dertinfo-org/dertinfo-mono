---
name: System architecture overview
type: architecture
status: active
updated: 2026-10-17
---

# System architecture overview

## Purpose

High-level view of the DertInfo platform as a set of deployable subsystems. This page describes **what** each part is responsible for and how they relate. Per-app install and debug steps stay in each app’s README.

Source material includes the legacy [dertinfo wiki Home](https://github.com/dertinfo/dertinfo/wiki/Home), updated for the monorepo.

## Subsystems

| Subsystem | Path | Responsibility |
|-----------|------|----------------|
| API | [`apps/dert-api/`](../../../apps/dert-api/) | Core business logic, HTTP API, EF Core / SQL Server, Auth0 JWT validation, persistence and storage connections |
| Website | [`apps/dert-web/`](../../../apps/dert-web/) | Primary website; most organiser / management functionality (Angular SPA via Static Web Apps / SWA CLI locally) |
| App (PWA) | [`apps/dert-app/`](../../../apps/dert-app/) | Mobile-oriented PWA: collect scores during competition; teams view score sheets and published results |
| Image resize | [`apps/dert-functions/`](../../../apps/dert-functions/) | Azure Functions worker: process uploaded images to usable sizes for the web. URL layout: [Images](../subsystems/images.md) |
| Shared contracts | [`packages/shared-contracts/`](../../../packages/shared-contracts/) | OpenAPI / Swagger contract and generated TypeScript clients |

Supporting local infrastructure (not product features): SQL Server, Azurite (blob/queue/table), and optional Docker Compose services. See [Local development](../guides/local-development.md) and [Configuration](../infra/configuration.md).

![Estate architecture diagram](https://github.com/user-attachments/assets/bd69f549-5a24-43c9-beab-a7f10bcbf1ed)

## External dependencies

| Service | Role | Local / hosted notes |
|---------|------|----------------------|
| Auth0 | User accounts and tokens | Dev / staging / production tenants — see [Authentication](../subsystems/authentication.md) |
| SQL Server | Primary database | Azure SQL when hosted; local SQL Express or Compose SQL on port `44000` |
| Azure Event Grid | Eventing where used | Prefer local equivalents when practical |
| Azure App Configuration | Hosted configuration overlay | Used when `AZURE_APP_CONFIG` is set; **local** uses `appsettings.json` + [`infra/secrets/api.env`](../../../infra/secrets/) (or user secrets) |
| Azure Key Vault | Hosted secrets | Referenced from App Configuration when hosted; local uses `api.env` / user secrets |
| SendGrid | Transactional email | Typically disabled in Development |

Per-workload integration detail lives with each app README and [Configuration](../infra/configuration.md).

## Data and API contracts

Endpoint and schema documentation lives in the **OpenAPI / Swagger** definition under shared contracts (and the API’s Swagger UI when running). Do not duplicate endpoint or table catalogues under `docs/technical/`.

## Local estate topology

Fixed local ports (native or Docker):

| Port | Service |
|------|---------|
| 44000 | SQL Server (Compose / codespace-style DB; host SQL Express may use a named instance instead) |
| 44100 | API |
| 44200 | Website (SWA) |
| 44300 | App / PWA (SWA) |
| 44400 | Image resize Functions |
| 10000–10002 | Azurite (blob / queue / table) |

Orchestration: `npm run doctor` / `start` / `stop` / `status` — see [Local development](../guides/local-development.md).

## Getting started per subsystem

| Subsystem | Getting started |
|-----------|-----------------|
| API | [`apps/dert-api/README.md`](../../../apps/dert-api/README.md) |
| Website | [`apps/dert-web/README.md`](../../../apps/dert-web/README.md) |
| App | [`apps/dert-app/README.md`](../../../apps/dert-app/README.md) |
| Functions | [`apps/dert-functions/README.md`](../../../apps/dert-functions/README.md) |
| Whole estate | [Root README — first-time setup](../../../README.md#first-time-setup-clone--running-locally) |

## Related technical topics

- [Authentication (Auth0)](../subsystems/authentication.md)
- [Security](../subsystems/security.md) (CORS, storage firewall, Flex One Deploy identity)
- [Hosting and cost](hosting-and-cost.md)
- [CI/CD](../infra/cicd.md)
- [Secrets inventory and rotation](../infra/secrets-and-rotation.md)
