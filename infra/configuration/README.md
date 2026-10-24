# Azure configuration artefacts

Checked-in Azure / Entra artefacts used so GitHub Actions can deploy, plus **example** files for hosted Key Vault values. Real secret files are gitignored (same pattern as [`infra/secrets/`](../secrets/README.md)). These are not local app secrets and not Bicep parameters ([`infra/bicep/`](../bicep/)).

| File | What it is |
|------|------------|
| `github-azure-dev-credential.json` | Federated credential body for GitHub Environment **`development`** |
| `github-azure-prd-credential.json` | Federated credential body for GitHub Environment **`production`** |
| `app-config.development.json` | Catalog for development: App Configuration store, label, Key Vault name, secret **names**, Key Vault reference keys, and non-secret `keyValues` to import |
| `app-config.production.json` | Same catalog for production |
| `kv-secrets.development.json.example` | Template for hosted Key Vault **values** (development). Copy to `kv-secrets.development.json` |
| `kv-secrets.production.json.example` | Same template for production |

`kv-secrets.*.json` is gitignored (same pattern as [`infra/secrets/api.env`](../secrets/README.md)). Copy the example, fill empty keys, then run [`New-DertInfoConfigKeyVaultSecrets.ps1`](../scripts/New-DertInfoConfigKeyVaultSecrets.ps1). Do not commit the real files.

```powershell
Copy-Item infra/configuration/kv-secrets.development.json.example `
  infra/configuration/kv-secrets.development.json
```

Operator scripts ([`Export-DertInfoAppConfiguration.ps1`](../scripts/Export-DertInfoAppConfiguration.ps1), [`Import-DertInfoAppConfiguration.ps1`](../scripts/Import-DertInfoAppConfiguration.ps1), [`New-DertInfoConfigKeyVaultSecrets.ps1`](../scripts/New-DertInfoConfigKeyVaultSecrets.ps1)) take `-GitHubEnvironment` (picks the matching catalog and secrets file) or `-ConfigFile` / `-SecretsFile`. Change Environment by editing JSON, not the scripts. Export dumps of live key-values belong under [`infra/secrets/`](../secrets/) (gitignored).

These JSON files describe the **trust relationship** (issuer, subject, audience) applied to an Entra app registration. GitHub Actions then signs in with OIDC instead of an Azure client secret.

**How to create the Entra apps, apply these files, and set GitHub Environment variables:** [GitHub Actions OIDC to Azure (federated credentials)](../../docs/technical/guides/github-azure-federated-credentials.md) — subscription foundation: [`New-DertInfoSubscriptionOidcIdentities.ps1`](../scripts/Entra/New-DertInfoSubscriptionOidcIdentities.ps1); workload identities: [`New-DertInfoWorkloadOidcIdentities.ps1`](../scripts/Entra/New-DertInfoWorkloadOidcIdentities.ps1) (one Environment at a time). To add the `dertinfo-org/dertinfo-mono` subject onto apps that already exist, run [`Update-DertInfoSubscriptionOidcIdentities.ps1`](../scripts/Entra/Update-DertInfoSubscriptionOidcIdentities.ps1) and [`Update-DertInfoWorkloadOidcIdentities.ps1`](../scripts/Entra/Update-DertInfoWorkloadOidcIdentities.ps1) for development, then production. See [security review](../../docs/operations/security/github-workflows-security-review.md).
