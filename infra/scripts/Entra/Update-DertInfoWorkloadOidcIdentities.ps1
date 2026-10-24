<#
.SYNOPSIS
  Add the checked-in GitHub Actions federated credential to every workload OIDC app for one Environment.

.DESCRIPTION
  Holds the workload catalog (config, monitoring, storage, api, web, app, functions) and calls
  Update-DertInfoWorkloadOidcIdentity.ps1 once per part. Run development and confirm azure/login
  before production.

  Prints every app's current subjects and the subject to add, then prompts once unless -Force.
  Does not assign Azure RBAC. Does not create apps. Does not change GitHub Environment variables.

  See: docs/technical/guides/github-azure-federated-credentials.md

  As an operator I run this script to trust the organization repository on every workload OIDC
  app for one environment because I want to prove development before production.

.PARAMETER GitHubEnvironment
  GitHub Environment name: development or production.

.PARAMETER RepoRoot
  Monorepo root containing infra/configuration. Defaults to three levels above this script.

.PARAMETER Force
  Do not prompt for confirmation.

.EXAMPLE
  .\Entra\Update-DertInfoWorkloadOidcIdentities.ps1 -GitHubEnvironment development

.EXAMPLE
  .\Entra\Update-DertInfoWorkloadOidcIdentities.ps1 -GitHubEnvironment production
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

# Catalog of solution workloads. Display names are dertinfo-github-workload-<part>-<environment>.
$script:WorkloadParts = @(
  'config'
  'monitoring'
  'storage'
  'api'
  'web'
  'app'
  'functions'
)

Assert-DertInfoAzCli

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
}
else {
  $RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
}

$updateOne = Join-Path $PSScriptRoot 'Update-DertInfoWorkloadOidcIdentity.ps1'
if (-not (Test-Path -LiteralPath $updateOne)) {
  throw "Missing $updateOne"
}

$jsonPath = Get-DertInfoOidcCredentialJsonPath -RepoRoot $RepoRoot -GitHubEnvironment $GitHubEnvironment
$plans = @()
foreach ($part in $script:WorkloadParts) {
  $displayName = "dertinfo-github-workload-$part-$GitHubEnvironment"
  $plans += Get-DertInfoOidcFederatedCredentialPlan -DisplayName $displayName -CredentialJsonPath $jsonPath -GitHubEnvironment $GitHubEnvironment
}

Write-Host ''
Write-Host "Workload OIDC credentials ($GitHubEnvironment)" -ForegroundColor Cyan
Write-Host "Credential file: $jsonPath"
Show-DertInfoOidcFederatedCredentialPlan -Plans $plans

$toCreate = @($plans | Where-Object { $_.Action -eq 'Create' })
if ($toCreate.Count -eq 0) {
  Write-Host ''
  Write-Host 'Every workload app already has the subject from the JSON file. Nothing to add.'
  return
}

$target = "$GitHubEnvironment ($($toCreate.Count) credential(s))"
$action = 'Add the federated credentials listed above. Existing credentials stay in place.'
if (-not $Force -and -not $PSCmdlet.ShouldProcess($target, $action)) {
  return
}

foreach ($part in $script:WorkloadParts) {
  & $updateOne `
    -GitHubEnvironment $GitHubEnvironment `
    -Workload $part `
    -RepoRoot $RepoRoot `
    -Force
}

Write-Host ''
Write-Host '=== Outcome ===' -ForegroundColor Green
Write-Host "Environment: $GitHubEnvironment"
Write-Host "  Workloads: $($script:WorkloadParts -join ', ')"
Write-Host '  Client ids unchanged.'
Write-Host ''
Write-Host 'GitHub Environment variables stay as they are.'
Write-Host "Next: run a workflow on dertinfo-org/dertinfo-mono for $GitHubEnvironment and confirm azure/login."
Write-Host 'Leave the repo:dertinfo/dertinfo-mono credential in place until that login succeeds.'
Write-Host 'Guide: docs/technical/guides/github-azure-federated-credentials.md'
