# Production deployment complete

## Summary of the work completed

New-stack production is serving `https://www.dertinfo.co.uk` and `https://app.dertinfo.co.uk`. The milestone guide was followed from workload identities through infrastructure, configuration, the SQL and image copies, and public DNS. Notes from that first run are annotations on [Set up the production environment](../../technical/guides/production-environment-setup.md). Cleanup of the old live and test estates is [issue 120](https://github.com/dertinfo/dertinfo-mono/issues/120).

## Why the work was completed

The new production website, API, and PWA had to replace the previous live site, with a check on the Azure hostnames before DNS. The first run showed where the written order and the operator scripts made that check harder, so those points are recorded on the guide for the next time.

## Date the work was started

2026-09-26

## Date the work was completed

2026-09-27

## Issues that were encountered on the way

- Binding the production database users and deploying API, Web, and App source against the empty database before the SQL copy would have proved Swagger and the Azure hostnames before the copy started the usage clock on the live data. The copy replaces the database, so the user binds have to be run again afterwards. In the order that was followed, Swagger could not be checked until API Src CD ran after the copy.
- AzCopy did not accept `az login` for a personal Microsoft account. Sign-in needed `azcopy login --tenant-id` for tenant `2ab71d57-dc91-4de1-8b66-8d449cf20439`.
- The image copy returned `AuthorizationPermissionMismatch` on `PUT` to `stprddertinfoimagesuks` until the operator had Storage Blob Data Contributor on that account. The resource group has to be passed. The CLI default group was an old test group.
- [`Copy-DertInfoSqlToProduction.ps1`](../../../infra/scripts/Database/Copy-DertInfoSqlToProduction.ps1) checks the copy and offers Continue or Revert, but it does not number the stages the way the other operator scripts do, and the cleanup step is harder to follow.

## References to any best practices that we found

- [AzCopy login with a tenant id](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-authorize-azure-active-directory) — a personal Microsoft account selects the tenant explicitly.
- [Azure built-in roles for blobs](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-contributor) — blob writes need a data-plane role. Owner and Contributor do not include them.

## Any remaining issues that we may wish to address

- Retire the old live and test infrastructure and the subscriptions that only hold them: [issue 120](https://github.com/dertinfo/dertinfo-mono/issues/120).
- Number the stages in `Copy-DertInfoSqlToProduction.ps1` so the cleanup step matches the other operator scripts.
