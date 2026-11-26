/*
Subscription policy composition: custom policy definitions + AVM policy assignments.
Not a pure AVM wrapper — keeps all policy concerns collated here.
*/

targetScope = 'subscription'

// #####################################################
// Parameters
// #####################################################

@description('Suffix for policy names (e.g. dev).')
param assignmentSuffix string

@description('Resource types allowed by Azure Policy (Deny).')
param allowedResourceTypes array

@description('App Service plan SKU names allowed (Deny otherwise).')
param allowedAppServicePlanSkus array

@description('SQL database sku.name values allowed (Deny otherwise).')
param allowedSqlDatabaseSkus array

@description('Disable AVM telemetry.')
param enableTelemetry bool = false

// #####################################################
// Variables
// #####################################################

// Built-in: Allowed resource types (https://www.azadvertizer.net/azpolicyadvertizer/a08ec900-254a-4555-9bf5-e42af04b5c5c.html)
var policyAllowedResourceTypesId = '/providers/Microsoft.Authorization/policyDefinitions/a08ec900-254a-4555-9bf5-e42af04b5c5c'
var appServiceSkuPolicyName = 'di-policy-appservice-skus-${assignmentSuffix}'
var sqlSkuPolicyName = 'di-policy-sql-skus-${assignmentSuffix}'
var sqlSkuPolicyDescription = 'Deny SQL database SKUs other than ${join(allowedSqlDatabaseSkus, ', ')}.'

// #####################################################
// References
// #####################################################

// #####################################################
// Resources
// #####################################################

// No AVM for policyDefinitions — custom SKU allow-lists.
resource appServiceSkuPolicy 'Microsoft.Authorization/policyDefinitions@2021-06-01' = {
  name: appServiceSkuPolicyName
  properties: {
    displayName: 'DertInfo allowed App Service plan SKUs (${assignmentSuffix})'
    description: 'Only F1/D1/B1/FC1 (and Free/Shared/Basic tier names) may be used for App Service plans.'
    mode: 'Indexed'
    policyRule: {
      if: {
        allOf: [
          {
            field: 'type'
            equals: 'Microsoft.Web/serverfarms'
          }
          {
            not: {
              field: 'Microsoft.Web/serverfarms/sku.name'
              in: allowedAppServicePlanSkus
            }
          }
        ]
      }
      then: {
        effect: 'Deny'
      }
    }
  }
}

resource sqlSkuPolicy 'Microsoft.Authorization/policyDefinitions@2021-06-01' = {
  name: sqlSkuPolicyName
  properties: {
    displayName: 'DertInfo allowed SQL database SKUs (${assignmentSuffix})'
    description: sqlSkuPolicyDescription
    mode: 'Indexed'
    policyRule: {
      if: {
        allOf: [
          {
            field: 'type'
            equals: 'Microsoft.Sql/servers/databases'
          }
          {
            field: 'name'
            notEquals: 'master'
          }
          {
            not: {
              field: 'Microsoft.Sql/servers/databases/sku.name'
              in: allowedSqlDatabaseSkus
            }
          }
        ]
      }
      then: {
        effect: 'Deny'
      }
    }
  }
}

// #####################################################
// Modules
// #####################################################

// #####################################################
// AVM Modules
// #####################################################

module allowedResourceTypesAssignment 'br/public:avm/res/authorization/policy-assignment/sub-scope:0.1.0' = {
  name: 'avm-policy-allowed-types-${assignmentSuffix}'
  params: {
    name: 'di-policy-allowed-types-${assignmentSuffix}'
    displayName: 'DertInfo allowed resource types (${assignmentSuffix})'
    description: 'Deny resource types outside the DertInfo stack allow-list.'
    policyDefinitionId: policyAllowedResourceTypesId
    enforcementMode: 'Default'
    parameters: {
      listOfResourceTypesAllowed: {
        value: allowedResourceTypes
      }
    }
    enableTelemetry: enableTelemetry
  }
}

module appServiceSkuAssignment 'br/public:avm/res/authorization/policy-assignment/sub-scope:0.1.0' = {
  name: 'avm-policy-appservice-skus-${assignmentSuffix}'
  params: {
    name: 'di-assign-appservice-skus-${assignmentSuffix}'
    displayName: 'DertInfo App Service plan SKUs (${assignmentSuffix})'
    description: 'Deny App Service plan SKUs outside the allow-list.'
    policyDefinitionId: appServiceSkuPolicy.id
    enforcementMode: 'Default'
    enableTelemetry: enableTelemetry
  }
}

module sqlSkuAssignment 'br/public:avm/res/authorization/policy-assignment/sub-scope:0.1.0' = {
  name: 'avm-policy-sql-skus-${assignmentSuffix}'
  params: {
    name: 'di-assign-sql-skus-${assignmentSuffix}'
    displayName: 'DertInfo SQL database SKUs (${assignmentSuffix})'
    description: sqlSkuPolicyDescription
    policyDefinitionId: sqlSkuPolicy.id
    enforcementMode: 'Default'
    enableTelemetry: enableTelemetry
  }
}

// #####################################################
// Outputs
// #####################################################

output allowedResourceTypesAssignmentId string = allowedResourceTypesAssignment.outputs.resourceId
output appServiceSkuAssignmentId string = appServiceSkuAssignment.outputs.resourceId
output sqlSkuAssignmentId string = sqlSkuAssignment.outputs.resourceId
