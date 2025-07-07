---
id: ARCH-data-models
title: "Data.Application Data Models"
type: data_model
layer: domain
owner: @team-agritech
version: v1
status: current
created: 2025-07-07
updated: 2025-07-07
tags: [mongoose, schema, mongodb]
depends_on: []
referenced_by: []
---

## Context
This document provides an overview of the primary data models used throughout the AgriTech application. All models are defined using Mongoose schemas and utilize UUIDv4 for `_id` fields to facilitate distributed data generation and offline-first scenarios.

## Structure
All Mongoose models are located in the `src/models/` directory.

### Core Models
- **User.js**: Represents a user of the platform. Key fields include `phoneNumber`, `fullName`, and `role` (`FARMER`, `AGENT`, `ADMIN`). This is the central entity for ownership.
- **Farm.js**: Represents a farm owned by a user. Contains location data, size, and a reference to its crop cycles.

### Feature-Specific Models
- **CropCycle.js**: Tracks a single agricultural cycle (planting to harvest) for a specific `Farm`.
- **SoilTest.js**: Stores the results of a soil analysis, including pH, moisture, and NPK levels. Linked to a `Farm`.
- **AIRecommendation.js**: Stores AI-generated advice based on soil tests or other triggers. Linked to a `Farm`.
- **Notification.js**: Represents a notification sent to a user.
- **BugReport.js**: A user-submitted report about an issue with the application.
- **SupportChat.js**: A conversation thread between a user and a support agent.
- **CropSuggestion.js**: Stores a user's request for a crop suggestion and the resulting recommendations.
- **ProfitEntry.js**: Logs a profit calculation performed by a user.
- **OfflineSyncLog.js**: Records the status and summary of data sync attempts from an offline-capable client.
- **VideoTutorial.js**: Metadata for an educational video tutorial.
- **Sensor.js**: Represents a physical or virtual sensor associated with a `Farm`.

## Behavior
The models are standard Mongoose schemas with timestamps enabled where appropriate. They define data types, validation rules, required fields, and relationships (via `ref`). Controllers interact with these models to perform CRUD operations, ensuring that business logic and ownership rules are enforced.

## Evolution
### Planned
- Introduce more complex validation and virtual properties as business logic evolves.
- Refine indexing strategies for performance as data volume grows.
### Historical
- v1: Initial set of schemas for all primary application features.
