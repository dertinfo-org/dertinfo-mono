# Subscription OIDC isolation and successful development CD

## Summary of the work completed

Hardened and verified the **agent-safe subscription foundation** after the initial merge ([change log 2026-08-15 foundation landing](./2026-08-15-001-subscription-foundation-cd.md)):

- **Isolated Entra app registrations** — separate subscription-scope apps/SPs for GitHub Environments **`development`** and **`production`** (replacing the earlier shared identity). Development SP has RBAC only on DertInfo Development; production SP only on DertInfo Production.
- **Why:** On a public monorepo, a single SP with rights on both subscriptions enlarges blast radius if OIDC or GitHub write access is abused. Isolation keeps a development compromise from administering production Azure.
- **Operator scripts** — [`New-DertInfoSubscriptionOidcIdentities.ps1`](../../../infra/scripts/New-DertInfoSubscriptionOidcIdentities.ps1) (create both identities + federated credentials + RBAC) and [`Remove-DertInfoSubscriptionOidcIdentity.ps1`](../../../infra/scripts/Remove-DertInfoSubscriptionOidcIdentity.ps1) (tear down one client id). Documented in [`infra/scripts/README.md`](../../../infra/scripts/README.md) and the [OIDC guide](../../technical/guides/github-azure-federated-credentials.md).
- **Production subscription** — DertInfo Production created; GitHub **`production`** Environment variables pointed at it (SP role assignment on that subscription before first prod CD run).
- **Development CD verified** — **Subscription infra CD** ran successfully from `main` against **development** (after follow-up fixes for `id-token` permissions and the Allowed resource types policy GUID).
- **Docs** — OIDC guide and CI/CD notes aligned with isolation; security review recorded under [`operations/security/`](../security/).

### Pull requests

| PR | Title |
|----|--------|
| [#17](https://github.com/dertinfo/dertinfo-mono/pull/17) | Fix subscription CD OIDC permissions and MCP setup docs |
| [#18](https://github.com/dertinfo/dertinfo-mono/pull/18) | Fix Allowed resource types policy definition GUID |
| [#19](https://github.com/dertinfo/dertinfo-mono/pull/19) | OIDC isolation docs, workflow security review, and DEV/PRD acronyms |

## Date the work was started

2026-08-15

## Date the work was completed

2026-08-15

## Issues that were encountered on the way

1. **Shared subscription SP abandoned**  
   First setup used one app for both Environments. Replaced with isolated apps so production RBAC is never granted to the development identity.

2. **Earlier merge was untested in Actions**  
   Workflows had to land on `main` before they were visible; first runs failed on `id-token: write` (caller permissions) and a typo’d built-in policy GUID (`…5c51` → `…5c5c`). Fixed in #17 / #18. See [2026-08-15-001-subscription-foundation-cd.md](./2026-08-15-001-subscription-foundation-cd.md).

3. **Empty subscriptions have no default policy assignments**  
   New Development/Production subscriptions did not inherit “default” assignments; foundation Bicep assigns DertInfo allow-lists. Incremental ARM deploy does not remove unrelated assignments.

## References to any best practices that we found

- **One Entra app + SP per GitHub Environment** for privileged subscription deploy — [OIDC guide](../../technical/guides/github-azure-federated-credentials.md), [security review](../security/github-workflows-security-review.md)
- **Environment required reviewers** (`dertinfo` / `davidsmonkeys`) before `azure/login` — Azure gate separate from who can queue a workflow
- **OIDC without client secrets**; Environment-scoped federated subjects only
- **Operator scripts** for create/remove to avoid drift and accidental shared SPs

## Any remaining issues that we may wish to address

- **Production subscription CD** — confirm Production SP RBAC, then first `workflow_dispatch` target `prod`
- **Policy deny smoke test** — [issue 126](https://github.com/dertinfo/dertinfo-mono/issues/126). Workload identities later replaced the optional RG deploy identity (`AZURE_ENTRA_OIDC_PRINCIPALID_RG`).
- **Branch protection on `main`** — strengthen “project people” merge gate alongside Environment reviewers (called out in the security review)
- Estate layout and workload Bicep were later built. See [CI/CD](../../technical/infra/cicd.md) and [Bicep standards](../../technical/standards/bicep/README.md).
