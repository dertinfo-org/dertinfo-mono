<#
.SYNOPSIS
  Add the checked-in GitHub Actions federated credential to one existing workload OIDC app.

.DESCRIPTION
  Finds dertinfo-github-workload-<part>-development or dertinfo-github-workload-<part>-production.
  Reads the matching credential JSON from infra/configuration/. Adds that subject when it is
  missing. When the JSON credential name is already used by another subject, the new credential
  name appends the owner. @ in an immutable subject is written as - in that name. Prints the
  current subjects and the subject to add, then prompts unless -Force.

  Does not create the app or the service principal. Does not assign Azure RBAC. Does not delete
  or replace the existing credential. Does not change GitHub Environment variables.

  See: docs/technical/guides/github-azure-federated-credentials.md

  As an operator I run this script to trust the organization repository on one workload OIDC
  app because I want a single part on one environment updated on its own.

.PARAMETER GitHubEnvironment
  GitHub Environment name: development or production.

.PARAMETER Workload
  Workload part token: config, monitoring, storage, api, web, app, or functions.

.PARAMETER RepoRoot
  Monorepo root containing infra/configuration. Defaults to three levels above this script.

.PARAMETER Force
  Do not prompt for confirmation.

.EXAMPLE
  .\Entra\Update-DertInfoWorkloadOidcIdentity.ps1 `
    -GitHubEnvironment development `
    -Workload api
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('development', 'production')]
  [string] $GitHubEnvironment,

  [Parameter(Mandatory = $true)]
  [ValidateSet('config', 'monitoring', 'storage', 'api', 'web', 'app', 'functions')]
  [string] $Workload,

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
$displayName = "dertinfo-github-workload-$Workload-$GitHubEnvironment"
$plan = Get-DertInfoOidcFederatedCredentialPlan -DisplayName $displayName -CredentialJsonPath $jsonPath -GitHubEnvironment $GitHubEnvironment

Write-Host ''
Write-Host "Workload OIDC credential ($GitHubEnvironment / $Workload)" -ForegroundColor Cyan
Write-Host "Credential file: $jsonPath"
Show-DertInfoOidcFederatedCredentialPlan -Plans @($plan)

if ($plan.Action -eq 'Skip') {
  Write-Host ''
  Write-Host "The workload app already has the subject from the JSON file. Nothing to add."
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
