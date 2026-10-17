# Temporary `workflow_dispatch` on src CI/CD

## Summary of the work completed

Src CI (`api` / `web` / `app` / `functions-src-ci.yml`) and src CD (`*-src-cd.yml`) can be run from the Actions tab. Src CD uses the same `target` input as infra CD (`full` | `dev-only`), default **`dev-only`**, so a manual run deploys development only. Production src CD jobs still run on push to `main`, or on dispatch with `target: full`. Infra CD already had `workflow_dispatch` and was not changed. Follow-up to remove the src triggers: [issue 116](https://github.com/dertinfo/dertinfo-mono/issues/116). Overview: [CI/CD](../../technical/infra/cicd.md).

## Why the work was completed

New-stack Azure settings (App Service names, OIDC, App Configuration) needed a real src deploy without a dummy commit under `apps/dert-api/**` (or the other app paths). Path-filtered push-to-`main` is the steady state; manual run is only for that testing window.

## Date the work was started

2026-09-07

## Date the work was completed

2026-09-07

## Issues that were encountered on the way

- GitHub only shows **Run workflow** after the workflow file exists on the **default branch**. The trigger is usable from the UI after [PR #28](https://github.com/dertinfo/dertinfo-mono/pull/28) merges (or via `gh workflow run --ref` once the file is on `main`).
- Src CD defaults to `dev-only` (safer while testing). Infra CD still defaults to `full`.

## References to any best practices that we found

- [Manually running a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow) (`workflow_dispatch`)
- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) — CD still lands via PR into `main`; dispatch does not replace that for application changes

## Any remaining issues that we may wish to address

- Remove src `workflow_dispatch` and the job `if:` conditions once hosted settings are confirmed ([issue 116](https://github.com/dertinfo/dertinfo-mono/issues/116)). Keep infra CD dispatch for Bicep re-runs without template diffs.
- First development API src deploy and the App Service SQL contained user: [2026-09-07-002](./2026-09-07-002-dev-api-sql-contained-user.md).
