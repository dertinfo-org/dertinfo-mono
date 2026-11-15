---
name: Technical guides
type: index
status: active
updated: 2026-11-15
---

# Technical guides

Cross-cutting how-tos. Configuration keys and CI/CD inventory stay under [infra/](../infra/).

| Guide | Topic |
|-------|-------|
| [Local development](local-development.md) | Run the whole estate on a developer machine |
| [Website smoke tests](website-smoke-tests.md) | Run the website end-to-end smoke suite and record video |
| [API integration tests](api-integration-tests.md) | Run `dertinfo-api.itests` from the command line |
| [Testing](../testing/README.md) | Suite map, test layout, and what a run may change. The Auth0 Management API write is [its own page](../testing/auth0-management.md) |
| [Contributing workflow](contributing-workflow.md) | Branches, PRs, and what happens after merge |
| [GitHub Azure federated credentials](github-azure-federated-credentials.md) | Entra OIDC so Actions can deploy without a client secret |
| [Production environment setup](production-environment-setup.md) | Stand up production, load config and data, test on Azure hostnames, then DNS |
| [Upgrading Angular](upgrading-angular.md) | Official Angular update pages, then the watch-list from each hop |
