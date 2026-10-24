---
name: GitHub Azure federated credentials
type: guide
status: active
updated: 2026-10-24
---

# GitHub Actions OIDC to Azure (federated credentials)

How DertInfo lets **GitHub Actions** sign in to Azure **without a client secret**, using Entra ID federated identity credentials. The checked-in JSON in [`infra/configuration/`](../../../infra/configuration/) is the trust policy applied to the Entra app; it is not a password.

App CD still uses GitHub Environments **`test`** / **`prod`**. This guide and these JSON files are for the **new-stack** Environments **`development`** and **`production`** (subscription foundation and workload infra / Src CD). See [CI/CD](../infra/cicd.md) for the older app CD OIDC variables.

## What the files are

| File | Entra credential name | GitHub Environment it trusts |
|------|----------------------|------------------------------|
| [`github-azure-dev-credential.json`](../../../infra/configuration/github-azure-dev-credential.json) | `github-development` | `development` |
| [`github-azure-prd-credential.json`](../../../infra/configuration/github-azure-prd-credential.json) | `github-production` | `production` |

Each file is the body for `az ad app federated-credential create --parameters`. Fields:

| Field | Meaning |
|-------|---------|
| `issuer` | GitHub Actions OIDC issuer (`https://token.actions.githubusercontent.com`) |
| `subject` | Exact token subject GitHub will present. After the transfer this is `repo:dertinfo-org@347463852/dertinfo-mono@1286253466:environment:<environment-name>` |
| `audiences` | Always `api://AzureADTokenExchange` for Azure login |
| `name` / `description` | Labels on the Entra federated credential |

The **subject** must match the job’s GitHub Environment **exactly**. `development` is not `dev`, `test`, or `prd`. A mismatch is a silent AADSTS70021 / federated credential error at `azure/login`.

These files contain **no secrets**. Do not put client secrets, certificates, tenant ids, or subscription ids in them.

## How GitHub uses them

1. A workflow job sets `environment: development` (or `production`) and `permissions: id-token: write`.
2. `azure/login` requests an OIDC token from GitHub. The token’s subject is `repo:dertinfo-org@347463852/dertinfo-mono@1286253466:environment:development` (or `…:environment:production`). The `@` numbers are the GitHub owner id and repository id.
3. Entra accepts that token **only if** a federated credential on the target app matches issuer + subject + audience.
4. Entra issues an Azure AD access token for that app’s service principal. GitHub never stores an Azure client secret.

That is what allows Actions to **deploy** (subscription Bicep, workload RG Bicep, and API / Functions Src CD) into Azure.

## Create the Entra apps and apply the JSON

**Preferred:** run the operator script (creates **separate** apps for development and production, applies the JSON above, and grants Contributor + User Access Administrator on each subscription only):

```powershell
cd infra\scripts
.\Entra\New-DertInfoSubscriptionOidcIdentities.ps1 `
  -DevSubscriptionId '<development-subscription-guid>' `
  -PrdSubscriptionId '<production-subscription-guid>'
```

See [`infra/scripts/README.md`](../../../infra/scripts/README.md). Run as tenant / subscription administrator from **PowerShell**. The script prints the GitHub Environment variable values to set next.

Do this as tenant administrator. **Required shape for subscription foundation:** **one app registration + service principal per Environment**, each with RBAC only on that Environment’s subscription. Do **not** use a single privileged SP for both development and production — a shared identity would hold rights on both subscriptions and enlarge blast radius on a public monorepo. Rationale: [GitHub workflows security review](../../operations/security/github-workflows-security-review.md).

Manual equivalent (if not using the script):

```bash
# Development app
APP_ID=$(az ad app create --display-name "dertinfo-github-subscription-development" --query appId -o tsv)
az ad sp create --id "$APP_ID"

az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters "@infra/configuration/github-azure-dev-credential.json"
```

```bash
# Production app
APP_ID=$(az ad app create --display-name "dertinfo-github-subscription-production" --query appId -o tsv)
az ad sp create --id "$APP_ID"

az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters "@infra/configuration/github-azure-prd-credential.json"
```

Then assign Contributor and User Access Administrator on the matching subscription to each service principal (see the script for the exact `az role assignment create` shape).

Do **not** attach both federated JSON files to one subscription-foundation SP. Workload apps reuse the **same Environment’s** JSON only.

Grant Azure RBAC on the **service principal** (not only the app registration): subscription-scope Contributor + User Access Administrator for subscription infra CD only. Workload SPs get RG-scoped roles from subscription Bicep — never subscription UAA. Apply the matching environment JSON to every Entra app that Actions should impersonate for that Environment.

### Workload identities (one Environment at a time)

```powershell
cd infra\scripts
.\Entra\New-DertInfoWorkloadOidcIdentities.ps1 `
  -GitHubEnvironment development `
  -SubscriptionId '<development-subscription-guid>'
```

That master script calls [`New-DertInfoWorkloadOidcIdentity.ps1`](../../../infra/scripts/Entra/New-DertInfoWorkloadOidcIdentity.ps1) for `config`, `monitoring`, `storage`, `api`, `web`, `app`, and `functions`. Display names are `dertinfo-github-workload-<part>-development` or `dertinfo-github-workload-<part>-production`. It does **not** assign Azure roles. Tear down one app with [`Remove-DertInfoWorkloadOidcIdentity.ps1`](../../../infra/scripts/Entra/Remove-DertInfoWorkloadOidcIdentity.ps1).

Confirm:

```bash
az ad app federated-credential list --id "$APP_ID" -o table
```

## Add the organization repository

The repository is `dertinfo-org/dertinfo-mono`. Each JSON file keeps the credential name `github-development` or `github-production`. That name is already on the apps for the previous owner `dertinfo`. The create scripts skip a credential when its name exists, so they do not apply a changed subject.

The update scripts add the JSON subject onto the existing app. Each run is one GitHub Environment. Run **development**, confirm `azure/login` from `dertinfo-org/dertinfo-mono`, then run **production**. Start from [`Start-DertInfoControlPlane.ps1`](../../../infra/scripts/Start-DertInfoControlPlane.ps1), or:

```powershell
cd infra\scripts
.\Entra\Update-DertInfoSubscriptionOidcIdentities.ps1 -GitHubEnvironment development
.\Entra\Update-DertInfoWorkloadOidcIdentities.ps1 -GitHubEnvironment development
```

Repeat both with `-GitHubEnvironment production` after development login works. One workload:

```powershell
.\Entra\Update-DertInfoWorkloadOidcIdentity.ps1 `
  -GitHubEnvironment development `
  -Workload api
```

The script finds the app by display name. It does not create an app, a service principal, or a role assignment, and it does not change GitHub Environment variables. It prints the subjects already on the app and the subject it will add, then prompts. `-Force` skips the prompt.

When the JSON subject is already present, it does nothing. When `github-development` or `github-production` belongs to another subject, it adds a second credential. The name suffix is the owner. The immutable subject `repo:dertinfo-org@347463852/dertinfo-mono@1286253466:environment:development` is stored in full, and the credential is named `github-development-dertinfo-org-347463852` because an Entra name cannot contain `@`. Production uses `github-production-dertinfo-org-347463852`. Leave the old credential in place until a workflow from `dertinfo-org/dertinfo-mono` signs in. Remove that old credential later with `az ad app federated-credential delete`. The `Remove-*` scripts delete the whole app.

## GitHub Environment variables

Create GitHub Environments named **`development`** and **`production`**. On each, set variables (not secrets):

| Variable | Purpose |
|----------|---------|
| `AZURE_ENTRA_OIDC_CLIENTID_SUBSCRIPTION` | App (client) id of the **subscription-scope** deploy identity only |
| `AZURE_ENTRA_OIDC_TENANTID` | Entra tenant id (shared) |
| `AZURE_SUBSCRIPTION_DEPLOY_SUBSCRIPTIONID` | Target Azure subscription id |
| `AZURE_ENTRA_OIDC_CLIENTID_WORKLOAD_<PART>` | App (client) id of that workload’s infra and Src CD identity |
| `AZURE_ENTRA_OIDC_PRINCIPALID_WORKLOAD_<PART>` | Object id of that workload SP (subscription Bicep RG RBAC) |

`<PART>` is `CONFIG`, `MONITORING`, `STORAGE`, `API`, `WEB`, `APP`, or `FUNCTIONS`. The master workload script prints these names and values for copy-paste.

Do not commit those ids in the JSON files or in `main.*.bicepparam`. Do not use `AZURE_ENTRA_OIDC_CLIENTID_SUBSCRIPTION` for RG or Src deploy. If you still have `AZURE_ENTRA_OIDC_TENANTID_SUBSCRIPTION`, rename it to `AZURE_ENTRA_OIDC_TENANTID`.

### Required reviewers

Both **`development`** and **`production`** use deployment protection rules with required reviewers. Either GitHub account may approve:

- `dertinfo`
- `davidsmonkeys`

Settings → Environments → [name] → Deployment protection rules → Required reviewers.

## Troubleshooting

### Git Bash (MINGW64) and subscription-scoped Azure CLI

On Git Bash, arguments that start with `/` (for example `--scope /subscriptions/<id>`) can be rewritten as Windows paths when launching `az`, which yields ARM errors such as `MissingSubscription`. Prefer PowerShell/CMD for those commands, or disable conversion:

```bash
MSYS_NO_PATHCONV=1 az role assignment create \
  --assignee "$SP_APP_ID" \
  --role "Contributor" \
  --scope "/subscriptions/$SUB_ID"
```

`echo /subscriptions/...` is not a reliable test — path conversion often applies only when invoking Windows executables.

## Related

- Operator scripts: [`infra/scripts/README.md`](../../../infra/scripts/README.md) — subscription pair plus [`New-DertInfoWorkloadOidcIdentities.ps1`](../../../infra/scripts/Entra/New-DertInfoWorkloadOidcIdentities.ps1) / [`Update-DertInfoSubscriptionOidcIdentities.ps1`](../../../infra/scripts/Entra/Update-DertInfoSubscriptionOidcIdentities.ps1) / [`Update-DertInfoWorkloadOidcIdentities.ps1`](../../../infra/scripts/Entra/Update-DertInfoWorkloadOidcIdentities.ps1) / [`Remove-DertInfoWorkloadOidcIdentity.ps1`](../../../infra/scripts/Entra/Remove-DertInfoWorkloadOidcIdentity.ps1)
- Security review: [GitHub workflows — subscription OIDC](../../operations/security/github-workflows-security-review.md)
- Folder README: [`infra/configuration/README.md`](../../../infra/configuration/README.md)
- [CI/CD](../infra/cicd.md) — workflow inventory and existing `test` / `prod` app CD OIDC
- Microsoft: [Connect GitHub and Azure with OpenID Connect](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect)
