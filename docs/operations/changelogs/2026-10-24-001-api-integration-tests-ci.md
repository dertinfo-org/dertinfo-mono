# API integration tests run against SQL Server in CI and CD

## Summary of the work completed

The `integration-test` job in API source CI and CD now runs `dertinfo-api.itests` against a SQL Server service container. A failed test fails the workflow. On CD, `deploy-dev` waits for that job as well as `build` and `unit-test`, so a failure is not deployed to development. Production deploy already waits on `deploy-dev`, so it waits on the integration tests too.

Pull request: https://github.com/dertinfo-org/dertinfo-mono/pull/138

## Why the work was completed

The job existed and was switched off (`if: false`). [Issue 122](https://github.com/dertinfo-org/dertinfo-mono/issues/122) calls out that startup migration in `Startup.Configure` cannot connect without SQL Server, so integration coverage was local-only. A change that needs a real SQL connection was not checked before deploy.

`deploy-dev` now needs `integration-test` for that reason. `docker-dev` still needs only `build`. That matches unit tests: they gate the App Service deploy and do not gate the Docker Hub image used for local development.

The container `sa` password is a throwaway value in the workflow. It authenticates only to a SQL Server container that the job creates and destroys. It is not a hosted credential, so it is not a GitHub secret. The image tag is the same as `sqlserver` in root `docker-compose.yml`.

## Date the work was started

2026-10-24

## Date the work was completed

2026-10-24

## Issues that were encountered on the way

- The integration test host was a bare `HostBuilder`. That host does not load `appsettings.json` or environment variables, so a service container alone would not supply `SqlConnection__*`. The host now loads the test `appsettings.json` and process environment variables, with environment variables overriding the placeholders.
- The test `appsettings.json` had no `Cors:AllowedOrigins`. `Startup.ConfigureServices` splits that value and throws when it is missing, which happens before migration. The test file now has the same local origins as the API `appsettings.json`.
- xUnit would run the fixtures in parallel. Each fixture starts the API, and startup migrates one shared database. Parallelization is disabled for this assembly.
- Two group tests send a placeholder bearer token, and the single-group test expects group id 46. With that placeholder, both return 401 and `dotnet test` exits 1. They run only when `INTEGRATION_TEST_BEARER_TOKEN` is set. CI and CD do not set it, so those two are skipped and the status and anonymous group tests still run.

## References to any best practices that we found

- [Service containers](https://docs.github.com/en/actions/using-containerized-services/about-service-containers) — a job that runs on the runner reaches the container at `localhost` only when `ports` is set. [Redis service container example](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-redis-service-containers) shows the health-check options that wait until the service accepts connections.
- [Defining prerequisite jobs](https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow#defining-prerequisite-jobs) — `needs` so deploy does not start when a test job fails. A failed job does not cancel other jobs that do not list it.
- [Configuration in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/) — `SqlConnection__ServerName` maps to `SqlConnection:ServerName` and overrides JSON.
- [Password complexity](https://learn.microsoft.com/en-us/sql/relational-databases/security/password-policy) — the throwaway login meets SQL Server’s complexity rules without shell metacharacters.

## Any remaining issues that we may wish to address

- Authenticated group integration tests still need a real Auth0 access token and database rows that `EnsureSeedData` does not create (the single-group test expects id 46). They are skipped in CI until `INTEGRATION_TEST_BEARER_TOKEN` is set.
- `docker-dev` can still publish `latest-dev` when unit or integration tests fail, because it only waits on `build`. That was already true for unit tests.
