# Existing OIDC apps can trust the organisation repository

## Summary of the work completed

GitHub Actions federated credentials now describe the immutable subject GitHub issues after the repository transfer. The subjects in [`github-azure-dev-credential.json`](../../../infra/configuration/github-azure-dev-credential.json) and [`github-azure-prd-credential.json`](../../../infra/configuration/github-azure-prd-credential.json) are `repo:dertinfo-org@347463852/dertinfo-mono@1286253466:environment:development` and `…:environment:production`. The credential names in those files stay `github-development` and `github-production`.

New operator scripts add that subject onto the Entra apps that already exist. Each run is one GitHub Environment, so development can be confirmed before production. They appear in [`Start-DertInfoControlPlane.ps1`](../../../infra/scripts/Start-DertInfoControlPlane.ps1):

- [`Update-DertInfoSubscriptionOidcIdentities.ps1`](../../../infra/scripts/Entra/Update-DertInfoSubscriptionOidcIdentities.ps1) — the subscription app for that Environment
- [`Update-DertInfoWorkloadOidcIdentities.ps1`](../../../infra/scripts/Entra/Update-DertInfoWorkloadOidcIdentities.ps1) — every workload app for that Environment
- [`Update-DertInfoWorkloadOidcIdentity.ps1`](../../../infra/scripts/Entra/Update-DertInfoWorkloadOidcIdentity.ps1) — one workload

[`Shared-DertInfoOidcFederatedCredential.ps1`](../../../infra/scripts/Entra/Shared-DertInfoOidcFederatedCredential.ps1) holds the compare-and-create logic. The control plane does not list it. The scripts do not create apps, service principals, or role assignments, and they do not change GitHub Environment variables. House docs: [GitHub Actions OIDC](../../technical/guides/github-azure-federated-credentials.md), [CI/CD](../../technical/infra/cicd.md), [scripts README](../../../infra/scripts/README.md).

## Why the work was completed

The repository moved from `dertinfo/dertinfo-mono` to `dertinfo-org/dertinfo-mono`. A GitHub Actions OIDC token subject includes the owner, so the credentials already on the apps no longer match tokens from the organisation repository. The app registrations, service principals, and role assignments are still the right identities. Replacing them would mint new client ids and force every GitHub Environment variable to change.

The create scripts skip a federated credential when its name already exists. Editing only the subject in the JSON file and re-running them would leave Entra unchanged. Entra also rejects a second credential with the same name. The update scripts compare the subject. When `github-development` or `github-production` already belongs to `repo:dertinfo/dertinfo-mono:...`, they add a second credential and leave the old one in place. The immutable subject keeps the `@` ids. The Entra name replaces `@` with `-`, so the new credentials are `github-development-dertinfo-org-347463852` and `github-production-dertinfo-org-347463852`.

## Date the work was started

2026-10-24

## Date the work was completed

2026-10-24

## Issues that were encountered on the way

- The create scripts treat the credential name as the idempotency key. A changed subject under `github-development` or `github-production` is skipped. The update scripts treat the subject as the key and derive a new name only when the JSON name is already used by a different subject.
- A credential name has to be unique on the app, and it cannot contain `@`. The new name is the JSON name plus the owner. For `repo:dertinfo-org@347463852/dertinfo-mono@1286253466:environment:development` that name is `github-development-dertinfo-org-347463852`. The subject stored on the credential keeps the `@` ids. The checked-in JSON name is left as the original credential.
- The first derived-name check rejected `dertinfo-org@347463852` because `@` is not a legal Entra credential-name character. The subject is still stored unchanged. Only the credential name replaces `@` with `-`.
- One subscription script that updated development and production together would not let an operator prove development login first. Both update entry points take `-GitHubEnvironment`.

## References to any best practices that we found

- [Immutable subject claims](https://docs.github.com/en/actions/reference/security/oidc) — a repository transfer after 15 July 2026 puts the owner id and repository id in the `sub` claim: `repo:OWNER@OWNER-ID/REPO@REPO-ID:environment:ENVIRONMENT`.
- [Migrate GitHub Actions federated credentials to immutable subjects](https://learn.microsoft.com/en-us/entra/workload-id/workload-identities-github-immutable-subjects) — Entra matches that subject exactly. Add the immutable credential and leave the name-based one until login succeeds.
- [Federated identity credentials](https://learn.microsoft.com/en-us/graph/api/resources/federatedidentitycredential) — each credential on an application has its own name. One app can hold more than one subject.
- House guide: [github-azure-federated-credentials.md](../../technical/guides/github-azure-federated-credentials.md). The `Remove-*` scripts delete the app, the service principal, and the role assignments. They are the wrong tool for deleting one old subject.

## Any remaining issues that we may wish to address

- The subscription and workload update scripts were run for `development` and `production`. `azure/login` from `dertinfo-org/dertinfo-mono` succeeded with the immutable subjects.
- Delete the `repo:dertinfo/dertinfo-mono:...` credential on each app with `az ad app federated-credential delete` if it is still present. Until then it still trusts the previous owner. Do not use the `Remove-*` scripts for that.
- The development API returned HTTP 500.31 until the ASP.NET Core 8 x86 runtime was installed from Kudu. A later subscription deploy and API infra deploy left the site up. That deploy is incremental, so it does not remove a site extension the template does not mention. [`appService.bicep`](../../../infra/bicep/api/appService.bicep) sets `netFrameworkVersion: 'v8.0'` and a 32-bit worker, and it does not install that runtime. A new site, or one whose extension is removed, can hit 500.31 again.
