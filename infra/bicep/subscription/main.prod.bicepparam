/*
Subscription foundation — production leaf.
Admin-only: az deployment sub create --location uksouth --template-file main.bicep --parameters main.prod.bicepparam
Inherits main.shared.bicepparam; override only what differs for this environment.
Secrets / identifiable values: empty placeholders here or in shared; supply via CLI / GitHub Environment.
Requires Bicep CLI 0.44.1+.
environmentTag stays 'prd' to match Azure RG naming (rg-prd-…).
*/

using 'main.bicep'
extends './main.shared.bicepparam'

param environmentTag = 'prd'

param allowedSqlDatabaseSkus = [
  'Basic'
  'S0'
]
