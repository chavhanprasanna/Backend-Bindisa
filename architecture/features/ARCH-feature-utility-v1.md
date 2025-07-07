---
id: ARCH-feature-utility
title: "Feature.Utility Services"
type: feature
layer: application
owner: @team-agritech
version: v1
status: current
created: 2025-07-07
updated: 2025-07-07
tags: [utility, profit, sync]
depends_on: [ARCH-core-auth, ARCH-data-models]
referenced_by: []
---

## Context
This component provides various utility services that support client-side applications and data logging.

## Structure
- **Profit Calculator**: `profitEntryController.js`, `profitEntryRoutes.js`.
- **Offline Sync**: `offlineSyncController.js`, `offlineSyncRoutes.js`.

## Behavior
- **Profit Calculator**: Authenticated users can log entries from a profit calculation tool, storing the inputs and the calculated result.
- **Offline Sync**: Authenticated users (or their client applications) can post logs about the status of data synchronization attempts, which is useful for tracking data consistency in offline-first mobile apps.

## Evolution
### Historical
- v1: Initial implementation of profit logging and offline sync logging.
