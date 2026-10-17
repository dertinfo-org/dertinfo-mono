# New-stack Bicep, GitHub Flow, and src/infra CD

## Summary of the work completed

Added RG-scoped Bicep under `infra/bicep/` for **config** (Key Vault + App Configuration Free), **monitoring** (Log Analytics with a 1 GB/day ingest cap + Application Insights), **storage** (images Storage Account always; SQL Basic when prerequisites exist), and **api** (Windows App Service when prerequisites exist). Subscription foundation now includes a `monitoring` resource group and extra RBAC on the config RG (Key Vault Secrets User + User Access Administrator). Infra CD workflows deploy each part to GitHub Environments `development` then gated `production`.

Aligned branching with [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow): no `develop` branch. Path-filtered `*-src-ci.yml` runs on pull requests **into `main`**. `*-src-cd.yml` and `*-infra-cd.yml` run on **push to `main`**. Reusable workflows are `reusable-src-*` and `reusable-infra-*`. Cursor rule [`.cursor/rules/github-flow.mdc`](../../../.cursor/rules/github-flow.mdc) replaces gitflow.

Changelog detail pages are `YYYY-MM-DD-NNN-short-slug.md` so several entries on one day sort in the file list. House guidance: [changelogs.mdc](../../../.cursor/rules/changelogs.mdc), [changelog index](./README.md), [documentation guide](../../documentation-guide.md).

Bicep house rules: [docs/technical/standards/bicep/](../../technical/standards/bicep/). CI/CD: [cicd.md](../../technical/infra/cicd.md). Contributing: [contributing workflow](../../technical/guides/contributing-workflow.md). A future Linux App Service move is [issue 124](https://github.com/dertinfo/dertinfo-mono/issues/124).

## Why the work was completed

The monorepo needed a new Azure stack (development and production) that can be deployed from GitHub Actions while live traffic stays on the existing repos and Azure DevOps. That meant IaC for each workload part, cheap SKUs (SQL Basic, Local backup, 1 GB/day Log Analytics), and subscription policy that still denies unexpected resource types and SKUs.

We wanted infra deploys to succeed even when an upstream part is missing (`prerequisitesExist`), and we wanted pipeline names to say whether they ship **src** or **infra**. Branching was simplified to GitHub Flow (`main` only): CI on the PR, CD after merge, so `develop` is not an integration branch. Changelog filenames gained a same-day sequence so several entries on one date stay ordered in the file list.

## Date the work was started

2026-08-30

## Date the work was completed

2026-08-30

## Issues that were encountered on the way

- Key Vault names cannot include the `config` part token (`kv-<env>-dertinfo-config-uks` is 26 characters). Used `kv-<env>-dertinfo-uks` (19).
- Storage account names cannot contain hyphens. Used `stdevdertinfoimagesuks` / `stprddertinfoimagesuks` (`prd`, not `prod`) so the account is identified as public images, leaving room for other (non-public) accounts in the same RG.
- AVM `web/site` 0.24.0 does not accept `appSettingsKeyValuePairs`; app settings go on `siteConfig.appSettings`. Publishing credential policies are an array, not an object.
- `existing` + `getSecret()` must live in a local module gated by `prerequisitesExist`, or ARM looks up the Key Vault even when SQL is skipped.
- The subscription policy module kept the App Service and SQL SKU assignments but dropped the built-in **Allowed resource types** assignment (`di-policy-allowed-types-<env>`). That was restored with the extended allow-list (KV secrets, App Config key-values, LAW/AI children, SQL/storage extras, `Microsoft.Web/sites/extensions`). Incremental ARM would have left the existing Azure assignment in place with the old list; IaC would have stopped updating it.
- Azure SQL cannot turn off automated backups. Development uses 1-day PITR (the minimum); production uses 7-day PITR with **Local** backup storage redundancy. Policy allow-list includes `Microsoft.Sql/servers/databases/backupShortTermRetentionPolicies`.
- Path-filtered CI jobs are skipped when a PR does not touch those paths. If those job names are **required** status checks, GitHub can block the PR. Use a ruleset that allows skipped checks, or only require checks that always run.
- Two 2026-08-30 changelog pages were still untracked, so `git mv` failed for those; they were renamed on disk instead.

## References to any best practices that we found

- [Extendable parameter files](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/bicep-extend)
- [Use Key Vault to pass a secret during Bicep deployment](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/key-vault-parameter) (`enabledForTemplateDeployment` + `getSecret()`)
- [Azure Verified Modules](https://aka.ms/avm) — call AVM from `main.bicep`; pin versions
- [Bicep standards](../../technical/standards/bicep/)
- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)
- [Required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)
- Zero-padded changelog sequence (`001`) keeps lexical sort aligned with chronological order

## Any remaining issues that we may wish to address

- Operator must seed `sql-dertinfo-storage-administrator-login` and `sql-dertinfo-storage-administrator-password` in each Key Vault, set `prerequisitesExist` (and `sqlAdministratorLogin`) in the storage param file, then re-run storage infra CD. Flip API `prerequisitesExist` after config KV, App Configuration, and Application Insights exist.
- Populate App Configuration labelled keys (Auth0, SQL connection shape, and so on) so the API can start against the new stack.
- Re-run subscription foundation CD so the `monitoring` RGs and config-RG extra roles exist.
- Web / app / functions src CD will fail until those Azure resources and tokens exist.
- Linux App Service migration ([issue 124](https://github.com/dertinfo/dertinfo-mono/issues/124)).
- Image blob storage public access is enabled to match the current API; tighten later if the app moves to private blobs.
- Turn on branch protection / a ruleset on `main`: require a PR, require up-to-date branches, and require the CI job names that should gate merge. This cannot be done from workflow YAML alone.
