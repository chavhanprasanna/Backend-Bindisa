---
id: ARCH-infra-docker
title: "Infrastructure.Docker Support"
type: component
layer: infrastructure
owner: @team-agritech
version: v1
status: current
created: 2025-07-07
updated: 2025-07-07
tags: [docker, container, devops]
depends_on: []
referenced_by: []
---

## Context
This component provides containerization for the API service for consistent local development and future deployment.

## Structure
- `Dockerfile`: Defines the steps to build a production-ready Node.js image for the application. It uses a multi-stage approach to install dependencies and copy source code.
- `docker-compose.yml`: Orchestrates a multi-container local development environment. It defines three services: `api`, `mongo`, and `redis`.

## Behavior
- The `Dockerfile` is optimized to leverage build caching by copying `package.json` and running `npm install` before copying the rest of the source code.
- The `docker-compose.yml` file allows a developer to start the entire application stack (API, database, cache) with a single command: `docker-compose up`. It uses a volume mount for the `api` service to enable live code reloading during development.

## Evolution
### Historical
- v1: Initial Docker and Docker Compose setup for a complete development environment.
