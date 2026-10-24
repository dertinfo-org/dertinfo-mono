# API CI checks SQL with one status test, and the pull request contains main

## Summary of the work completed

API source CI runs one integration test against a SQL Server service container: `Check_Status_Controller_Returns_Response`. That test starts the API, which migrates on launch, then expects `GET /api/status` to return 200. A failure fails the workflow. API source CD does not run integration tests. On a pull request, CI fails unless the pull request head already contains every commit on `main`.

Pull request: https://github.com/dertinfo-org/dertinfo-mono/pull/138

## Why the work was completed

The integration-test job existed and was switched off (`if: false`). [Issue 122](https://github.com/dertinfo-org/dertinfo-mono/issues/122) calls out that startup migration in `Startup.Configure` cannot connect without SQL Server, so that check was local-only.

CI on a pull request that already contains `main` is enough to validate the change. CD deploys that same commit after merge, so it does not start SQL Server again. `deploy-dev` still waits for `build` and `unit-test`.

The status test is the environment check. It is the only integration test the CI job runs. The group fixtures stay in the project for a local run and are outside this job.

The container `sa` password is a throwaway value in the workflow. It authenticates only to a SQL Server container that the job creates and destroys. It is not a hosted credential, so it is not a GitHub secret. The image tag is the same as `sqlserver` in root `docker-compose.yml`.

## Date the work was started

2026-10-24

## Date the work was completed

2026-10-24

## Issues that were encountered on the way

- The integration test host was a bare `HostBuilder`. That host does not load `appsettings.json` or environment variables, so a service container alone would not supply `SqlConnection__*`. The host now loads the test `appsettings.json` and process environment variables, with environment variables overriding the placeholders.
- The test `appsettings.json` had no `Cors:AllowedOrigins`. `Startup.ConfigureServices` splits that value and throws when it is missing, which happens before migration. The test file now has the same local origins as the API `appsettings.json`.
- xUnit would run the fixtures in parallel. Each fixture starts the API, and startup migrates one shared database. Parallelization is disabled for this assembly.
- Two group tests send a placeholder bearer token, and the single-group test expects group id 46. With that placeholder, both return 401. They are not part of the CI job.
- A pull request workflow’s default checkout is a merge of the head with `main`. The up-to-date job checks out `github.event.pull_request.head.sha` and fails when `origin/main` is not an ancestor of that commit.

## References to any best practices that we found

- [Service containers](https://docs.github.com/en/actions/using-containerized-services/about-service-containers) — a job that runs on the runner reaches the container at `localhost` only when `ports` is set. [Redis service container example](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-redis-service-containers) shows the health-check options that wait until the service accepts connections.
- [Defining prerequisite jobs](https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow#defining-prerequisite-jobs) — `build` waits for the up-to-date job. A skipped up-to-date job (manual `workflow_dispatch`) still lets `build` run.
- [Configuration in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/) — `SqlConnection__ServerName` maps to `SqlConnection:ServerName` and overrides JSON.
- [Password complexity](https://learn.microsoft.com/en-us/sql/relational-databases/security/password-policy) — the throwaway login meets SQL Server’s complexity rules without shell metacharacters.

## Any remaining issues that we may wish to address

- Authenticated group integration tests still need a real Auth0 access token and database rows that `EnsureSeedData` does not create (the single-group test expects id 46). They run locally when `INTEGRATION_TEST_BEARER_TOKEN` is set. CI does not run them.
- `docker-dev` still waits only on `build`. Unit tests gate `deploy-dev` and do not gate the Docker Hub image.
