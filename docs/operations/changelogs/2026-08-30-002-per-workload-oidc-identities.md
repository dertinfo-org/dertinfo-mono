# Per-workload Entra OIDC identities and GitHub Environment variables

## Summary of the work completed

Workload infra CD and API / Functions Src CD no longer log in as the subscription foundation service principal. Each workload has its own Entra app per GitHub Environment (`dertinfo-github-workload-<part>-development` / `-production`). Pipelines use `AZURE_ENTRA_OIDC_CLIENTID_WORKLOAD_<PART>`. Subscription Bicep grants that SP Contributor on its own resource group (plus the extra RG-scoped roles storage and API need) using `AZURE_ENTRA_OIDC_PRINCIPALID_WORKLOAD_<PART>`.

The shared tenant variable is `AZURE_ENTRA_OIDC_TENANTID` (was `AZURE_ENTRA_OIDC_TENANTID_SUBSCRIPTION`). `AZURE_ENTRA_OIDC_CLIENTID_SUBSCRIPTION` remains for subscription foundation CD only.

Operator scripts: [`New-DertInfoWorkloadOidcIdentity.ps1`](../../../infra/scripts/New-DertInfoWorkloadOidcIdentity.ps1), [`Remove-DertInfoWorkloadOidcIdentity.ps1`](../../../infra/scripts/Remove-DertInfoWorkloadOidcIdentity.ps1), and master [`New-DertInfoWorkloadOidcIdentities.ps1`](../../../infra/scripts/New-DertInfoWorkloadOidcIdentities.ps1) (one Environment at a time; copy-paste GitHub variable output). House docs: [CI/CD](../../technical/infra/cicd.md), [GitHub Actions OIDC](../../technical/guides/github-azure-federated-credentials.md), [scripts README](../../../infra/scripts/README.md).

Open PR: https://github.com/dertinfo/dertinfo-mono/pull/22

## Why the work was completed

The subscription SP has User Access Administrator on the whole subscription. Using it for workload deploys would let a compromised or mis-aimed config/storage/api run elevate itself anywhere in that subscription. Each workload needed an identity that can only act on its own resource group (and the few extra RGs Bicep already reads or assigns into). Client id and object id are stored separately because OIDC login uses the app (client) id and Azure RBAC uses the service principal object id; ARM cannot resolve one from the other without Microsoft Graph permissions on the privileged subscription SP.

## Date the work was started

2026-08-30

## Date the work was completed

2026-08-30

## Issues that were encountered on the way

- GitHub Environment-scoped `vars` are not available on a caller job that only `uses:` a reusable. Callers pass `azure_oidc_workload` (`CONFIG`, `API`, …); the reusable reads `vars.AZURE_ENTRA_OIDC_CLIENTID_WORKLOAD_<PART>` after `environment:` is set.
- A first idea to reuse the subscription SP for workload CD was dropped because of User Access Administrator blast radius.
- Bicep cannot look up an object id from a client id without the Graph extension and directory-read rights on the deploy identity. Both ids stay GitHub Environment variables; the master script prints them together.

## References to any best practices that we found

- [GitHub Actions OIDC to Azure](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect)
- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)
- [Store configuration in GitHub Environments](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables) — Environment `vars` apply to jobs that reference that Environment
- House OIDC guide: [github-azure-federated-credentials.md](../../technical/guides/github-azure-federated-credentials.md)

## Any remaining issues that we may wish to address

- Operator must run the master script for `development` (then `production`), paste client ids and principal ids, and rename `AZURE_ENTRA_OIDC_TENANTID_SUBSCRIPTION` to `AZURE_ENTRA_OIDC_TENANTID`.
- Re-run subscription infra CD after the principal ids are set so RG role assignments exist (API: Reader on config and monitoring, conditioned UAA on config; storage: Contributor on storage only — see [2026-08-30-003](./2026-08-30-003-entra-only-sql-groups.md)) and workload resource providers are registered, then test a workload infra CD (for example config).
- API UAA on the config RG is now conditioned (App Configuration Data Reader + Key Vault Secrets User only). Incremental ARM does not drop leftover unconstrained UAA or all-RG Contributor from the old single-`pipelinePrincipalId` loop — remove those assignments in Azure if they remain.
- Functions still has no new-stack resource group; `CLIENTID_WORKLOAD_FUNCTIONS` is created for Src CD later.
- Web/app Src CD still use SWA tokens; their Entra apps exist for later infra.
