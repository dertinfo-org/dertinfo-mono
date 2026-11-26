# Production SQL policy allows Basic and S0

## Summary of the work completed

The production subscription SQL policy now allows database SKU names **Basic** and **S0**. S0 is the Standard tier at 10 DTU. Development stays on Basic.

The allow-list is the production leaf [`infra/bicep/subscription/main.prod.bicepparam`](../../../infra/bicep/subscription/main.prod.bicepparam). The policy in [`infra/bicep/subscription/policy/main.bicep`](../../../infra/bicep/subscription/policy/main.bicep) still denies any other `sku.name`. Its description now follows that list, so production no longer says that only Basic is allowed.

This does not change the database the storage template creates. That database is still Basic until it is scaled.

## Why the work was completed

Production needs a short step up from Basic when DTU pressure shows up. [Hosting and cost](../../technical/architecture/hosting-and-cost.md) already treats S0 as that relief valve. The subscription policy denied every SKU except Basic, so the scale could not be applied.

S0 is the name a create or scale sends for 10 DTU. Leaving the name `Standard` on the allow-list would also allow S1 (20 DTU) and every larger Standard size, because those share that name.

## Date the work was started

2026-11-26

## Date the work was completed

2026-11-26

## Issues that were encountered on the way

- The first draft allowed `Standard` and tried to cap capacity at 10 DTU. A read of an S0 database returns `sku.name` `Standard` with `sku.capacity` 10, but a create or scale sends `S0`. Capacity is often missing on the create request, so a Deny on capacity does not reliably block a new database. The allow-list uses `S0` instead.

## References to any best practices that we found

- [DTU-based purchasing model](https://learn.microsoft.com/en-us/azure/azure-sql/database/service-tiers-dtu) — Basic, Standard, and Premium. S0 is 10 DTU.
- [DTU resource limits for single databases](https://learn.microsoft.com/en-us/azure/azure-sql/database/resource-limits-dtu-single-databases) — S0 is 10 DTU, S1 is 20, S2 is 50.
- [Hosting and cost](../../technical/architecture/hosting-and-cost.md) — Basic for the year, with a short S0 if DTU pressure shows up.
- [Bicep standards](../../technical/standards/bicep/README.md) — the production leaf overrides only what differs. The shared list stays Basic.
- [CI/CD](../../technical/infra/cicd.md) — subscription infra CD is what applies this policy.
- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) — branch and pull request into `main`.

## Any remaining issues that we may wish to address

- The live production subscription keeps the old policy until subscription infra CD runs for production.
- [`infra/bicep/storage/sql.bicep`](../../../infra/bicep/storage/sql.bicep) still creates the database as Basic. A later storage deploy sets a scaled database back to Basic.
- A request that sends `sku.name` `Standard` is denied. The scale has to send `S0`.
