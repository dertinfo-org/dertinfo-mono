# DertInfo - App

This is the mobile application for DertInfo that is used for a number of purposes but primarily for collecting scores at venue and taking photographs of the score sheets for verification. 

The production version of this solution is visible at [https://app.dertinfo.co.uk](https://app.dertinfo.co.uk)

> **Note:** If you are unfamiliar with the collection of services that are part of DertInfo please refer to the [wiki 
](https://github.com/dertinfo/dertinfo/wiki) in the repository [dertinfo/dertinfo](https://github.com/dertinfo/dertinfo).

## Table of Contents

- [Technology](#technology)
- [Architecture](#architecture)
- [Development Environment](#development-environment)
- [Running The Workload](#running-the-workload)
- [Running The Dependencies](#running-the-dependencies)
- [Usage](#usage)
- [Key Features](#key-features)
- [Contributing](#contributing)
- [License](#license)

## Technology

This project is a ["Azure Static Web App"](https://azure.microsoft.com/en-gb/products/app-service/static). 

This static web app consists of an ["Angular"](https://angular.dev/) client. It's embedded inside a static web app for the purpose of hosting this application on Azure. 

## Architecture

![Application Containers](/docs/images/architecture-dertinfo-app-containerlevel.png)

## Development Environment 

### GitHub Codespaces

This app has been fully setup for codespaces and is by far the easiest way to get started. 

Using GitHub codespaces provides the lowest barrier to entry to setup a fully working development environment that you can pretty much just launch and go. However codespaces does have usage limits so working locally might be a better option in the long run. In order to setup your local environment use the codespace as a guide by inspecting the .devcontainer definition that instructs how the codespace is setup so that you can replicate locally. 

**Launch the codespace:**

![image](https://github.com/user-attachments/assets/f4ac2952-9762-4cf5-9eac-c7b7585ec292)

Let the codespace setup by applying the VS code extensions and allow the startup script s to run. (codespace defined in .devcontainer). This will setup the environment for running the app and it's dependencies.

### Local Development

For local development it is recommended to take the codespace as the required configuration and then apply locally. There are a number of things that you will need and these can be extracted declaratively from the code space configuration.

## Running The Workload

### Running with Hot Reload

Using the approach below will give you the "hot reload" functionality from angular which will update the application which will after the rebuild show you changes directly in the browser without a restart.

#### Run the angular app

From the root of the repository issue the following commands
```
cd src/client
ng serve
```
This will spin up the angular application on http://localhost:4200. 

To better mirror the deployment environment we now wrap this in an Azure Static Web app by using the Azure Static Web App CLI 

#### Run as a static web app

The following command provides the above angular app as a static web app via the static web app CLI mirroring the production environment. 
```
swa start http://localhost:4200 --port 44300
```

At this point (if running locally) you should be able to proceed to http://localhost:44300 and you will see the running application there. If running in codespaces please see forwarded ports and you should be able to see the app running there. 

### Running the App In Docker

If you just want to run your local code in docker (provided you have installed docker capability for your system) you can use the following commands to build the image and run the container. This not likely a common use scenario. 

From the root of the repository in the terminal
```
docker build -t dertinfo/dertinfo-app .
```
Run a container from the image
```
docker run dertinfo/dertinfo-app
```
Note Issue [#25](https://github.com/dertinfo/dertinfo-app/issues/25) as it's not working correctly following codespace changes and we ned to resolve. 

## Running The Dependencies

In order to run the dependencies for the app the you will need to be running most of the platform to be running. It is possible to setup your local environment to fully run everything but the better option is to use the containerised versions of the other workloads and then use docker-compose to run them all. 

### All Development Environments

In both codespaces and local you can spin up the other services using their public images using the following commands from the root of the repository. Either in the VS Code terminal or separate. 

```
docker compose up --build
```
From the repository root. This starts the API, SQL Server, Azurite, functions, website, and PWA. Copy `infra/secrets/app.env.example` to `infra/secrets/app.env` first. 

Please note that on first run this can take anything between 2-10 mins depending on connectivity and environment configuration as it's downloading the base images for the containers and then may be doing installs of packages etc. After the first run the time should be significantly reduced.

If any dependency doesn't start simply restart it as it'll more than likely be a timing issue on launch. 

** Code Spaces Specific Setup **

You must make sure that your APP and API ports are publicly visible and if they are not make sure they are. (They need to be public for the Auth mechanisms to work in codespaces)

![image](https://github.com/user-attachments/assets/350499ed-4389-4f0e-bcc5-f7bbe5eb0448)

For More information on how we use "docker" and "docker-compose" in DertInfo please see the wiki [here](https://github.com/dertinfo/dertinfo/wiki/How-we-use-docker-&-docker%E2%80%90compose-in-DertInfo)

**Check your environment**

The app will now be running on port :44300 either on localhost or within the codespace under a special URL (View forwarded Ports).

You may get a warning about accessing the codespace simply continue.

You should gain the homepage of the App. (Please note you may need to adjust the view port to mobile)

Please note that functionality will be limited as there will be no data. Please see: [https://github.com/dertinfo/dertinfo/discussions/20](https://github.com/dertinfo/dertinfo/discussions/20)

### Local Development

Local development should take the setup from codespaces but we will write some more documentation. Issue Raised: [https://github.com/dertinfo/dertinfo/issues/24](https://github.com/dertinfo/dertinfo/issues/24)

## Usage

When users launch the application they will see the homepage of the application which looks like this: 

![Screenshot of the homepage](/docs/images/screenshot-homepage-nouser.png)

Users can login to the application using the icon in the top right which will redirect he user a third party authentication system of [Auth0](https://auth0.com/). The user can login or signup.

Once there is a known user application will then configure itself for appropriately for the user and allow further actions. Please refer to the documentation on GitHub wiki for more usage information. 

## Key Features

These are the key functions of this app: 

#### For Venue Admins
- View the dances that are expected, completed or checked at their venue(s)
- Enter dance scores and take pictures of scoresheets
- Edit dance scores and scoresheets until dance is checked

#### For Teams Admins
- On results published view individual scores and scoresheets for each dance

#### For Team Members
- Login to access scores and scoresheets for their team. 
- Signup to further enter team pin to view scores and scoresheets for their team. 

## Contributing

Please refer to [CONTRIBUTING.md](../../CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) for information on how others can contribute to the project.

## License

This project is licenced under the GNU GPLv3 licence. Please refer to the [LICENCE.md](../../LICENCE.md) file for more information.
