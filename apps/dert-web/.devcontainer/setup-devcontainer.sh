# ##################
# Description: 
# This script creates environment configuration files for docker-compose to use when running in a codespace. 
# These envionment files allow the docker compose to pass envionment variables to the containers. Which in 
# turn configure the applications with the details. 
# Affects:
# Relevant to running in a codespace only. 
# ##################

# At the location of this shell script, create files for each of the secrets that we want to use. (api.env, web.env) 
# For each of the following environment variables, create a secrets file for reference in docker-compose

# AUTH0_APP_CLIENT_ID - Auth0 client id
# AUTH0_MANAGEMENT_CLIENT_ID - Auth0 management client id
# AUTH0_MANAGEMENT_CLIENT_SECRET - Auth0 management client secret
# AUTH0_WEB_CLIENT_ID - Auth0 web client id
# SENDGRID_API_KEY - SendGrid API key

# Notify the user that the script is running
echo "Starting setting up the configuration & secrets for the codespace."

# ##################
# Setup for the API
# ##################

# For each of the secrets coming in from the codespace environment, add it to the api.env file.
echo "Auth0__ManagementClientId=$AUTH0_MANAGEMENT_CLIENT_ID" >> ../../../infra/secrets/api.env # append to the file from now on
echo "Auth0__ManagementClientSecret=REDACTED
echo "SendGrid__ApiKey=$SENDGRID_API_KEY" >> ../../../infra/secrets/api.env

# ##################
# Setup for the App
# ##################

# Check if there is a codespaces value in the environment
if [ -z "$CODESPACE_NAME" ]; then
  # If there is no codespace name then we need to set it to a default value
  echo "API_URL=http://localhost:44100/api" > ../../../infra/secrets/web.env
  echo "AUTH_CALLBACK_URL=http://localhost:44200" >> ../../../infra/secrets/web.env
  echo "ALLOWED_DOMAINS=localhost:44100" >> ../../../infra/secrets/web.env
else
  # As the codespace needs special urls to access forwarded ports then we need to accomodate that for the API and the Auth0 callback url
  echo "API_URL=https://$CODESPACE_NAME-44100.app.github.dev/api" > ../../../infra/secrets/web.env
  echo "AUTH_CALLBACK_URL=https://$CODESPACE_NAME-44200.app.github.dev" >> ../../../infra/secrets/web.env
  echo "ALLOWED_DOMAINS=$CODESPACE_NAME-44100.app.github.dev" >> ../../../infra/secrets/web.env
fi


# ##################
# Install the node packages needed for the codespace
# ##################

npm install -g typescript @azure/static-web-apps-cli @angular/cli@13 

# ##################
# Give feedback to the user that the setup has completed
# ##################

echo "Completed setting up the configuration & secrets for the codespace."
