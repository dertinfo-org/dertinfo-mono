<#
.SYNOPSIS
  Add the checked-in GitHub Actions federated credential to one existing subscription OIDC app.

.DESCRIPTION
  Finds dertinfo-github-subscription-development or dertinfo-github-subscription-production.
  Reads infra/configuration/github-azure-dev-credential.json or github-azure-prd-credential.json.
  Adds that subject when it is missing. When github-development or github-production is already
  used by another subject, the new credential name appends the owner. An immutable subject
  repo:dertinfo-org@347463852/... is named github-development-dertinfo-org-347463852, because
  an Entra credential name cannot contain @. Prints the current subjects and the subject to
  add, then prompts unless -Force.

  Does not create the app, the service principal, or role assignments. Does not delete or
  replace the existing credential. Does not change GitHub Environment variables.

  Run development, confirm azure/login from dertinfo-org/dertinfo-mono, then run production.
  See: docs/technical/guides/github-azure-federated-credentials.md

  As an operator I run this script to trust the organization repository on one subscription
  OIDC app because I want to prove development before production.

.PARAMETER GitHubEnvironment
  GitHub Environment name: development or production.

.PARAMETER RepoRoot
  Monorepo root containing infra/configuration. Defaults to three levels above this script.

.PARAMETER Force
  Do not prompt for confirmation.

.EXAMPLE
  .\Entra\Update-DertInfoSubscriptionOidcIdentities.ps1 -GitHubEnvironment development

.EXAMPLE
  .\Entra\Update-DertInfoSubscriptionOidcIdentities.ps1 -GitHubEnvironment production -Force
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('development', 'production')]
  [string] $GitHubEnvironment,

  [Parameter(Mandatory = $false)]
  [string] $RepoRoot = '',

  [switch] $Force
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Shared-DertInfoOidcFederatedCredential.ps1')

Assert-DertInfoAzCli

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
}
else {
  $RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
}

$jsonPath = Get-DertInfoOidcCredentialJsonPath -RepoRoot $RepoRoot -GitHubEnvironment $GitHubEnvironment
$displayName = "dertinfo-github-subscription-$GitHubEnvironment"
$plan = Get-DertInfoOidcFederatedCredentialPlan -DisplayName $displayName -CredentialJsonPath $jsonPath -GitHubEnvironment $GitHubEnvironment

Write-Host ''
Write-Host "Subscription OIDC credential ($GitHubEnvironment)" -ForegroundColor Cyan
Write-Host "Credential file: $jsonPath"
Show-DertInfoOidcFederatedCredentialPlan -Plans @($plan)

if ($plan.Action -eq 'Skip') {
  Write-Host ''
  Write-Host 'The subscription app already has the subject from the JSON file. Nothing to add.'
  return
}

$target = "$displayName ($GitHubEnvironment)"
$action = 'Add the federated credential listed above. Existing credentials stay in place.'
if (-not $Force -and -not $PSCmdlet.ShouldProcess($target, $action)) {
  return
}

Add-DertInfoOidcFederatedCredential -Plan $plan

Write-Host ''
Write-Host '=== Outcome ===' -ForegroundColor Green
Write-Host "Environment: $GitHubEnvironment"
Write-Host "  App: $($plan.DisplayName)"
Write-Host "  Client id unchanged: $($plan.ClientId)"
Write-Host ''
Write-Host 'GitHub Environment variables stay as they are.'
Write-Host "Next: run a workflow on dertinfo-org/dertinfo-mono for $GitHubEnvironment and confirm azure/login."
Write-Host 'Leave the repo:dertinfo/dertinfo-mono credential in place until that login succeeds.'
Write-Host 'Guide: docs/technical/guides/github-azure-federated-credentials.md'
