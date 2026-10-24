# API CI seeds the end-to-end pack and accepts a token only in the test host

## Summary of the work completed

API source CI runs the `dertinfo-api.itests` assembly against a SQL Server service container. The suite migrates on launch, then applies the end-to-end `system-basic` pack (events, groups, competitions, and the image files that pack names). Authenticated cases send a token built from the end-to-end Auth0 personas. The integration-test host trusts that token’s signing key. The API outside that host still validates Auth0. The job does not call Auth0. A failure fails the workflow. API source CD does not run integration tests. On a pull request, CI fails unless the pull request head already contains every commit on `main`.

Pull request: https://github.com/dertinfo-org/dertinfo-mono/pull/138

## Why the work was completed

The integration-test job existed and was switched off (`if: false`). [Issue 122](https://github.com/dertinfo-org/dertinfo-mono/issues/122) calls out that startup migration in `Startup.Configure` cannot connect without SQL Server, so that check was local-only.

CI on a pull request that already contains `main` is enough to validate the change. CD deploys that same commit after merge, so it does not start SQL Server again. `deploy-dev` still waits for `build` and `unit-test`.

A status check proves SQL and migration. It does not prove an authenticated request. The group fixtures needed a bearer token and rows at the ids in the persona claims. Calling Auth0 from CI would need tenant credentials. The test host instead signs a token from `tests/e2e/shared-data/auth0-personas.json` and accepts that signature only there. `tests/e2e/shared-state/apply.mjs system-basic` inserts the matching events and groups, and records `tests/e2e/shared-data/images`. Those files stay in the end-to-end tree for this change. A later move can put them where both suites read them.

The container `sa` password is a throwaway value in the workflow. It authenticates only to a SQL Server container that the job creates and destroys. It is not a hosted credential, so it is not a GitHub secret. The image tag is the same as `sqlserver` in root `docker-compose.yml`.

## Date the work was started

2026-10-24

## Date the work was completed

2026-10-24

## Issues that were encountered on the way

- The integration test host was a bare `HostBuilder`. That host does not load `appsettings.json` or environment variables, so a service container alone would not supply `SqlConnection__*`. The host now loads the test `appsettings.json` and process environment variables, with environment variables overriding the placeholders.
- The test `appsettings.json` had no `Cors:AllowedOrigins`. `Startup.ConfigureServices` splits that value and throws when it is missing, which happens before migration. The test file now has the same local origins as the API `appsettings.json`.
- xUnit would run the fixtures in parallel. Each fixture starts the API, and startup migrates one shared database. Parallelization is disabled for this assembly. One collection fixture migrates, then seeds, before the cases start the API again.
- Group tests used a placeholder bearer token and expected group id 46. The end-to-end pack inserts “The Simpsons” at id 1, which is the id on the `group-member` persona. The cases now use that persona and those ids.
- `apply.mjs` read only `infra/secrets/api.env`. CI has no copy of that file. When `SqlConnection__*` is set on the process, the script uses those values and encrypts the connection the same way Development startup does.
- The pack named `family.jpg` and `giraffe.jpg` but did not insert `Images` or the group and event joins. The script now inserts those rows when the file exists under `tests/e2e/shared-data/images`. It does not upload the bytes.
- A pull request workflow’s default checkout is a merge of the head with `main`. The up-to-date job checks out `github.event.pull_request.head.sha` and fails when `origin/main` is not an ancestor of that commit.

## References to any best practices that we found

- [Service containers](https://docs.github.com/en/actions/using-containerized-services/about-service-containers) — a job that runs on the runner reaches the container at `localhost` only when `ports` is set. [Redis service container example](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-redis-service-containers) shows the health-check options that wait until the service accepts connections.
- [Defining prerequisite jobs](https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow#defining-prerequisite-jobs) — `build` waits for the up-to-date job. A skipped up-to-date job (manual `workflow_dispatch`) still lets `build` run.
- [Configuration in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/) — `SqlConnection__ServerName` maps to `SqlConnection:ServerName` and overrides JSON.
- [Password complexity](https://learn.microsoft.com/en-us/sql/relational-databases/security/password-policy) — the throwaway login meets SQL Server’s complexity rules without shell metacharacters.
- [JwtBearer options](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.jwtbearer.jwtbeareroptions) — a configured `ConfigurationManager` supplies signing keys. The test host sets that manager so the handler does not fetch Auth0 metadata.

## Any remaining issues that we may wish to address

- The persona file, shared-state packs, and image files still live under `tests/e2e`. A later change can move them to a location both the API integration tests and the end-to-end tests read.
- This suite does not prove the live Auth0 Post Login Action still copies `app_metadata` into `https://dertinfo.co.uk/*` claims.
- `docker-dev` still waits only on `build`. Unit tests gate `deploy-dev` and do not gate the Docker Hub image.
