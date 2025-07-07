---
id: ARCH-feature-farm-analysis
title: "Feature.Farm Analysis Services"
type: feature
layer: application
owner: @team-agritech
version: v1
status: current
created: 2025-07-07
updated: 2025-07-07
tags: [soil, ai, recommendation, suggestion]
depends_on: [ARCH-core-auth, ARCH-data-models]
referenced_by: []
---

## Context
This component group provides analytical services to farmers, including soil test analysis and crop suggestions. The goal is to provide data-driven insights to improve farm productivity.

## Structure
- **Soil Testing**: `soilTestController.js` and `soilTestRoutes.js`.
- **Crop Suggestions**: `cropSuggestionController.js` and `cropSuggestionRoutes.js`.

## Behavior
### Soil Testing & Recommendations
- Users can submit soil test data (pH, NPK, etc.) for a specific farm they own via `POST /api/v1/tests/:farmId`.
- The `soilTestController` saves the test results and triggers a private function, `_analyzeAndGenerateRecommendations`, which contains a simple rule-based engine (e.g., if pH < 6.0, recommend lime).
- This engine creates `AIRecommendation` documents, which can be retrieved via `GET /api/v1/tests/recommendations/:farmId`.

### Crop Suggestions
- Users can request crop suggestions by POSTing environmental data (region, soil type, season) to `/ai/crop-suggestions`.
- The `cropSuggestionController` uses a placeholder function `generateSuggestions` to return a hardcoded list of suitable crops based on simple rules. This is intended as a placeholder for a future machine learning model.

## Evolution
### Planned
- Replace the rule-based engines in both `soilTestController` and `cropSuggestionController` with a genuine machine learning model service.
### Historical
- v1: Initial implementation with rule-based mock-AI for recommendations and suggestions.
