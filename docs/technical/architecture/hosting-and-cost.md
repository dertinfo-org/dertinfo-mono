---
name: Hosting and cost
type: architecture
status: active
updated: 2026-10-17
---

# Hosting and cost

Why the Azure hosting shape is what it is. Usage drives the SKUs. The rejects are here so a later change does not re-open the cost question without this context.

This is not a full CI/CD or configuration guide. Those are [CI/CD](../infra/cicd.md) and [Configuration](../infra/configuration.md). Resource groups and pipelines are in the CI/CD page. Bicep conventions are in [Bicep standards](../standards/bicep/README.md).

## Usage profile

DertInfo is not steady SaaS load.

| Period | Behaviour | Hosting implication |
|--------|-----------|---------------------|
| Most of the year | Light or idle. People browse past results and history. | Cheapest always-available tiers. Cold starts are acceptable. |
| Competition weekend | Heavy. Scores are entered and viewed live, especially on one day. | Temporary API scale-up, and optionally SQL. |
| After the event | Back to idle. | Scale back down. |

Scale-to-zero is a poor fit for a year-round browsable archive, because of wake time and API migrate-on-start. Year-round dedicated Basic App Service would waste money for about fifty idle weeks.

## SKUs in use

| Resource | Choice |
|----------|--------|
| Static Web Apps (website and PWA) | Free, for development and production |
| App Service (API) | F1 in development. D1 in production for most of the year. Basic B1 for the competition weekend. |
| Azure SQL | Logical server. Database Basic. Basic is enough for the event day. An optional short S0 is the relief valve if DTU pressure shows up. |
| Key Vault | Standard |
| Functions | Linux Flex Consumption (FC1). Scale to zero. Blob triggers use Event Grid. Classic Y1 is not used on the new stack. |
| Image storage | Standard_LRS in the storage resource group |

An indicative idle Azure bill for both environments is roughly £25–40 a month before Auth0 and SendGrid. The event weekend is a small pro-rata bump (B1 days, and optional SQL S0), not a second full-price tier all year. Refresh the figures from the portal before treating them as a quote.

There is no virtual network. F1 and D1 cannot use VNet integration, NAT Gateway, or private endpoints. That is why storage and SQL stay on public endpoints with the controls in [Security](../subsystems/security.md).

## Decisions

| Decision | Rationale |
|----------|-----------|
| Keep Static Web Apps Free for the website and the PWA | Custom domains and free TLS. Blob storage alone cannot do HTTPS custom domains. Blob plus a CDN costs more than free Static Web Apps. |
| Keep App Service for the API | Long-lived ASP.NET, with EF migrate-on-start. F1 and D1 are the cheapest sensible path. Always-on container instances cost at least as much as B1. |
| Seasonal D1 to B1 for the production API | Removes the slow warmup and absorbs event traffic only when it is needed. |
| Stay on Azure SQL Basic | Moving the engine to Postgres, MySQL, or Cosmos does not pay back at this size. |
| Keep Functions on Flex Consumption | Image resize is bursty and near-zero off season. Linux-only Flex is the current serverless plan. |
| One resource group per part | Cost-neutral, and it keeps permissions at resource-group scope. |

## Rejected

| Option | Why not |
|--------|---------|
| Blob static website plus Azure CDN or Front Door, instead of Static Web Apps | More cost and more operations. Free Static Web Apps already cover domains and HTTPS. |
| Always-on container instances for the API | Not cheaper than D1 off season, and a weak HTTP platform for this app. |
| Container Apps scale-to-zero for the production API | Hurts daily archive browsing, and adds a cold start on top of migrate-on-start. |
| Year-round B1 | Wastes about eleven months of dedicated compute. |
| Postgres, MySQL, or Cosmos as the primary database | The migration costs more than the SKU would save at this scale. |
| The main API as HTTP Azure Functions | The API is a long-lived ASP.NET app. Functions are the image-resize worker. |

## Not a long-term API host decision

The API App Service is Windows with a `win-x86` publish so it matches the current source CD. That is not the long-term host. A move to Linux is [issue 124](https://github.com/dertinfo/dertinfo-mono/issues/124).

Auth0 and SendGrid commercial tiers are out of scope here.
