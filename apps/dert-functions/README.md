


# DertInfo - Image Resize V4

This is a small function app that uses image sharp .NET to resize images in a blob storage account. This version of the image resize app uses Azure Functions v4 runtime.

This repository is a direct replacement for the [dertinfo-image-resize](https://github.com/dertinfo/dertinfo-image-resize) function app. 

We have a seperate repository as they will both be running at the same time during the transition. 

This project watches for new images in the following locations in the images storage accounts.

- /groupimages/originals
- /eventimages/originals
- /sheetimages/originals
- /defaultimages/originals

> **Note:** If you are unfamilar with the collection of services that are part of DertInfo please refer to the repository dertinfo/dertinfo.

## Table of Contents

- [Technology](#technology)
- [Topology](#topology)
- [Installation](#installation)
- [Infrastucture](#infrastructure)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Technology

This project is a C# .NET Function App currently running .NET8

It depends on:
- Azure Storage Or Azurite

Tooling 
- Visual Studio Community
- Azurite
- Azure Storage Explorer
- Docker Desktop


## Topology

![Application Containers](/docs/images/architecture-dertinfo-image-resize-containerlevel.png)

## Installation

### Local Development

1) Launch the applciation using the docker-compose file
2) Stop the container running the functions service
3) Launch the service from what tooling you prefer for C# function app development. (Visual Studio Recommended)


### Docker

To run this function in docker then you can:


From the root of the repository:

```
docker compose up --build
```

Copy `infra/secrets/functions.env.example` to `infra/secrets/functions.env` first. The Compose service is `functions`. It runs beside Azurite and the rest of the estate. Azurite data is stored under `infra/data/azurite`. 

# How To Use 

Once you have the solution running:

1) Open Azure Storage Explorer and connect to Azurite local emulator.
2) Create new Blob containers of "groupimages,eventimages,defaultimages,sheetimages"
3) Create a new blob at the path "originals/" (In the emulator calls this a folder)
4) Watch the function app will create 2 new folders at the root of the container "100x100", "480x360"
5) It will resize the orignal image and place it in those folders with the same file name as the original. 

## Infrastucture

Hosted Function App is [`infra/bicep/functions/`](../../infra/bicep/functions/) (Linux Flex Consumption, managed identity). Images Blob Data Contributor and Event Grid live in [`infra/bicep/storage/`](../../infra/bicep/storage/). GitHub Actions: [`functions-infra-cd.yml`](../../.github/workflows/functions-infra-cd.yml), [`storage-infra-cd.yml`](../../.github/workflows/storage-infra-cd.yml), and [`functions-src-cd.yml`](../../.github/workflows/functions-src-cd.yml). Operator sequence: [CI/CD — First development Functions deploy](../../docs/technical/infra/cicd.md#first-development-functions-deploy-operator).

Local / Docker: root [`docker-compose.yml`](../../docker-compose.yml) (Azurite and the `functions` service). Do not deploy the removed `apps/dert-functions/infra/bicep/` templates.

## Running The Project

To get the project running you will need to setup: 
- You user secrets
- Your storage emulator

Once these have been done then simply run the project in Visual Studio. 

**local.settings.json**
You will need to add this file "local.settings.json" to the root of the project as it is ommitted from source control. It should sit just next to host.json

Fill it with the following:

```
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "StorageConnection:Images": "UseDevelopmentStorage=true"
    "AzureWebJobs.ResizeDefaultImages.Disabled": "true",
    "AzureWebJobs.ResizeEventImages.Disabled": "true",
    "AzureWebJobs.ResizeGroupImages.Disabled": "true",
    "AzureWebJobs.ResizeSheetImages.Disabled": "true",
    "AzureWebJobs.ResizeDefaultImagesPolling.Disabled": "false",
    "AzureWebJobs.ResizeEventImagesPolling.Disabled": "false",
    "AzureWebJobs.ResizeGroupImagesPolling.Disabled": "false",
    "AzureWebJobs.ResizeSheetImagesPolling.Disabled": "false"
  }
}
```

This file tells the app where it's state is managed via the storage account "AzureWebJobsStorage" and the storage account where the original images are uploaded to read to be resized "StorageConnection:Images". In development they use the same storage account which can be either a docker asurite or local Azurite running on port 10000, 10001, 10002

Note where we are disabling some functions in development. In the project we have functions that'll trigger by either event grid or by polling the storage account. Event Grid will only work when deployed in Azure with approprate configution so we use polling in local development to ease developemnt.

Note that we have 8 functions. The result in the same excecution however in local development the triggers are fired due to polling the storage account for changes. In staging and production they utilise event grid to notify the app of changes. 

**User Secrets**
```
{
}
```
You do not need to use user secrets for this repository. We use "UseDevelopmentStorage=true" as the connection string to connect to Azurite either running locally or on a docker container on ports :10000, 10001, 10002

### To run the Image Resize Function

#### Running the Function

Open the solution in Visual Studion Community and run the function

#### Emulating the Blob Storage Account

Launch Azure Storage Emulator or Azurite. Connect to the Storage Using Azure Storage Explorer. 

#### From Visual Studio
You can run the Function App locally from Visual Studio in 2 ways. 
- 1) Running from visual studio
- 2) Running in docker using the docker file

## Usage

Add images to the originals folder (/originals path) in the Azure Blob Storage Container and those images will be resized. 

## Features

The image resize function app will watch an Azure Blob Storage Account (or emulator) with the following structure:

![BlobStorageStructure](/docs/images/image-resize-folder-structure.png)

it will take any new images added to the orignals folder and create resized images in the given dimensions. 

## Contributing

Please refer to [CONTRIBUTING.md](../../CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) for information on how others can contribute to the project.

## License

This project is licenced under the GNU GPLv3 licence. Please refer to the [LICENCE.md](../../LICENCE.md) file for more information. 
