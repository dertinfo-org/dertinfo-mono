---
name: Planned fixes
type: index
status: active
updated: 2026-10-10
---

# Planned fixes

Open in-repo notes for work still to do in the solution. **Not a ticket backlog** — use GitHub Issues/Projects for tracking; keep notes here while implementing.

| Topic | File |
|-------|------|
| Remove legacy auth tables (access keys and old webpages membership) | [remove-legacy-auth-tables.md](remove-legacy-auth-tables.md) |
| Remove unused system settings (judge token, SMTP, storage container, DERT year) | [remove-unused-system-settings.md](remove-unused-system-settings.md) |
| Decouple Auth0 permission claims from database identity keys | [decouple-auth0-ids-from-database.md](decouple-auth0-ids-from-database.md) |
| Continue `npm run start` when a service is already up / port in use | [start-skip-running-services.md](start-skip-running-services.md) |
| Agent-safe Azure subscription foundation (subscription CD + policy + RG Actions) | [agent-safe-subscription-foundation.md](agent-safe-subscription-foundation.md) |
| Azure estate layout (dev/prd RGs, deploy scope, permission boundaries) — **parked** | [azure-estate-dev-prd.md](azure-estate-dev-prd.md) |
| Bicep (AVM) and infrastructure pipelines — **parked** | [bicep-avm-infra-pipelines.md](bicep-avm-infra-pipelines.md) |
| Hosting and cost decisions (durable technical doc) — **parked** | [hosting-cost-decisions.md](hosting-cost-decisions.md) |
| Website auth integration / e2e tests (M1–M5, S1–S7 still unscheduled; C4 stale Warmup is done) | [web-auth-integration-tests.md](web-auth-integration-tests.md) |
| CI/CD future phase | [cicd-future-phase.md](cicd-future-phase.md) |
| GitHub issue / PR templates | [github-issue-pr-templates.md](github-issue-pr-templates.md) |
| Storage Entra (managed identity) and App Configuration cleanup | [storage-managed-identity.md](storage-managed-identity.md) |
| Remove temporary `workflow_dispatch` from src CI/CD | [remove-src-workflow-dispatch.md](remove-src-workflow-dispatch.md) |
| Rebuild Auth0 tenants as `dertinfolocal` (local) and `dertinfodev` (Azure development) | [auth0-tenant-rename-local-dev.md](auth0-tenant-rename-local-dev.md) |
| Azure SQL firewall: App Service outbound IPs plus administrator IP (drop Allow Azure services) | [sql-firewall-app-service-and-admin.md](sql-firewall-app-service-and-admin.md) |
| Rename Bicep production leaf params `main.prod.bicepparam` → `main.prd.bicepparam` | [rename-bicepparam-prod-to-prd.md](rename-bicepparam-prod-to-prd.md) |
| Retire the old live and test Azure estates and their subscriptions | [retire-old-azure-estate.md](retire-old-azure-estate.md) |
| Website smoke walkthrough: product notes still to do | [smoke-walkthrough-future-work.md](smoke-walkthrough-future-work.md) |
| Website: Angular modernisation deferred on the 14 to 22 hops | [web-angular-deferred-modernisation.md](web-angular-deferred-modernisation.md) |

Resolved deep-dives: [investigations/](../investigations/).
