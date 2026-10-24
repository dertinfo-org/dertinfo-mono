# Source workflows grant the GitHub token read access to contents

## Summary of the work completed

Source CI workflows, source CD workflows, and the Docker image reusable workflow set `permissions: contents: read` on `GITHUB_TOKEN`. Jobs that deploy to Azure keep their own permission block, including `id-token: write` for OpenID Connect. Static Web App deploy jobs keep `actions: read`.

Pull request: https://github.com/dertinfo-org/dertinfo-mono/pull/138

## Why the work was completed

CodeQL rule `actions/missing-workflow-permissions` reports a workflow that never sets `permissions`. The token then uses the organization default. Organizations created before February 2023 default that token to read-write. These workflows check out the repository, build, and pass artifacts. They do not need write access to contents, pull requests, or packages. Writing the scope on the workflow keeps it read-only if the organization default changes, and it records what the workflow actually uses. See [CI/CD](../../technical/infra/cicd.md).

## Date the work was started

2026-10-24

## Date the work was completed

2026-10-24

## Issues that were encountered on the way

- A permission block on a job replaces the workflow block for that job. The Azure deploy jobs already list `id-token: write` and `contents: read`, so the workflow-level read scope does not remove the OpenID Connect token from those jobs.
- The Docker reusable workflow publishes to Docker Hub with `DOCKERHUB_TOKEN`. It does not publish to GitHub Packages, so `packages: write` is not set.

## References to any best practices that we found

- [Assigning permissions to jobs](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs) — unset scopes in a `permissions` block are none. A job-level block replaces the workflow-level block.
- [Permissions for the GITHUB_TOKEN](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token) — `contents: read` is the checkout scope. Repositories created before February 2023 may still default the token to permissive access.

## Any remaining issues that we may wish to address

- If a build job reports that an artifact download is not accessible after this restriction, that job needs `actions: read`. The Static Web App deploy jobs already set that scope.
