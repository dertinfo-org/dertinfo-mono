# Web and App Static Web App Bicep and infra CD

## Summary of the work completed

Website and PWA each have RG-scoped Bicep (`infra/bicep/web`, `infra/bicep/app`) that create a Free Azure Static Web App when `prerequisitesExist` is true (hosted API already exists). Infra CD workflows `web-infra-cd.yml` and `app-infra-cd.yml` deploy those templates with OIDC `WEB` / `APP`. DEV leaves name `swa-dev-dertinfo-web-uks` / `swa-dev-dertinfo-app-uks` and record custom hosts `dev.dertinfo.co.uk` / `app-dev.dertinfo.co.uk` but leave `customDomainReady` false until DNS exists. The development App Configuration catalog now uses those hosts for CORS and Auth0 callbacks. Docs: [CI/CD](../../technical/infra/cicd.md), [Bicep standards](../../technical/standards/bicep/README.md), [Authentication](../../technical/subsystems/authentication.md).

## Why the work was completed

Src CD already writes `assets/app.config.json` at deploy time. The missing piece was creating the SWAs in the new-stack resource groups so both SPAs can be deployed in parallel to custom development hosts, gated so ARM succeeds if the API is not there yet.

## Date the work was started

2026-09-07

## Date the work was completed

2026-09-07

## Issues that were encountered on the way

- AVM `avm/res/web/static-site` fails the deploy if `customDomains` is set before CNAME/TXT exist. First pass binds nothing; a second flag (`customDomainReady`) is the bind step.
- Policy already allowed `Microsoft.Web/staticSites`. Child types `customDomains` and `config` were added to the subscription allow-list so a later bind is not denied.

## References to any best practices that we found

- [Azure Verified Module: Static Web App](https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/web/static-site) — `customDomains` requires validation records first
- [Azure Static Web Apps custom domains](https://learn.microsoft.com/en-us/azure/static-web-apps/custom-domain)

## Any remaining issues that we may wish to address

- Development first hosted pass is complete — [2026-09-19-002](./2026-09-19-002-dev-swa-first-pass.md). First uksouth deploy failed; SWA location is westeurope — [2026-09-07-007](./2026-09-07-007-swa-location-westeurope.md).
- Rebuild Auth0 tenants so names match environments — [issue 117](https://github.com/dertinfo/dertinfo-mono/issues/117).
- Production custom domains and production src deploy are a later pass.
