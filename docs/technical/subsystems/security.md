---
name: Security
type: subsystem
status: active
updated: 2026-10-17
---

# Subsystem: Security notes

Selected application and Azure data-plane controls. Authentication and token claims: [Authentication](authentication.md). Pipeline OIDC gates: [GitHub workflows security review](../../operations/security/github-workflows-security-review.md). Bicep RBAC and AVM pins: [Bicep standards](../standards/bicep/README.md). Operator sequence: [CI/CD](../infra/cicd.md).

Adapted from the legacy wiki: [Security](https://github.com/dertinfo/dertinfo/wiki/Security).

## CORS origins

The API restricts browser access to known SPA origins via the `AllowSpecificOrigins` policy.

Local defaults come from `appsettings.json`:

```json
"Cors": {
  "AllowedOrigins": "http://localhost:44200,http://localhost:44300"
}
```

Staging and production origin lists are supplied via **Azure App Configuration** (when `AZURE_APP_CONFIG` is set), overlaying these settings at runtime.

Do not open CORS to `*` for authenticated API routes.

## Storage accounts

The new stack has two Azure Storage accounts with **different** bars. Do not copy host-storage settings onto images, or the reverse.

| Account | Names | What it holds | Anonymous blobs | Who authenticates |
|---------|-------|---------------|-----------------|-------------------|
| Functions **host** | `stdevdertinfofuncuks` / `stprddertinfofuncuks` | Deployment zip, Functions `AzureWebJobsStorage` (blobs / queues / tables) | **No** (`allowBlobPublicAccess: false`, container `publicAccess: None`). Shared keys **disabled**. | Function App **system-assigned MI** |
| **Images** | `stdevdertinfoimagesuks` / `stprddertinfoimagesuks` | Competition images (`originals`, `100x100`, `480x360`) | **Yes** on those containers (`publicAccess: Blob`) so the web can display them | Function App MI for resize writes (Blob Data Contributor, assigned by **storage** Bicep). Hosted **API still uses account keys** until [API image identity](https://github.com/dertinfo/dertinfo-mono/issues/115) is done. |

### Firewall `Allow` is not public blobs

AVM `storage-account` **0.33.0** sets `networkAcls.defaultAction: Deny` with an empty allow-list even when the caller passes `publicNetworkAccess: Enabled`. That is “selected networks” with nothing selected. Flex One Deploy and the Functions runtime then get `403 This request is not authorized to perform this operation` (firewall wording — **not** the RBAC wording `…using this permission`).

This estate has **no VNet** (see [hosting and cost](../architecture/hosting-and-cost.md)). Flex SCM zip upload has no small stable IP list, and it is **not** covered by storage `AzureServices` bypass. So both accounts pass:

```bicep
networkAcls: {
  bypass: 'AzureServices'
  defaultAction: 'Allow'
}
```

`Allow` opens the **network path**. Authentication is unchanged:

- Host storage: Entra RBAC only (`allowSharedKeyAccess: false`). Anonymous blob access stays off. Account keys and key-based SAS cannot authenticate.
- Images: anonymous **read** of public containers is intentional; writes still need a key or a data-plane role. Shared keys stay **enabled** until the API uses a managed identity.

Do not grant the GitHub **FUNCTIONS** workload SP Storage Blob Data Contributor (or Owner) on host storage to “let the pipeline upload.” Flex One Deploy does not upload as that SP.

### Flex One Deploy identity

`Azure/functions-action` talks to Kudu as the FUNCTIONS OIDC SP (**Contributor** on the functions RG is enough for that). Kudu then uploads `released-package.zip` as the identity on `functionAppConfig.deployment.storage` — here **SystemAssignedIdentity** of `func-<env>-dertinfo-functions-uks`.

That site MI needs, on the **host** account (functions Bicep, functions-RG conditioned UAA):

- Storage Blob Data Owner (`b7e6dc6d-f1e8-4753-8033-0f276bb0955b`)
- Storage Queue Data Contributor
- Storage Table Data Contributor

Built-in role GUIDs must match the Azure catalog. A wrong GUID fails Functions infra CD (`RoleDefinitionDoesNotExist`) or leaves the assignment missing so Src CD 403s.

| Symptom | Typical cause |
|---------|----------------|
| `403 (This request is not authorized to perform this operation.)` | Storage firewall Deny / public network disabled |
| `403 (…using this permission.)` | Site MI missing blob data-plane role, or RBAC not yet effective |
| `RoleDefinitionDoesNotExist` | Bad role definition GUID on the assignment |

### Residual risk

| Residual | Why it remains | Follow-up |
|----------|----------------|-----------|
| Images shared key access still enabled | Hosted API still builds the images connection from `StorageAccount:Images:Key` | Do **not** set `allowSharedKeyAccess: false` on the images account until [API image identity](https://github.com/dertinfo/dertinfo-mono/issues/115) is done. Host storage already disables keys. |
| No private endpoints / Flex VNet | Hosting bar is FC1 without VNet; F1/D1 API cannot join a VNet either | Not in current cost decisions. Revisit only with a deliberate SKU change. |
| Images anonymous read | Web display without SAS | Keep public only on image containers; never on host storage. |
| API images access is still a key | Legacy connection shape | Grant the App Service MI Blob Data Contributor on images, then drop the key. |

## Related

- [CI/CD — First development Functions deploy](../infra/cicd.md#first-development-functions-deploy-operator)
- [Bicep standards](../standards/bicep/README.md)
- [Secrets and rotation](../infra/secrets-and-rotation.md)
- [GitHub Actions OIDC](../guides/github-azure-federated-credentials.md) (workload SP RBAC). A disallowed-SKU deny has not been shown yet: [issue 126](https://github.com/dertinfo/dertinfo-mono/issues/126).
