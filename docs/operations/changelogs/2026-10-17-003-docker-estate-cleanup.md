# Docker estate and Azure DevOps pipeline cleanup

## Summary of the work completed

The monorepo now has one Compose file at the repository root. Each app’s runtime Dockerfile sits at that app’s root. Local Compose env files live under `infra/secrets/`. The functions container is named `functions`. The per-app Compose trees, the Visual Studio container project, and the Azure DevOps pipeline YAML are removed.

## Why the work was completed

Each app arrived from its own repository with a copy of the estate Compose file, its own `infra/docker` folder, and Azure DevOps pipelines. GitHub Actions already deploys the apps, and the root Compose file was the one `npm run start` used. Leaving the copies in place meant two ways to start the same containers, and the copies had drifted. Putting Dockerfiles next to the apps, and env files next to `api.env`, makes the Docker path match the rest of the monorepo.

## Date the work was started

2026-10-17

## Date the work was completed

2026-10-17

## Issues that were encountered on the way

Compose substitutes `${AZURITE_BLOB_ENDPOINT}` in the Compose file and does not substitute variables inside an env file. The functions connection strings stay on the `functions` service for that reason. The Event Grid disable flags moved to `infra/secrets/functions.env`.

The planned-fix pages that still named `apps/*/pipelines/` are not in this working tree. Open work had already moved to GitHub Issues, so those pages were not edited.

The functions image also set `StorageConnection:Images=UseDevelopmentStorage=true`. Compose sets `StorageConnection__Images`, which is a different variable, so the polling triggers kept calling `127.0.0.1:10000` and the host shut down. That image default is removed. Compose supplies the Azurite connection.

## References to any best practices that we found

- [Compose variable interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/) — interpolation applies to the Compose file. An `env_file` passes values through as written.
- [Set environment variables](https://docs.docker.com/compose/how-tos/environment-variables/envvars/) — `environment` overrides `env_file`, which is how the API container replaces the host SQL and blob addresses with the Compose network addresses.

## Any remaining issues that we may wish to address

The PWA container still exits under `docker compose up`. `apps/dert-app/Dockerfile` builds on Node 16 so the Angular 13 app can compile, and that same image installs `@azure/static-web-apps-cli` with no version pin. The installed CLI is 2.0.10, which stops on Node 16 before it serves the site. Upgrading the Ionic app from Angular 13, tracked in [GitHub issue 123](https://github.com/dertinfo/dertinfo-mono/issues/123), lets the image move off Node 16 and is what will make the PWA container stay up. This change does not do that upgrade.

Deleting the YAML from this repo does not disable a pipeline that is still registered in Azure DevOps against an old repository. The published image name remains `dertinfo/dertinfo-imageresizev4`. The native Functions host still reads `local.settings.json` in `apps/dert-functions/src/dertinfo-image-resize`.
