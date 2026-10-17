# New-stack Functions Flex Consumption CD

## Summary of the work completed

Functions infrastructure moved to [`infra/bicep/functions/`](../../../infra/bicep/functions/) (house `main.shared.bicepparam` + `main.dev.bicepparam` / `main.prod.bicepparam`). Subscription foundation now creates `rg-<env>-dertinfo-functions-uks`, allows **FC1**, Event Grid, Logic Apps, and metric alerts, and grants the FUNCTIONS workload SP monitoring Reader plus conditioned UAA on the functions RG (host-storage roles + stop Logic App). The **storage** workload owns images Blob Data Contributor and Event Grid (`flagImagesFunctionAppReady` / `flagImagesEventGridReady`); the STORAGE SP gets conditioned UAA on the storage RG and listKeys on the Function App. Hosted connections use the site managed identity (not storage keys). Excess-use notify email is GitHub Environment variable `AZURE_MONITOR_FUNCTIONS_EXCESSIVEUSE_EMAIL`. Src CD One-Deploys with `Azure/functions-action@v1`. Old `apps/dert-functions/infra/bicep/` was deleted; ADO infra YAML is retired.

Operator runbook (DEV then PRD, including Event Grid reset after AzCopy): [CI/CD](../../technical/infra/cicd.md#first-development-functions-deploy-operator).

## Why the work was completed

Src CD for Functions existed but there was no new-stack Function App. DEV API already writes to `stdevdertinfoimagesuks`. The worker must watch that account on Linux Flex Consumption with identity-based storage, and cost-stop alerts must be described in this repo rather than reused from the old monitoring RG.

## Date the work was started

2026-09-20

## Date the work was completed

2026-09-20

## Issues that were encountered on the way

- AVM `web/site` 0.24.0 does not express Flex `functionAppConfig`; the Flex plan and site are raw `Microsoft.Web@2024-04-01`. Host storage still uses AVM `storage-account` 0.33.0.
- Flex blob triggers are Event Grid only. Storage must keep `flagImagesEventGridReady=false` until Src CD has created `blobs_extension`. A handshake timeout must not fail SQL — Event Grid is a nested module behind that flag.
- Images Blob Data Contributor is assigned by storage Bicep (owner-assigns), not by Functions nested into the storage RG.
- AzCopy onto a live Event Grid subscription would enqueue historical BlobCreated events. The runbook stops the app for the copy and requires **delete then recreate** of subscriptions before start (incremental ARM does not discard the retry backlog).
- Alert email is deploy-time ops config, so it stays a GitHub Environment **variable**, not Key Vault / App Configuration.

## References to any best practices that we found

- [Azure Functions Flex Consumption](https://learn.microsoft.com/en-us/azure/azure-functions/flex-consumption-plan)
- [Identity-based connections for Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference?tabs=blob#connecting-to-host-storage-with-an-identity)
- [GitHub `Azure/functions-action` One Deploy](https://github.com/Azure/functions-action)
- [Event Grid blob trigger (webhook to `/runtime/webhooks/blobs`)](https://learn.microsoft.com/en-us/azure/azure-functions/functions-event-grid-blob-trigger)

## Any remaining issues that we may wish to address

- Operator must still run the [DEV sequence](../../technical/infra/cicd.md#first-development-functions-deploy-operator) after merge (subscription CD → Functions infra → Storage data-plane → Src CD → Event Grid → blob smoke test). This changelog records the in-repo work, not a live DEV proof.
- Confirm `AZURE_ENTRA_OIDC_PRINCIPALID_WORKLOAD_FUNCTIONS` on GitHub Environment `development`; set `AZURE_MONITOR_FUNCTIONS_EXCESSIVEUSE_EMAIL` before Functions infra CD; confirm Flex in uksouth (`az functionapp list-flexconsumption-locations`).
- Rename leaf `main.prod.bicepparam` → `main.prd.bicepparam` across all workloads — [issue 119](https://github.com/dertinfo/dertinfo-mono/issues/119).
- App Configuration / Key Vault / GitHub leftover cleanup after DEV Functions are proven — [issue 115](https://github.com/dertinfo/dertinfo-mono/issues/115). Do not remove `az-storage-images-accountkey` until API identity is done.
- Production image copy and traffic switchover remain operator steps; old Functions stay on the old images account until then.
