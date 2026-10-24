<#
.SYNOPSIS
  Shared helpers that add one GitHub Actions federated credential to an existing Entra app.

.DESCRIPTION
  Dot-sourced by the Update-DertInfo*Oidc* scripts. Compares a checked-in credential JSON
  file with the federated credentials already on an app. When the JSON subject is missing,
  builds a credential that keeps the existing one.   When the JSON name is already used by a
  different subject, the new credential name is the JSON name plus the repository owner
  from the subject. An immutable subject repo:dertinfo-org@347463852/... becomes
  github-development-dertinfo-org-347463852, because an Entra credential name cannot contain @.

  Does not create app registrations, service principals, or role assignments, and does not
  delete or replace an existing credential.

  As an operator I load this script from the OIDC update scripts to add a missing federated
  credential because I want those scripts to share one implementation.

.EXAMPLE
  . .\Entra\Shared-DertInfoOidcFederatedCredential.ps1
#>

$script:DertInfoGitHubOidcIssuer = 'https://token.actions.githubusercontent.com'
$script:DertInfoAzureTokenExchangeAudience = 'api://AzureADTokenExchange'

function Assert-DertInfoAzCli {
  if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI (az) is required on PATH.'
  }
  az account show 1>$null 2>$null
  if ($LASTEXITCODE -ne 0) {
    throw 'Not logged in to Azure CLI. Run: az login'
  }
}

function Invoke-DertInfoAz {
  param(
    [Parameter(Mandatory = $true)][string[]] $Args,
    [switch] $AllowFailure
  )
  if ($AllowFailure) {
    $output = & az @Args 2>$null
  }
  else {
    $output = & az @Args
  }
  if ($LASTEXITCODE -ne 0 -and -not $AllowFailure) {
    throw "az $($Args -join ' ') failed with exit code $LASTEXITCODE"
  }
  if ($LASTEXITCODE -ne 0) {
    return $null
  }
  return $output
}

function ConvertTo-DertInfoAzJsonText {
  param(
    $Output
  )

  if ($null -eq $Output) {
    return ''
  }
  return (@($Output) -join "`n")
}

function ConvertTo-DertInfoStringList {
  param(
    $Value
  )

  $list = New-Object System.Collections.Generic.List[string]
  foreach ($item in @($Value)) {
    if ($null -eq $item) {
      continue
    }
    $text = ([string]$item).Trim()
    if (-not [string]::IsNullOrWhiteSpace($text)) {
      $list.Add($text)
    }
  }
  return @($list.ToArray())
}

function Test-DertInfoStringSet {
  param(
    $Left,
    $Right
  )

  $leftItems = @(ConvertTo-DertInfoStringList -Value $Left | Sort-Object -Unique)
  $rightItems = @(ConvertTo-DertInfoStringList -Value $Right | Sort-Object -Unique)
  if ($leftItems.Count -ne $rightItems.Count) {
    return $false
  }
  for ($i = 0; $i -lt $leftItems.Count; $i++) {
    if (-not [string]::Equals($leftItems[$i], $rightItems[$i], [System.StringComparison]::Ordinal)) {
      return $false
    }
  }
  return $true
}

function ConvertTo-DertInfoJsonString {
  param(
    [string] $Value
  )

  if ($null -eq $Value) {
    return ''
  }
  return (($Value -replace '\\', '\\') -replace '"', '\"')
}

function Get-DertInfoOidcCredentialJsonPath {
  param(
    [Parameter(Mandatory = $true)][string] $RepoRoot,
    [Parameter(Mandatory = $true)][string] $GitHubEnvironment
  )

  $fileName = if ($GitHubEnvironment -eq 'production') {
    'github-azure-prd-credential.json'
  }
  else {
    'github-azure-dev-credential.json'
  }
  $path = Join-Path $RepoRoot "infra\configuration\$fileName"
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Federated credential file not found: $path"
  }
  return (Resolve-Path -LiteralPath $path).Path
}

function Get-DertInfoOidcSubjectParts {
  param(
    [Parameter(Mandatory = $true)][string] $Subject
  )

  $immutable = '^repo:(?<owner>[A-Za-z0-9][A-Za-z0-9-]*)@(?<ownerId>[0-9]+)/(?<repository>[A-Za-z0-9][A-Za-z0-9-]*)@(?<repositoryId>[0-9]+):environment:(?<environment>development|production)$'
  $nameOnly = '^repo:(?<owner>[A-Za-z0-9][A-Za-z0-9-]*)/(?<repository>[A-Za-z0-9][A-Za-z0-9-]*):environment:(?<environment>development|production)$'

  $ownerId = ''
  $repositoryId = ''
  if ($Subject -match $immutable) {
    $ownerId = $Matches['ownerId']
    $repositoryId = $Matches['repositoryId']
  }
  elseif ($Subject -notmatch $nameOnly) {
    throw "Federated credential subject is not a GitHub Environment subject: $Subject"
  }

  $owner = $Matches['owner']
  $repository = $Matches['repository']
  $repositoryPath = if ([string]::IsNullOrWhiteSpace($ownerId)) {
    '{0}/{1}' -f $owner, $repository
  }
  else {
    '{0}@{1}/{2}@{3}' -f $owner, $ownerId, $repository, $repositoryId
  }
  $nameSuffix = if ([string]::IsNullOrWhiteSpace($ownerId)) {
    $owner
  }
  else {
    '{0}-{1}' -f $owner, $ownerId
  }

  [pscustomobject]@{
    Owner          = $owner
    OwnerId        = $ownerId
    Repository     = $repository
    RepositoryId   = $repositoryId
    Environment    = $Matches['environment']
    RepositoryPath = $repositoryPath
    NameSuffix     = $nameSuffix
  }
}

function Get-DertInfoOidcAppClientId {
  param(
    [Parameter(Mandatory = $true)][string] $DisplayName
  )

  $raw = Invoke-DertInfoAz @(
    'ad', 'app', 'list',
    '--display-name', $DisplayName,
    '--query', '[].{appId:appId,displayName:displayName}',
    '-o', 'json'
  )
  $apps = @(ConvertTo-DertInfoAzJsonText -Output $raw | ConvertFrom-Json)
  $exact = @(
    $apps | Where-Object {
      $null -ne $_ -and [string]::Equals([string]$_.displayName, $DisplayName, [System.StringComparison]::Ordinal)
    }
  )

  if ($exact.Count -eq 0) {
    throw "App registration '$DisplayName' was not found. This script does not create apps."
  }
  if ($exact.Count -gt 1) {
    throw "Multiple app registrations named '$DisplayName'. Delete extras, then re-run."
  }
  return ([string]$exact[0].appId).Trim()
}

function Get-DertInfoOidcFederatedCredentialList {
  param(
    [Parameter(Mandatory = $true)][string] $ClientId
  )

  $raw = Invoke-DertInfoAz @('ad', 'app', 'federated-credential', 'list', '--id', $ClientId, '-o', 'json')
  return @(ConvertTo-DertInfoAzJsonText -Output $raw | ConvertFrom-Json | Where-Object { $null -ne $_ })
}

function Resolve-DertInfoOidcFederatedCredentialChange {
  param(
    [Parameter(Mandatory = $true)] $Desired,
    [Parameter(Mandatory = $true)] $Existing,
    [Parameter(Mandatory = $true)][string] $GitHubEnvironment
  )

  $desiredName = ([string]$Desired.name).Trim()
  $desiredIssuer = ([string]$Desired.issuer).Trim()
  $desiredSubject = ([string]$Desired.subject).Trim()
  $desiredDescription = [string]$Desired.description
  $desiredAudiences = @(ConvertTo-DertInfoStringList -Value $Desired.audiences)

  if ([string]::IsNullOrWhiteSpace($desiredName)) {
    throw 'Federated credential JSON is missing name.'
  }
  if (-not [string]::Equals($desiredIssuer, $script:DertInfoGitHubOidcIssuer, [System.StringComparison]::Ordinal)) {
    throw "Federated credential JSON issuer must be $($script:DertInfoGitHubOidcIssuer)."
  }
  $subjectParts = Get-DertInfoOidcSubjectParts -Subject $desiredSubject
  if (-not [string]::Equals($subjectParts.Environment, $GitHubEnvironment, [System.StringComparison]::Ordinal)) {
    throw "Credential subject environment '$($subjectParts.Environment)' does not match -GitHubEnvironment '$GitHubEnvironment'."
  }
  if (-not (Test-DertInfoStringSet -Left $desiredAudiences -Right @($script:DertInfoAzureTokenExchangeAudience))) {
    throw "Federated credential JSON audiences must be $($script:DertInfoAzureTokenExchangeAudience)."
  }

  $credentials = @($Existing | Where-Object { $null -ne $_ })
  foreach ($credential in $credentials) {
    $subject = ([string]$credential.subject).Trim()
    if (-not [string]::Equals($subject, $desiredSubject, [System.StringComparison]::Ordinal)) {
      continue
    }
    $issuer = ([string]$credential.issuer).Trim()
    if (-not [string]::Equals($issuer, $desiredIssuer, [System.StringComparison]::Ordinal)) {
      throw "A credential named '$($credential.name)' already has subject '$desiredSubject' with a different issuer."
    }
    if (-not (Test-DertInfoStringSet -Left $credential.audiences -Right $desiredAudiences)) {
      throw "A credential named '$($credential.name)' already has subject '$desiredSubject' with a different audience."
    }
    return [pscustomobject]@{
      Action         = 'Skip'
      CredentialName = ([string]$credential.name).Trim()
      Subject        = $desiredSubject
      Issuer         = $desiredIssuer
      Description    = $desiredDescription
      Audiences      = $desiredAudiences
      Reason         = "Subject already present as '$($credential.name)'."
    }
  }

  $createName = $desiredName
  $nameTaken = @(
    $credentials | Where-Object {
      [string]::Equals(([string]$_.name).Trim(), $createName, [System.StringComparison]::Ordinal)
    }
  )
  if ($nameTaken.Count -gt 0) {
    $createName = "$desiredName-$($subjectParts.NameSuffix)"
    if ($createName -notmatch '^[A-Za-z0-9][A-Za-z0-9_-]{2,119}$') {
      throw "Derived federated credential name '$createName' is not a valid Entra credential name."
    }
    $derivedTaken = @(
      $credentials | Where-Object {
        [string]::Equals(([string]$_.name).Trim(), $createName, [System.StringComparison]::Ordinal)
      }
    )
    if ($derivedTaken.Count -gt 0) {
      throw "Federated credential name '$createName' already exists with a different subject."
    }
  }

  $description = $desiredDescription.Trim()
  if ([string]::IsNullOrWhiteSpace($description)) {
    $description = $subjectParts.RepositoryPath
  }
  elseif ($description.IndexOf($subjectParts.RepositoryPath, [System.StringComparison]::Ordinal) -lt 0) {
    $description = "$description ($($subjectParts.RepositoryPath))"
  }

  [pscustomobject]@{
    Action         = 'Create'
    CredentialName = $createName
    Subject        = $desiredSubject
    Issuer         = $desiredIssuer
    Description    = $description
    Audiences      = $desiredAudiences
    Reason         = "Add '$createName' for $desiredSubject."
  }
}

function Get-DertInfoOidcFederatedCredentialPlan {
  param(
    [Parameter(Mandatory = $true)][string] $DisplayName,
    [Parameter(Mandatory = $true)][string] $CredentialJsonPath,
    [Parameter(Mandatory = $true)][string] $GitHubEnvironment
  )

  $desired = Get-Content -LiteralPath $CredentialJsonPath -Raw | ConvertFrom-Json
  $clientId = Get-DertInfoOidcAppClientId -DisplayName $DisplayName
  $existing = @(Get-DertInfoOidcFederatedCredentialList -ClientId $clientId)
  $change = Resolve-DertInfoOidcFederatedCredentialChange -Desired $desired -Existing $existing -GitHubEnvironment $GitHubEnvironment

  [pscustomobject]@{
    DisplayName    = $DisplayName
    ClientId       = $clientId
    Existing       = $existing
    Action         = $change.Action
    CredentialName = $change.CredentialName
    Subject        = $change.Subject
    Issuer         = $change.Issuer
    Description    = $change.Description
    Audiences      = $change.Audiences
    Reason         = $change.Reason
  }
}

function Show-DertInfoOidcFederatedCredentialPlan {
  param(
    [Parameter(Mandatory = $true)] $Plans
  )

  foreach ($plan in @($Plans)) {
    Write-Host ''
    Write-Host "$($plan.DisplayName) ($($plan.ClientId))"
    Write-Host '  Current subjects:'
    $credentials = @($plan.Existing | Where-Object { $null -ne $_ })
    if ($credentials.Count -eq 0) {
      Write-Host '    (none)'
    }
    else {
      foreach ($credential in $credentials) {
        Write-Host "    - $($credential.name)  $($credential.subject)"
      }
    }
    if ($plan.Action -eq 'Skip') {
      Write-Host "  Add: already present ($($plan.CredentialName))"
    }
    else {
      Write-Host "  Add: $($plan.CredentialName)"
      Write-Host "       $($plan.Subject)"
    }
  }
}

function Show-DertInfoOidcFederatedCredentialTable {
  param(
    [Parameter(Mandatory = $true)][string] $ClientId
  )

  $table = Invoke-DertInfoAz @('ad', 'app', 'federated-credential', 'list', '--id', $ClientId, '-o', 'table')
  foreach ($line in @($table)) {
    Write-Host $line
  }
}

function New-DertInfoOidcFederatedCredentialParametersJson {
  param(
    [Parameter(Mandatory = $true)] $Plan
  )

  $audienceJson = @(
    foreach ($audience in @(ConvertTo-DertInfoStringList -Value $Plan.Audiences)) {
      '        "{0}"' -f (ConvertTo-DertInfoJsonString -Value $audience)
    }
  ) -join ",`n"
  @"
{
    "name": "$(ConvertTo-DertInfoJsonString -Value $Plan.CredentialName)",
    "issuer": "$(ConvertTo-DertInfoJsonString -Value $Plan.Issuer)",
    "subject": "$(ConvertTo-DertInfoJsonString -Value $Plan.Subject)",
    "description": "$(ConvertTo-DertInfoJsonString -Value $Plan.Description)",
    "audiences": [
$audienceJson
    ]
}
"@
}

function Add-DertInfoOidcFederatedCredential {
  param(
    [Parameter(Mandatory = $true)] $Plan
  )

  Write-Host ''
  Write-Host "=== $($Plan.DisplayName) ===" -ForegroundColor Cyan
  Write-Host "Client id: $($Plan.ClientId)"

  if ($Plan.Action -eq 'Skip') {
    Write-Host "Federated credential subject already present as '$($Plan.CredentialName)'. Skipping create."
    Show-DertInfoOidcFederatedCredentialTable -ClientId $Plan.ClientId
    return
  }

  Write-Host "Creating federated credential '$($Plan.CredentialName)' for $($Plan.Subject)"
  $parametersJson = New-DertInfoOidcFederatedCredentialParametersJson -Plan $Plan
  $temp = New-TemporaryFile
  try {
    [System.IO.File]::WriteAllText($temp.FullName, $parametersJson)
    Invoke-DertInfoAz @(
      'ad', 'app', 'federated-credential', 'create',
      '--id', $Plan.ClientId,
      '--parameters', "@$($temp.FullName)"
    ) | Out-Null
  }
  finally {
    Remove-Item -LiteralPath $temp.FullName -Force -ErrorAction SilentlyContinue
  }

  Write-Host "Federated credential '$($Plan.CredentialName)' created."
  Show-DertInfoOidcFederatedCredentialTable -ClientId $Plan.ClientId
}
