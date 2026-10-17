##################################################################
# Docker File For DertInfo App
# Author: David Hall
# Optimised / Hardend: No
# Last Chnage: 
# - Initial Creation - David Hall - 2024/08/29
# Notes:
# - This file produces a very large image and should be optimised 
#   and hardened. The purpose of this file is to allow other artifacts 
#   in the dertinfo estate to be have a running version of the web app.
# - This file is not intended for production use as the cloud native SWA 
#   is a better option.
# - It is layered to help build the image faster. However these layers
#   do not particualrily reduce the size.
# Commands
#   docker build -t dertinfo/dertinfo-app .
#   docker run -p 44300:4280 dertinfo/dertinfo-app
#   docker run -p 44300:4280 -e API_URL=http://127.0.0.1:44100 -e AUTH_CALLBACK_URL=http://127.0.0.1:44300 dertinfo/dertinfo-app
##################################################################

# Base Stage
# Pin Node 16 — matches SPA CI and Angular 13. node:lts (24) / npm 11 fails
# npm install when a file: workspace target is missing from this build context.
FROM node:16-bookworm AS base

# Install global dependencies
RUN npm install -g @azure/static-web-apps-cli

# Create a builder stage. This stage is used to build the Angular client
FROM base AS builder

# Set the working directory
WORKDIR /build

# Install build dependencies
RUN npm install -g @angular/cli@14 typescript

# Copy the static web app files
COPY ./src/client/package.json package.json
COPY ./src/client/package-lock.json package-lock.json

# Install node modules
RUN npm install --force
# note - we have to force here as we have package conflicts that will not install the dependencies without the force. This needs tobe addresssed. #15

# Copy the rest of the files from the host "./src/client" directory to the container current working directory "/build"
COPY ./src/client .
# node-modules is ignored due to the .dockerignore file

# Build the Angular Client
RUN ng build
# note - we do not pass the environment here as this is only ever a dev container.
#      - on deployment the release pipeline builds the static web app from the code.
#      - the SWA build instuction supplies the flag. 

# Copy the startup script
COPY ./docker-launch.sh .

# Final Stage
FROM base AS final

# Expose the port for the SWA client
EXPOSE 4280

# Define the default envionment variables for replacements
ENV DEFAULT_API_URL http://localhost:44100/api
ENV DEFAULT_AUTH_CALLBACK_URL http://localhost:44300
ENV DEFAULT_ALLOWED_DOMAINS localhost:44100

# Define the envionment variables that'll be passed on docker run
ENV API_URL http://localhost:44100/api
ENV AUTH_CALLBACK_URL http://localhost:44300
ENV ALLOWED_DOMAINS localhost:44100

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /build/dist /app/dist
# note - on the client just copying the dist folder causes us routing errors. 
# todo - We need to come back to this to see if we can reduce the image size. 
#      - moving on as we need to get this opensourced to get some help.  
# note - I tried this again and routing issues happened again. 

COPY --from=builder /build/staticwebapp.config.json ./app/staticwebapp.config.json
COPY --from=builder /build/docker-launch.sh ./docker-launch.sh

# Make the startup script executable
RUN chmod +x ./docker-launch.sh

# Start the SWA CLI to serve the static web app on running the container
CMD ["bash","./docker-launch.sh"]
