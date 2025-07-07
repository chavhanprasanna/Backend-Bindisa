---
id: ARCH-feature-user-support
title: "Feature.User Support & Engagement"
type: feature
layer: application
owner: @team-agritech
version: v1
status: current
created: 2025-07-07
updated: 2025-07-07
tags: [support, chat, notification, tutorial]
depends_on: [ARCH-core-auth, ARCH-data-models]
referenced_by: []
---

## Context
This component group provides various services for user support, communication, and engagement, such as bug reporting, live chat, notifications, and educational content.

## Structure
- **Bug Reports**: `bugReportController.js`, `bugReportRoutes.js`.
- **Support Chat**: `supportChatController.js`, `supportChatRoutes.js`.
- **Notifications**: `notificationController.js`, `notificationRoutes.js`.
- **Video Tutorials**: `videoTutorialController.js`, `videoTutorialRoutes.js`.

## Behavior
- **Bug Reporting**: Allows authenticated users to submit and list their bug reports.
- **Support Chat**: Allows users to create support conversations and exchange messages.
- **Notifications**: Allows users to list their notifications and mark them as read.
- **Video Tutorials**: Allows all authenticated users to list tutorials, while only users with the `ADMIN` role can create new ones.

## Evolution
### Historical
- v1: Initial implementation of all support and engagement features.
