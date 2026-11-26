/*
Outline: Subscription foundation for the agent-safe / development Azure estate.
Empty subscription: tenant administrator (portal / billing) only.
Foundation deploy: GitHub Actions subscription-infra-cd.yml (privileged subscription SP via OIDC).
  Agents and day-to-day contributors do not hold subscription-scope deploy rights.
Author: DertInfo
Azure CLI (admin / break-glass):
  az account set --subscription <new-subscription-id>
  az deployment sub create --location uksouth --template-file main.bicep --parameters main.dev.bicepparam
  az deployment sub create --location uksouth --template-file main.bicep --parameters main.prod.bicepparam
Optional overrides (workload SP object ids; empty skips that part):
  --parameters pipelinePrincipalIdApi=<entra-object-id>
Shared non-secret defaults: main.shared.bicepparam (extends). Leaf files: main.dev.bicepparam / main.prod.bicepparam.
Requires Bicep CLI 0.44.1+.
*/

targetScope = 'subscription'

// #####################################################
// Parameters
// #####################################################

@description('Azure region for resource groups and deployment metadata.')
param location string = 'uksouth'

@description('Environment tag for resources (set in main.dev.bicepparam / main.prod.bicepparam).')
@allowed([
  'dev'
  'prd'
])
param environmentTag string = 'dev'

@description('Product slug used in resource group names.')
param productSlug string = 'dertinfo'

@description('Workload parts that each get a resource group.')
param workloadParts array = [
  'config'
  'storage'
  'web'
  'app'
  'api'
  'monitoring'
  'functions'
]

@description('Entra object id of the config workload SP. Leave empty to skip that RG role assignment.')
param pipelinePrincipalIdConfig string = ''

@description('Entra object id of the monitoring workload SP.')
param pipelinePrincipalIdMonitoring string = ''

@description('Entra object id of the storage workload SP.')
param pipelinePrincipalIdStorage string = ''

@description('Entra object id of the api workload SP.')
param pipelinePrincipalIdApi string = ''

@description('Entra object id of the web workload SP.')
param pipelinePrincipalIdWeb string = ''

@description('Entra object id of the app workload SP.')
param pipelinePrincipalIdApp string = ''

@description('Entra object id of the functions workload SP. Leave empty to skip that RG role assignment.')
param pipelinePrincipalIdFunctions string = ''

@description('Role definition id or name for the pipeline identity on each RG (Contributor by default).')
param pipelineRoleDefinitionIdOrName string = 'b24988ac-6180-42a0-ab88-20f7382dd24c' // 'Contributor'

@description('Resource types allowed by Azure Policy (Deny). Values come from main.shared.bicepparam.')
param allowedResourceTypes array

@description('App Service plan SKUs allowed by policy (Deny).')
param allowedAppServicePlanSkus array = [
  'F1'
  'D1'
  'B1'
  'FC1'
  'Free'
  'Shared'
  'Basic'
]

@description('SQL database sku.name values allowed by policy (Deny). Shared default is Basic.')
param allowedSqlDatabaseSkus array = [
  'Basic'
]

@description('Disable AVM telemetry.')
param enableTelemetry bool = false

// #####################################################
// Variables
// #####################################################

var regionTlaByLocation = {
  uksouth: 'uks'
  eastus: 'eus'
  northeurope: 'neu'
}

var regionTla = regionTlaByLocation[location]

var resourceGroupNames = [for part in workloadParts: 'rg-${environmentTag}-${productSlug}-${part}-${regionTla}']

// Lookups of part RGs created in the resourceGroups loop. Not names to deploy.
var configResourceGroupLookup = 'rg-${environmentTag}-${productSlug}-config-${regionTla}'
var monitoringResourceGroupLookup = 'rg-${environmentTag}-${productSlug}-monitoring-${regionTla}'
var storageResourceGroupLookup = 'rg-${environmentTag}-${productSlug}-storage-${regionTla}'
var functionsResourceGroupLookup = 'rg-${environmentTag}-${productSlug}-functions-${regionTla}'

var workloadDeployPrincipals = [
  {
    part: 'config'
    principalId: pipelinePrincipalIdConfig
  }
  {
    part: 'monitoring'
    principalId: pipelinePrincipalIdMonitoring
  }
  {
    part: 'storage'
    principalId: pipelinePrincipalIdStorage
  }
  {
    part: 'api'
    principalId: pipelinePrincipalIdApi
  }
  {
    part: 'web'
    principalId: pipelinePrincipalIdWeb
  }
  {
    part: 'app'
    principalId: pipelinePrincipalIdApp
  }
  {
    part: 'functions'
    principalId: pipelinePrincipalIdFunctions
  }
]

var resourceGroupTags = {
  environment: environmentTag
  product: 'dertinfo'
  iac: 'infra-bicep-subscription'
}

// Roles the API workload SP may assign on the config RG (site MI only). Not a default for other workloads.
var appConfigurationDataReaderRoleId = '516239f1-63e1-4d78-a4de-a74fb236a071'
var keyVaultSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'
var apiConfigRoleAssignmentCondition = '((!(ActionMatches{\'Microsoft.Authorization/roleAssignments/write\'})) OR (@Request[Microsoft.Authorization/roleAssignments:RoleDefinitionId] ForAnyOfAnyValues:GuidEquals {${appConfigurationDataReaderRoleId}, ${keyVaultSecretsUserRoleId}})) AND ((!(ActionMatches{\'Microsoft.Authorization/roleAssignments/delete\'})) OR (@Resource[Microsoft.Authorization/roleAssignments:RoleDefinitionId] ForAnyOfAnyValues:GuidEquals {${appConfigurationDataReaderRoleId}, ${keyVaultSecretsUserRoleId}}))'

var apiConfigNestedDeployRoleName = 'dertinfo-api-config-nested-deploy-${environmentTag}'
var swaOperationStatusRoleName = 'dertinfo-swa-operation-status-read-${environmentTag}'
var storageFunctionsListKeysRoleName = 'dertinfo-storage-functions-listkeys-${environmentTag}'
var functionAppStopRoleName = 'dertinfo-functionapp-stop-${environmentTag}'

// Roles the FUNCTIONS workload SP may assign on the functions RG (site MI host storage + Logic App stop).
var storageBlobDataOwnerRoleId = 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b'
var storageQueueDataContributorRoleId = '974c5e8b-45b9-4653-ba55-5f855dd0fb88'
var storageTableDataContributorRoleId = '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'
var functionAppStopRoleDefinitionGuid = guid(subscription().id, environmentTag, 'dertinfo-functionapp-stop')
var functionsRgRoleAssignmentCondition = '((!(ActionMatches{\'Microsoft.Authorization/roleAssignments/write\'})) OR (@Request[Microsoft.Authorization/roleAssignments:RoleDefinitionId] ForAnyOfAnyValues:GuidEquals {${storageBlobDataOwnerRoleId}, ${storageQueueDataContributorRoleId}, ${storageTableDataContributorRoleId}, ${functionAppStopRoleDefinitionGuid}})) AND ((!(ActionMatches{\'Microsoft.Authorization/roleAssignments/delete\'})) OR (@Resource[Microsoft.Authorization/roleAssignments:RoleDefinitionId] ForAnyOfAnyValues:GuidEquals {${storageBlobDataOwnerRoleId}, ${storageQueueDataContributorRoleId}, ${storageTableDataContributorRoleId}, ${functionAppStopRoleDefinitionGuid}}))'

// Roles the STORAGE workload SP may assign on the storage RG (images Blob Data Contributor for named site MIs).
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
var storageRgRoleAssignmentCondition = '((!(ActionMatches{\'Microsoft.Authorization/roleAssignments/write\'})) OR (@Request[Microsoft.Authorization/roleAssignments:RoleDefinitionId] ForAnyOfAnyValues:GuidEquals {${storageBlobDataContributorRoleId}})) AND ((!(ActionMatches{\'Microsoft.Authorization/roleAssignments/delete\'})) OR (@Resource[Microsoft.Authorization/roleAssignments:RoleDefinitionId] ForAnyOfAnyValues:GuidEquals {${storageBlobDataContributorRoleId}}))'

// #####################################################
// References
// #####################################################

// #####################################################
// Resources
// #####################################################

resource apiConfigNestedDeployRole 'Microsoft.Authorization/roleDefinitions@2018-01-01-preview' = {
  name: guid(subscription().id, environmentTag, 'dertinfo-api-config-nested-deploy')
  dependsOn: [
    resourceGroups
  ]
  properties: {
    roleName: apiConfigNestedDeployRoleName
    description: 'Write nested ARM deployments on the config RG so API infra can assign site MI data-plane roles. Not Contributor.'
    type: 'CustomRole'
    assignableScopes: [
      resourceId('Microsoft.Resources/resourceGroups', configResourceGroupLookup)
    ]
    permissions: [
      {
        actions: [
          'Microsoft.Resources/deployments/read'
          'Microsoft.Resources/deployments/write'
          'Microsoft.Resources/deployments/operationStatuses/read'
        ]
        notActions: []
      }
    ]
  }
}

// SWA custom-domain bind is async. ARM polls at subscription/location scope
// (errors may name staticSitesOperationStatuses). That string is not in the
// Microsoft.Web provider operations catalog, so a custom role must use the
// published locations read actions instead. RG Contributor cannot cover this.
resource swaOperationStatusRole 'Microsoft.Authorization/roleDefinitions@2018-01-01-preview' = {
  name: guid(subscription().id, environmentTag, 'dertinfo-swa-operation-status-read')
  properties: {
    roleName: swaOperationStatusRoleName
    description: 'Poll Static Web App async operation status (custom-domain bind). Not Contributor.'
    type: 'CustomRole'
    assignableScopes: [
      subscription().id
    ]
    permissions: [
      {
        actions: [
          'Microsoft.Web/locations/operationResults/read'
          'Microsoft.Web/locations/*/read'
        ]
        notActions: []
      }
    ]
  }
}

resource swaOperationStatusWeb 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(pipelinePrincipalIdWeb)) {
  name: guid(subscription().id, pipelinePrincipalIdWeb, swaOperationStatusRole.id)
  properties: {
    roleDefinitionId: swaOperationStatusRole.id
    principalId: pipelinePrincipalIdWeb
    principalType: 'ServicePrincipal'
    description: 'Web workload identity — poll SWA operation status at subscription/location scope'
  }
}

resource swaOperationStatusApp 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(pipelinePrincipalIdApp)) {
  name: guid(subscription().id, pipelinePrincipalIdApp, swaOperationStatusRole.id)
  properties: {
    roleDefinitionId: swaOperationStatusRole.id
    principalId: pipelinePrincipalIdApp
    principalType: 'ServicePrincipal'
    description: 'App workload identity — poll SWA operation status at subscription/location scope'
  }
}

resource storageFunctionsListKeysRole 'Microsoft.Authorization/roleDefinitions@2018-01-01-preview' = {
  name: guid(subscription().id, environmentTag, 'dertinfo-storage-functions-listkeys')
  dependsOn: [
    resourceGroups
  ]
  properties: {
    roleName: storageFunctionsListKeysRoleName
    description: 'Read the Function App and list host keys so storage Event Grid can form blobs_extension webhook URLs. Not Contributor.'
    type: 'CustomRole'
    assignableScopes: [
      resourceId('Microsoft.Resources/resourceGroups', functionsResourceGroupLookup)
    ]
    permissions: [
      {
        actions: [
          'Microsoft.Web/sites/read'
          'Microsoft.Web/sites/host/listkeys/action'
        ]
        notActions: []
      }
    ]
  }
}

resource functionAppStopRole 'Microsoft.Authorization/roleDefinitions@2018-01-01-preview' = {
  name: functionAppStopRoleDefinitionGuid
  dependsOn: [
    resourceGroups
  ]
  properties: {
    roleName: functionAppStopRoleName
    description: 'Stop a Function App in the functions RG (excess-use Logic App). Not Contributor.'
    type: 'CustomRole'
    assignableScopes: [
      resourceId('Microsoft.Resources/resourceGroups', functionsResourceGroupLookup)
    ]
    permissions: [
      {
        actions: [
          'Microsoft.Web/sites/stop/action'
        ]
        notActions: []
      }
    ]
  }
}

// #####################################################
// Modules
// #####################################################

// Policy composition (definitions + assignments) — not a pure AVM wrapper.
module policyModule './policy/main.bicep' = {
  name: 'subscription-policy'
  params: {
    assignmentSuffix: environmentTag
    allowedResourceTypes: allowedResourceTypes
    allowedAppServicePlanSkus: allowedAppServicePlanSkus
    allowedSqlDatabaseSkus: allowedSqlDatabaseSkus
    enableTelemetry: enableTelemetry
  }
}

// #####################################################
// AVM Modules
// #####################################################

module resourceGroups 'br/public:avm/res/resources/resource-group:0.4.4' = [
  for name in resourceGroupNames: {
    name: 'avm-rg-${name}'
    params: {
      name: name
      location: location
      tags: resourceGroupTags
      enableTelemetry: enableTelemetry
    }
  }
]

module pipelineRgRoleAssignments 'br/public:avm/res/authorization/role-assignment/rg-scope:0.1.1' = [
  for item in workloadDeployPrincipals: if (!empty(item.principalId)) {
    name: 'avm-rbac-${item.part}'
    scope: resourceGroup('rg-${environmentTag}-${productSlug}-${item.part}-${regionTla}')
    dependsOn: [
      resourceGroups
    ]
    params: {
      principalId: item.principalId
      roleDefinitionIdOrName: pipelineRoleDefinitionIdOrName
      principalType: 'ServicePrincipal'
      description: 'GitHub Actions ${item.part} workload identity (Contributor on its own RG only)'
      enableTelemetry: enableTelemetry
    }
  }
]

// Storage workload has Contributor on the storage RG only (no Reader / Key Vault Secrets User on config).
// Incremental ARM does not delete leftover storage-on-config assignments — remove those in Azure.
// Images data-plane and Event Grid moved to storage Bicep: leftover FUNCTIONS Reader /
// EventGrid Contributor / nested-deploy / UAA on the storage RG must be deleted in Azure.

// Special case: API infra CD assigns two data-plane roles to the site MI on the config RG.
// UAA is not a default workload role. Condition limits write/delete to those two role definition ids.
module pipelineApiConfigUserAccessAdmin 'br/public:avm/res/authorization/role-assignment/rg-scope:0.1.1' = if (!empty(pipelinePrincipalIdApi)) {
  name: 'avm-rbac-api-config-uaa'
  scope: resourceGroup(configResourceGroupLookup)
  dependsOn: [
    resourceGroups
    pipelineRgRoleAssignments
  ]
  params: {
    principalId: pipelinePrincipalIdApi
    roleDefinitionIdOrName: '18d7d88d-d35e-4fb5-a5c3-7773c20a72d9' // 'User Access Administrator'
    principalType: 'ServicePrincipal'
    condition: apiConfigRoleAssignmentCondition
    conditionVersion: '2.0'
    description: 'API workload identity — assign only App Configuration Data Reader and Key Vault Secrets User on the config RG'
    enableTelemetry: enableTelemetry
  }
}

module pipelineApiConfigReader 'br/public:avm/res/authorization/role-assignment/rg-scope:0.1.1' = if (!empty(pipelinePrincipalIdApi)) {
  name: 'avm-rbac-api-config-reader'
  scope: resourceGroup(configResourceGroupLookup)
  dependsOn: [
    resourceGroups
    pipelineRgRoleAssignments
  ]
  params: {
    principalId: pipelinePrincipalIdApi
    roleDefinitionIdOrName: 'acdd72a7-3385-48ef-bd42-f606fba81ae7' // 'Reader'
    principalType: 'ServicePrincipal'
    description: 'API workload identity — resolve existing Key Vault and App Configuration'
    enableTelemetry: enableTelemetry
  }
}

module pipelineApiConfigNestedDeploy 'br/public:avm/res/authorization/role-assignment/rg-scope:0.1.1' = if (!empty(pipelinePrincipalIdApi)) {
  name: 'avm-rbac-api-config-nested-deploy'
  scope: resourceGroup(configResourceGroupLookup)
  dependsOn: [
    resourceGroups
    pipelineRgRoleAssignments
  ]
  params: {
    principalId: pipelinePrincipalIdApi
    roleDefinitionIdOrName: apiConfigNestedDeployRole.id
    principalType: 'ServicePrincipal'
    description: 'API workload identity — nested ARM deployments on the config RG (site MI roles)'
    enableTelemetry: enableTelemetry
  }
}

module pipelineApiMonitoringReader 'br/public:avm/res/authorization/role-assignment/rg-scope:0.1.1' = if (!empty(pipelinePrincipalIdApi)) {
  name: 'avm-rbac-api-monitoring-reader'
  scope: resourceGroup(monitoringResourceGroupLookup)
  dependsOn: [
    resourceGroups
    pipelineRgRoleAssignments
  ]
  params: {
    principalId: pipelinePrincipalIdApi
    roleDefinitionIdOrName: 'acdd72a7-3385-48ef-bd42-f606fba81ae7' // 'Reader'
    principalType: 'ServicePrincipal'
    description: 'API workload identity — resolve existing Application Insights'
    enableTelemetry: enableTelemetry
  }
}

module pipelineFunctionsMonitoringReader 'br/public:avm/res/authorization/role-assignment/rg-scope:0.1.1' = if (!empty(pipelinePrincipalIdFunctions)) {
  name: 'avm-rbac-functions-monitoring-reader'
  scope: resourceGroup(monitoringResourceGroupLookup)
  dependsOn: [
    resourceGroups
    pipelineRgRoleAssignments
  ]
  params: {
    principalId: pipelinePrincipalIdFunctions
    roleDefinitionIdOrName: 'acdd72a7-3385-48ef-bd42-f606fba81ae7' // 'Reader'
    principalType: 'ServicePrincipal'
    description: 'Functions workload identity — resolve existing Application Insights'
    enableTelemetry: enableTelemetry
  }
}

module pipelineFunctionsRgUserAccessAdmin 'br/public:avm/res/authorization/role-assignment/rg-scope:0.1.1' = if (!empty(pipelinePrincipalIdFunctions)) {
  name: 'avm-rbac-functions-rg-uaa'
  scope: resourceGroup(functionsResourceGroupLookup)
  dependsOn: [
    resourceGroups
    pipelineRgRoleAssignments
    functionAppStopRole
  ]
  params: {
    principalId: pipelinePrincipalIdFunctions
    roleDefinitionIdOrName: '18d7d88d-d35e-4fb5-a5c3-7773c20a72d9' // 'User Access Administrator'
    principalType: 'ServicePrincipal'
    condition: functionsRgRoleAssignmentCondition
    conditionVersion: '2.0'
    description: 'Functions workload identity — assign only host-storage data-plane roles and the function-stop custom role on the functions RG'
    enableTelemetry: enableTelemetry
  }
}

module pipelineStorageRgUserAccessAdmin 'br/public:avm/res/authorization/role-assignment/rg-scope:0.1.1' = if (!empty(pipelinePrincipalIdStorage)) {
  name: 'avm-rbac-storage-rg-uaa'
  scope: resourceGroup(storageResourceGroupLookup)
  dependsOn: [
    resourceGroups
    pipelineRgRoleAssignments
  ]
  params: {
    principalId: pipelinePrincipalIdStorage
    roleDefinitionIdOrName: '18d7d88d-d35e-4fb5-a5c3-7773c20a72d9' // 'User Access Administrator'
    principalType: 'ServicePrincipal'
    condition: storageRgRoleAssignmentCondition
    conditionVersion: '2.0'
    description: 'Storage workload identity — assign only Storage Blob Data Contributor on the storage RG'
    enableTelemetry: enableTelemetry
  }
}

module pipelineStorageFunctionsListKeys 'br/public:avm/res/authorization/role-assignment/rg-scope:0.1.1' = if (!empty(pipelinePrincipalIdStorage)) {
  name: 'avm-rbac-storage-functions-listkeys'
  scope: resourceGroup(functionsResourceGroupLookup)
  dependsOn: [
    resourceGroups
    pipelineRgRoleAssignments
  ]
  params: {
    principalId: pipelinePrincipalIdStorage
    roleDefinitionIdOrName: storageFunctionsListKeysRole.id
    principalType: 'ServicePrincipal'
    description: 'Storage workload identity — list Function App host keys for Event Grid blob webhooks'
    enableTelemetry: enableTelemetry
  }
}

// #####################################################
// Outputs
// #####################################################

output resourceGroupNames array = [for (name, i) in resourceGroupNames: resourceGroups[i].outputs.name]
output environmentTag string = environmentTag
output location string = location
output allowedResourceTypesAssignmentId string = policyModule.outputs.allowedResourceTypesAssignmentId
output appServiceSkuAssignmentId string = policyModule.outputs.appServiceSkuAssignmentId
output sqlSkuAssignmentId string = policyModule.outputs.sqlSkuAssignmentId
