---
id: ARCH-infra-server
title: "Infrastructure.API Server"
type: component
layer: infrastructure
owner: @team-agritech
version: v1
status: current
created: 2025-07-07
updated: 2025-07-07
tags: [express, server, routing]
depends_on: []
referenced_by: []
---

## Context
This component represents the core Express.js application, responsible for starting the server, connecting to the database, and managing middleware and routing.

## Structure
- `src/server.js`: The main entry point of the application. It handles loading environment variables, ensuring JWT secrets exist, connecting to MongoDB via Mongoose, and starting the Express server on the configured port.
- `src/app.js`: Configures the Express application instance. It sets up global middleware like `cors`, `express.json`, and `morgan` for logging. It then mounts all the application's route modules under their respective URL prefixes (e.g., `/auth`, `/farms`).
- `src/middlewares/errorHandler.js`: A global error-handling middleware that catches errors passed via `next(err)` and sends a standardized JSON error response.

## Behavior
On startup, `server.js` initializes the database connection. Once successful, it starts the `app` instance, which listens for incoming HTTP requests. Requests are routed through the configured middleware and route handlers. Any unhandled routes result in a 404 response, and any errors thrown during request processing are caught and formatted by the `errorHandler`.

## Evolution
### Historical
- v1: Initial setup of the Express server, database connection, and routing structure.
