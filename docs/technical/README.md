---
name: Technical documentation
type: index
status: active
updated: 2026-11-15
---

# Technical documentation

**HOW** the platform is built and run.

| Area | Purpose |
|------|---------|
| [architecture/](architecture/) | Estate structure and subsystem responsibilities |
| [subsystems/](subsystems/) | Deep dives (Auth0, security, …) |
| [standards/](standards/) | Technology conventions (Angular, Bicep, PowerShell, …) |
| [guides/](guides/) | Cross-cutting how-tos (local estate, website smoke tests, API integration tests, contributing, GitHub Azure OIDC, production setup, upgrading Angular) |
| [testing/](testing/) | How the suites start, how a test is laid out, and what a run may change (including Auth0 Management API edits) |
| [infra/](infra/) | Configuration, CI/CD, secrets rotation, agent GitHub MCP |

API endpoints and schemas: OpenAPI / Swagger via [`packages/shared-contracts/`](../../packages/shared-contracts/) — not duplicated here.

See [Documentation guide](../documentation-guide.md).
