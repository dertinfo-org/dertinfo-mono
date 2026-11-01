# Local development guide lists how to build and run each component

## Summary of the work completed

[Local development](../../technical/guides/local-development.md) keeps the recommended path as the native estate: `npm run doctor`, `npm run start`, `npm run status`, and `npm run stop`.

A **Native builds** section now gives the build command and the run command for each component:

- API: `dotnet build`, then `dotnet run` after `infra/secrets/api.env` is loaded into the process environment
- Website: `cd` into `apps/dert-web/src/client`, then `ng build` and `ng serve`, with `swa start` on port 44200
- PWA: the same in `apps/dert-app/src/client`, with `ng serve --port 4201` and `swa start` on port 44300
- Image resize: `dotnet build` of `DertInfoImageResizeV4.csproj`, then `func start --script-root` on `bin/Debug/net8.0`
- Azurite and SQL

The hybrid section points at [Full Docker Compose](../../technical/guides/local-development.md#full-docker-compose) for building and running one service in Docker, instead of repeating those commands.

## Why the work was completed

The guide told people to start the whole estate, and it did not say how to build one component and then run it with that component’s own tool. The API needs `infra/secrets/api.env` when it is started with `dotnet run`. The website and PWA are Angular apps, so the commands are `ng` and `swa`. Image resize is `dotnet build` and `func start`.

## Date the work was started

2026-11-01

## Date the work was completed

2026-11-01

## Issues that were encountered on the way

The first drafts mixed the recommended `npm run start` path with per-component commands, and they invoked the website and PWA through npm scripts and the full path to `ng.cmd`. The page was split so the recommended path stays the short native start, and Native builds uses `cd`, `ng build`, and `ng serve`.

## References to any best practices that we found

- [Local development](../../technical/guides/local-development.md)
- [Configuration](../../technical/infra/configuration.md) — `api.env` is injected as process environment; .NET maps `Key__Nested` to `Key:Nested`
- [Local hybrid runtime](../../../infra/dev/README.md)

## Any remaining issues that we may wish to address

- None for this documentation change.
