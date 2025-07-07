---
id: ARCH-feature-farm-core
title: "Feature.Core Farm Management"
type: feature
layer: application
owner: @team-agritech
version: v1
status: current
created: 2025-07-07
updated: 2025-07-07
tags: [farm, crop, crud]
depends_on: [ARCH-core-auth, ARCH-data-models]
referenced_by: []
---

## Context
This feature provides the fundamental capabilities for users to manage their farm entities and track the crop cycles within them. It forms the foundation upon which other farm-related features are built.

## Structure
- **Farm Management**: `farm.controller.js` and `farm.routes.js`.
- **Crop Cycle Management**: `cropCycleController.js` and `cropCycleRoutes.js`.

## Behavior
- **Farms**: Provides authenticated RESTful endpoints for full CRUD (Create, Read, Update, Delete) operations on `Farm` documents. All operations are scoped to the authenticated user (`req.user.sub`).
- **Crop Cycles**: Provides authenticated RESTful endpoints for full CRUD operations on `CropCycle` documents. These operations are nested under a farm, ensuring that a crop cycle is always associated with a user-owned farm. For example, creating a cycle requires a `farmId`, and the controller verifies the user's ownership of that farm before proceeding.

## Evolution
### Historical
- v1: Initial implementation of Farm and Crop Cycle CRUD operations.
