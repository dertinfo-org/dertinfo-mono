# API CI seeds its own database and accepts a token only in the test host

## Summary of the work completed

API source CI runs the `dertinfo-api.itests` assembly against a SQL Server service container. The suite migrates on launch, then inserts the event, groups, and image rows that ship in that test project. Authenticated cases send a token signed from the persona claims in that project. The integration-test host trusts that token’s signing key. The API outside that host still validates Auth0. The job does not call Auth0, and it does not run the website or app Playwright suite. A failure fails the workflow. API source CD does not run integration tests. On a pull request, CI fails unless the pull request head already contains every commit on `main`.

Pull request: https://github.com/dertinfo-org/dertinfo-mono/pull/138

## Why the work was completed

The integration-test job existed and was switched off (`if: false`). [Issue 122](https://github.com/dertinfo-org/dertinfo-mono/issues/122) calls out that startup migration in `Startup.Configure` cannot connect without SQL Server, so that check was local-only.

CI on a pull request that already contains `main` is enough to validate the change. CD deploys that same commit after merge, so it does not start SQL Server again. `deploy-dev` still waits for `build` and `unit-test`.

A status check proves SQL and migration. It does not prove an authenticated request. The group fixtures needed a bearer token and rows at the ids in the persona claims. Calling Auth0 from CI would need tenant credentials. The test host signs a token from persona claims that live in `dertinfo-api.itests`, and accepts that signature only there. The same project inserts the event, groups, and image rows in `IntegrationTestData`. The cases compare each response with those records. The Playwright tree is left unchanged, so removing it would leave the API tests able to migrate, seed, and sign a token.

The container `sa` password is a throwaway value in the workflow. It authenticates only to a SQL Server container that the job creates and destroys. It is not a hosted credential, so it is not a GitHub secret. The image tag is the same as `sqlserver` in root `docker-compose.yml`.

## Date the work was started

2026-10-24

## Date the work was completed

2026-10-24

## Issues that were encountered on the way

- The integration test host was a bare `HostBuilder`. That host does not load `appsettings.json` or environment variables, so a service container alone would not supply `SqlConnection__*`. The host now loads the test `appsettings.json` and process environment variables, with environment variables overriding the placeholders.
- The test `appsettings.json` had no `Cors:AllowedOrigins`. `Startup.ConfigureServices` splits that value and throws when it is missing, which happens before migration. The test file now has the same local origins as the API `appsettings.json`.
- xUnit would run the fixtures in parallel. Each fixture starts the API, and startup migrates one shared database. Parallelization is disabled for this assembly. One collection fixture migrates, then seeds, before the cases start the API again.
- Group tests used a placeholder bearer token and expected group id 46. The cases now take the group-member persona and compare each response with the records in `IntegrationTestData` for that persona. The fixture names and assertions do not name the contents of those records.
- A pull request workflow’s default checkout is a merge of the head with `main`. The up-to-date job checks out `github.event.pull_request.head.sha` and fails when `origin/main` is not an ancestor of that commit.

## References to any best practices that we found

- [Service containers](https://docs.github.com/en/actions/using-containerized-services/about-service-containers) — a job that runs on the runner reaches the container at `localhost` only when `ports` is set. [Redis service container example](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-redis-service-containers) shows the health-check options that wait until the service accepts connections.
- [Defining prerequisite jobs](https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow#defining-prerequisite-jobs) — `build` waits for the up-to-date job. A skipped up-to-date job (manual `workflow_dispatch`) still lets `build` run.
- [Configuration in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/) — `SqlConnection__ServerName` maps to `SqlConnection:ServerName` and overrides JSON.
- [Password complexity](https://learn.microsoft.com/en-us/sql/relational-databases/security/password-policy) — the throwaway login meets SQL Server’s complexity rules without shell metacharacters.
- [JwtBearer options](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.jwtbearer.jwtbeareroptions) — a configured `ConfigurationManager` supplies signing keys. The test host sets that manager so the handler does not fetch Auth0 metadata.

## Any remaining issues that we may wish to address

- The API tests carry their own copy of the event, group, image names, and persona claims. When that data moves to a location shared with the website and app tests, this copy can move with it.
- The API seed does not insert competitions, dances, or venues. The group and status cases do not call those endpoints.
- This suite does not prove the live Auth0 Post Login Action still copies `app_metadata` into `https://dertinfo.co.uk/*` claims.
- `docker-dev` still waits only on `build`. Unit tests gate `deploy-dev` and do not gate the Docker Hub image.
