# GitHub Actions CD pipelines for `test`

## Summary of the work completed

Migrated continuous delivery from Azure DevOps to GitHub Actions for the monorepo, targeting the **`test`** environment only. Each app has a path-filtered `*-cd.yml` workflow on `main` that builds, deploys to Azure, and publishes Docker images for local/dev use.

**Outcomes:**

- **API** — Windows `win-x86` publish, unit tests, OIDC deploy to App Service (`dertinfo-test-api-wa`), Docker image with `-test` tags
- **Functions** — .NET publish, OIDC deploy to Function App (`di-7olt-func-imageresizev4-stg`) with `app_type: functionApp`, Docker `-test` tags
- **Web** — Azure Static Web Apps deploy (app + API locations), Docker `-test` tags
- **App** — Azure Static Web Apps deploy (app only), Docker `-test` tags

Reusable workflows live at the top level of `.github/workflows/`:

| Workflow | Purpose |
|----------|---------|
| `reusable-src-build-push-docker.yml` | Docker Hub push (`latest-test` / `{run_id}-test` for test) |
| `reusable-src-deploy-dotnet-appservice.yml` | OIDC + App Service / Function App zip deploy |
| `reusable-src-deploy-static-web-app.yml` | SWA deploy with inherited secrets |

Operational setup (variables, secrets, OIDC, naming) is documented in [`docs/technical/infra/cicd.md`](../../technical/infra/cicd.md). Agent GitHub access is documented in [`docs/technical/infra/github-mcp-setup.md`](../../technical/infra/github-mcp-setup.md). What is still open from that later list is on GitHub: [API integration tests](https://github.com/dertinfo/dertinfo-mono/issues/122), [Ionic app Angular](https://github.com/dertinfo/dertinfo-mono/issues/123), [Linux API App Service](https://github.com/dertinfo/dertinfo-mono/issues/124), and [ADO decommission](https://github.com/dertinfo/dertinfo-mono/issues/125).

### Pull requests

| PR | Title |
|----|--------|
| [#2](https://github.com/dertinfo/dertinfo-mono/pull/2) | Fix CD workflows: move environment context into reusable deploy jobs |
| [#3](https://github.com/dertinfo/dertinfo-mono/pull/3) | Fix CD: move reusable workflows to `.github/workflows` top level |
| [#4](https://github.com/dertinfo/dertinfo-mono/pull/4) | Fix CD: grant `id-token: write` for reusable App Service deploy |
| [#5](https://github.com/dertinfo/dertinfo-mono/pull/5) | Tag test Docker images with `-test` suffix |
| [#6](https://github.com/dertinfo/dertinfo-mono/pull/6) | Fix SWA deploy: inherit repository secrets into reusable workflow |
| [#7](https://github.com/dertinfo/dertinfo-mono/pull/7) | Functions CD: use `functionApp` deploy type |

(PR #1 monorepo / Docker Compose merge preceded this workstream and is out of scope for this entry.)

## Date the work was started

2026-07-03

## Date the work was completed

2026-07-03

## Issues that were encountered on the way

1. **Invalid `environment` on reusable workflow callers**  
   Caller jobs used `environment: test` together with `uses:`. GitHub only allows a limited set of keys on `workflow_call` callers; `environment` is not one of them. Runs failed at parse time with **0 jobs**.  
   **Fix (PR #2):** Set `environment` only inside reusable workflows; resolve app names and OIDC vars there.

2. **Reusable workflows in a subfolder**  
   Paths like `.github/workflows/reusable/*.yml` are rejected: workflows must be defined at the **top level** of `.github/workflows/`.  
   **Fix (PR #3):** Renamed to `reusable-*.yml` at the top level.

3. **OIDC permissions not inherited**  
   Nested deploy jobs requested `id-token: write` but callers only allowed `id-token: none`.  
   **Fix (PR #4):** Callers grant `permissions: id-token: write` (and `contents: read`).

4. **Federated credential subject mismatch**  
   Entra federated credential was configured for `repo:…:ref:refs/heads/main`, but deploy jobs use GitHub Environment `test`, so the token subject is `repo:dertinfo/dertinfo-mono:environment:test`.  
   **Fix (config):** Federated credential entity type **Environment**, name `test`. Documented in [`docs/technical/infra/cicd.md`](../../technical/infra/cicd.md).

5. **Placeholder / missing Azure and Docker Hub config**  
   Early runs used a placeholder client ID; Docker push returned `denied: requested access to the resource is denied`.  
   **Fix (config):** Real Entra app registration + SP (Contributor on `dertinfo-test-rg` and `di-rg-imageresizev4-stg`), repository variables/secrets for OIDC, app names, and Docker Hub.

6. **Test Docker tags overwriting release tags**  
   Test CD pushed `latest` and `{run_id}`, which could overwrite production-oriented tags.  
   **Fix (PR #5):** Test environment tags are `latest-test` and `{run_id}-test`.

7. **SWA `deployment_token was not provided`**  
   Repository secrets existed, but reusable workflows do **not** receive repository secrets unless the caller uses `secrets: inherit` or passes secrets explicitly.  
   **Fix (PR #6):** `secrets: inherit` on Web and App `deploy-test` jobs.

8. **Functions workflow appeared failed while Azure deploy succeeded**  
   Overall run failed only because Docker push failed earlier; App Service/Function deploy had already succeeded.  
   **Fix (PR #7):** Use `app_type: functionApp` and re-run; full pipeline green including Docker after credentials were fixed.

## References to any best practices that we found

- **Variables vs secrets:** Non-sensitive config (resource names, client/tenant/subscription IDs, Docker Hub username) as GitHub **variables**; tokens and deploy keys as **secrets**. See [`.cursor/rules/cicd.mdc`](../../../.cursor/rules/cicd.mdc) and [`docs/technical/infra/cicd.md`](../../technical/infra/cicd.md).
- **Naming:** `[SERVICEPROVIDER]_[SERVICETYPE]_[WORKLOADNAME]_[DESCRIPTION]_[TARGETENV]` (e.g. `AZURE_WEBAPP_API_RESOURCENAME_STG`). Environment suffix `STG` / `PRD` maps to GitHub environments `test` / `prod`.
- **Reusable workflows:** Must live at `.github/workflows/` top level; callers must not set `environment:`; use `secrets: inherit` or explicit `secrets:` for credentials; grant `id-token: write` on callers that need OIDC.
- **OIDC for GitHub Environments:** Federated credential subject must match the job’s environment (`…:environment:test`), not only the branch ref.
- **Test image tags:** Never push untagged `latest` from test CD; use a `-test` suffix so release tags stay authoritative.
- **GitHub MCP for triage:** Fine-grained PAT + Actions/PR toolsets; see [`docs/technical/infra/github-mcp-setup.md`](../../technical/infra/github-mcp-setup.md).

## Any remaining issues that we may wish to address

- **Production CD** — Wire `prod` jobs, `*_PRD` variables/secrets, and Entra federated credentials for environment `prod`. That later landed; the current shape is [CI/CD](../../technical/infra/cicd.md).
- **API integration tests** — Still disabled (`if: false`) until SQL Server is available in CI. [Issue 122](https://github.com/dertinfo/dertinfo-mono/issues/122).
- **Functions IaC** — Bicep infra pipeline not yet migrated to GitHub Actions. That later landed; see [CI/CD](../../technical/infra/cicd.md).
- **ADO decommission** — Leave ADO pipelines disabled only after a full release cycle on GitHub Actions. [Issue 125](https://github.com/dertinfo/dertinfo-mono/issues/125).
- **Optional:** Make Docker push non-blocking for CD (deploy is the release path; Docker is for local/dev images), or fail the workflow only on deploy failure.
- **Optional:** Align API deploy `app_type` documentation with Functions (`functionApp` vs `webApp`) in runbooks.
