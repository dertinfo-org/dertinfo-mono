---
name: Contributing workflow
type: guide
status: active
updated: 2026-10-17
---

# Contributing workflow (branches and PRs)

How contributors branch, raise PRs, and what happens after merge in the **monorepo**.

This repo uses [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow): feature branches and PRs into **`main` only**. There is no `develop` integration branch. Cursor rule: [`.cursor/rules/github-flow.mdc`](../../../.cursor/rules/github-flow.mdc).

The legacy wiki [Branching approach for DertInfo](https://github.com/dertinfo/dertinfo/wiki/Branching-approach-for-DertInfo) described gitflow (`develop` / release). Prefer this page where they differ.

## Branching

- **main** is protected; change it only via pull request.
- Name branches `feature/…` or `hotfix/…`. Issue numbers in the name help (`feature/123-short-description`).
- Older wiki convention used dated prefixes (`feature/20240912-34-…`, `docs/…`, `upgrade/…`). That remains readable if you encounter old branches.

### Typical flow

1. Update `main`: `git pull`.
2. Create a focused branch from `main`.
3. Before opening a PR: merge or rebase the latest `main` into your branch so the PR is conflict-free.
4. Open a PR **into `main`**. Path-filtered src CI (`*-src-ci.yml`) runs on the PR head. Required checks must pass before merge.

## After merge

A merge to `main` is a **push**, which starts **CD**. See [CI/CD](../infra/cicd.md).

| Concern | Today |
|---------|--------|
| Src CI | Path-filtered `*-src-ci.yml` on pull requests into `main`. Temporary: `workflow_dispatch` ([remove later](https://github.com/dertinfo/dertinfo-mono/issues/116)). |
| Src CD | `*-src-cd.yml` on push to `main` → Environment `development`, then gated `production`. Temporary: `workflow_dispatch` (`dev-only` / `full`). |
| Infra CD | `*-infra-cd.yml` on push to `main` or `workflow_dispatch` → same Environments |

Hosted apps use Azure Static Web Apps (SPAs) and App Service / Function App (.NET), not containers in Azure. Docker images support local/dev consumption.

### Historical (wiki / pre-monorepo)

Separate repos used Azure DevOps YAML under `/pipelines` for Docker Hub publish, staging release (with a manual prod gate), and Bicep infra. That YAML is no longer in this repo. GitHub Actions is the deploy path.

## Related

- [CI/CD](../infra/cicd.md)
- [CONTRIBUTING.md](../../../CONTRIBUTING.md)
- [Local development](local-development.md)
