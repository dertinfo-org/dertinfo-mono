# Development website and PWA first hosted deploy

## Summary of the work completed

New-stack development Static Web Apps are live on custom hosts. Website (`https://dev.dertinfo.co.uk`) and PWA (`https://app-dev.dertinfo.co.uk`) deploy via Src CD, call `https://app-dev-dertinfo-api-uks.azurewebsites.net`, and support login, page refresh, and sign-out against Auth0 **dertinfotest**. Operator sequence: [CI/CD](../../technical/infra/cicd.md#first-development-swa-deploy-operator). Auth0 URL tables: [Authentication](../../technical/subsystems/authentication.md#hosted-development-auth0-application-urls).

## Why the work was completed

The SWA Bicep and infra CD work ([2026-09-07-006](./2026-09-07-006-web-app-swa-bicep.md), [2026-09-07-007](./2026-09-07-007-swa-location-westeurope.md), [2026-09-19-001](./2026-09-19-001-swa-operation-status-rbac.md)) was not finished until DNS, Auth0, App Configuration, and Src CD were proven on the custom hosts.

## Date the work was started

2026-09-07

## Date the work was completed

2026-09-19

## Issues that were encountered on the way

- `Microsoft.Web/staticSites` is not available in uksouth; sites are in westeurope ([2026-09-07-007](./2026-09-07-007-swa-location-westeurope.md)).
- Custom-domain bind needed a subscription-scoped poll role ([2026-09-19-001](./2026-09-19-001-swa-operation-status-rbac.md)).
- PWA CORS failed while the website worked: `Cors:AllowedOrigins` was split on commas without trim, so ` https://app-dev.dertinfo.co.uk` did not match. Live App Configuration was set without spaces. A code `Trim()` is still a useful follow-up.

## References to any best practices that we found

- [Auth0 SPA settings](https://auth0.com/docs/get-started/applications/application-settings) — callback, logout, and web origins must match the SDK paths exactly
- [ASP.NET Core CORS](https://learn.microsoft.com/en-us/aspnet/core/security/cors) — `WithOrigins` is an exact string match

## Any remaining issues that we may wish to address

- Trim CORS origins in API `Startup.cs` so catalog values with spaces after commas keep working.
- Rebuild Auth0 tenants so names match environments — [issue 117](https://github.com/dertinfo/dertinfo-mono/issues/117).
- Production custom domains and production src deploy are a later pass.
