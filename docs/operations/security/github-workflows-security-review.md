---
name: GitHub workflows security review (subscription OIDC)
type: security-review
status: active
updated: 2026-10-17
---

# Security review: GitHub workflows and subscription OIDC

**Scope:** Public monorepo `dertinfo/dertinfo-mono`, **Subscription infra CD**, Entra federated credentials, GitHub Environments `development` / `production`, and operator scripts under [`infra/scripts/`](../../../infra/scripts/).

**Related:** [GitHub Actions OIDC guide](../../technical/guides/github-azure-federated-credentials.md), [CI/CD](../../technical/infra/cicd.md), [Security (storage / Flex deploy)](../../technical/subsystems/security.md). A disallowed-SKU deny is still unchecked: [issue 126](https://github.com/dertinfo/dertinfo-mono/issues/126).

**Assumption checked with operators (2026-08-15):** Environments `development` and `production` require approval from either `dertinfo` or `davidsmonkeys` before deploy jobs run. Re-verify in GitHub Settings if this review is reused later.

---

## Attack Surface

| Surface | What is exposed |
|---------|-----------------|
| Public git history and workflow YAML | Anyone can read `.github/workflows/*`, Bicep, and federated-credential **JSON shapes** (issuer/subject/audience — no secrets). |
| GitHub Actions on this repo | `workflow_dispatch` and `push` to `main` (path-filtered) for subscription CD; jobs request `id-token: write` and use Environment vars for Azure login. |
| GitHub Environment variables | Non-secret OIDC client id, tenant id, subscription id (visible to users with appropriate GitHub access; client id is not a password). |
| Entra app registrations | Application (client) ids for subscription deploy SPs; federated credentials trust GitHub OIDC subjects `repo:dertinfo/dertinfo-mono:environment:development` and `…:environment:production`. |
| Azure RBAC | Each SP has Contributor + User Access Administrator on **one** subscription only (development vs production isolation). |
| Operator scripts | [`New-DertInfoSubscriptionOidcIdentities.ps1`](../../../infra/scripts/Entra/New-DertInfoSubscriptionOidcIdentities.ps1) / [`Remove-DertInfoSubscriptionOidcIdentity.ps1`](../../../infra/scripts/Entra/Remove-DertInfoSubscriptionOidcIdentity.ps1) — powerful if run by a human with Entra + subscription admin rights (local workstation / Cloud Shell), not invoked by Actions. |

Out of scope for this review: Auth0, app CD Environments `test` / `prod`, and future RG-scoped workload identities (except that they must not reuse the subscription SP).

---

## Threat Actors

| Actor | Capability | Goal |
|-------|------------|------|
| Anonymous internet / repo reader | Clone, read workflows, see public docs | Steal cloud access or force a deploy without privileges |
| Fork PR author | Open PRs; limited Actions on fork PRs | Abuse OIDC or Environment vars via a PR workflow |
| Collaborator with **write** (not Environment reviewer) | Push branches, merge if allowed, **Run workflow** | Deploy or change Azure without maintainer intent |
| Environment required reviewer (`dertinfo` / `davidsmonkeys`) | Approve Environment deployments | Legitimate gate; abuse if account compromised |
| Repo / org **admin** | Change Environments, reviewers, vars; bypass or weaken protections | Full pipeline and settings control |
| Compromised CI or malicious edit on `main` | Alter workflows after merge | Drop Environment gates or broaden trust |

---

## Controls In Place

| Control | How it helps |
|---------|----------------|
| **No Azure client secret** | Actions use OIDC only; stealing a client id from logs/docs is insufficient to obtain an Azure token. |
| **Environment-scoped federated subjects** | Entra accepts tokens only for `…:environment:development` or `…:environment:production`, not arbitrary branch refs or forks of other repos. |
| **Job `environment:` before `azure/login`** | Deployable reusable workflow sets `environment: ${{ inputs.environment }}`, so Environment protection applies before login. |
| **Required reviewers** | `development` and `production` require approval from **`dertinfo` or `davidsmonkeys`**. Deploy (and token exchange for that Environment) waits on that approval. |
| **Isolated app registrations** | Separate Entra apps/SPs per Environment; development SP must not have RBAC on Production (and vice versa). A stolen or misused development identity cannot administer the production subscription. |
| **Operator scripts (create / remove)** | Standardise creating isolated identities and tearing down a single client id; reduce accidental “one SP for both subs” setups. See [`infra/scripts/README.md`](../../../infra/scripts/README.md). |
| **Public-repo fork behaviour** | Fork PRs do not receive this repo’s Environment configuration for privileged OIDC the way maintainer runs do; subjects would not match the checked-in trust policy for `dertinfo/dertinfo-mono`. |
| **Production not on push** | `deploy-prod` only on `workflow_dispatch` with `target: prod`, still behind the `production` Environment. |
| **Path-filtered push to `main`** | Auto `deploy-dev` only when subscription Bicep/workflow paths change; still requires Environment approval. |

**Assurance (intended):** Random public users cannot successfully run subscription deploy against Development or Production. A run that obtains the subscription SP and applies Bicep requires Environment approval from **`dertinfo` or `davidsmonkeys`**. Repo write without that approval can at most **queue** a waiting deployment.

**Separate gate:** Who may merge to `main` / who has write is controlled by GitHub org/repo permissions (and optional branch protection). That is “project people” access to change code and trigger runs — not a substitute for Environment reviewers.

---

## Residual Threats

| Residual threat | Severity | Mitigation / follow-up |
|-----------------|----------|-------------------------|
| Compromised `dertinfo` or `davidsmonkeys` account | High | Strong 2FA / passkeys; monitor Environment approval notifications; avoid sharing those accounts. |
| Repo/org admin removes required reviewers or swaps Environment client ids | High | Limit admin role; audit Environment settings after incidents; prefer hardware-backed admin MFA. |
| Write collaborator merges a workflow that removes `environment:` | Medium–High | PR review + branch protection on `main`; without Environment subject, Entra login should fail — still treat workflow diffs as sensitive. |
| Broadening federated credential subjects (e.g. all refs) | High | Keep Environment-only subjects in [`infra/configuration/`](../../../infra/configuration/); never attach both env JSONs to one production-capable SP. |
| Re-introducing a shared SP on both subscriptions | High | Use only the create script pattern; verify RBAC with `az role assignment list`. |
| No deployment-branch restriction on Environments | Low–Medium | Optionally allow Environment jobs only from `main`. |
| Operator scripts misused on a laptop | Medium | Same as any admin CLI; do not commit subscription ids or client ids into the public repo from script output. |
| Production subscription CD not yet proven | Operational | Grant Production SP RBAC, then first `prod` run; until then production Azure is not exercised by this pipeline. |

This review does not claim continuous monitoring or formal penetration testing — it records the control model for the subscription foundation as of the review date.
