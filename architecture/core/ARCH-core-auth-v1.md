---
id: ARCH-core-auth
title: "Core.Authentication Service"
type: component
layer: application
owner: @team-agritech
version: v1
status: current
created: 2025-07-07
updated: 2025-07-07
tags: [auth, jwt, otp]
depends_on: [ARCH-data-models]
referenced_by: []
---

## Context
This component is responsible for authenticating users and securing API endpoints. It uses a phone number and a One-Time Password (OTP) for initial verification, followed by JSON Web Tokens (JWT) for session management.

## Structure
The authentication logic is primarily contained in the following files:
- `src/controllers/auth.controller.js`: Handles the logic for OTP requests and verification, user registration, and token generation.
- `src/routes/auth.routes.js`: Defines the API endpoints for authentication (`/request-otp`, `/verify-otp`, `/register`).
- `src/middlewares/auth.js`: Provides the `auth()` middleware function used to protect routes. It validates JWTs and can enforce role-based access.
- `src/utils/otp.js`: Contains a mock implementation for sending and verifying OTPs. In a production environment, this would be replaced with a real SMS service like Twilio.
- `src/utils/ensureSecrets.js`: A utility script that ensures JWT secrets are present in the environment, generating them if they are missing.

## Behavior
The authentication flow is as follows:
1.  **OTP Request**: A client POSTs a `{ phoneNumber }` to `/auth/request-otp`. The server generates a mock OTP and returns it in the response for demonstration purposes.
2.  **OTP Verification**: The client POSTs the `{ phoneNumber, otp }` to `/auth/verify-otp`.
3.  **Token Issuance**: If the OTP is valid, the server checks if a user with that phone number exists. If not, a new user record is created. JWT access and refresh tokens are generated and returned to the client.
4.  **Registration Completion**: A newly verified user can complete their profile by sending details to the protected `/auth/register` route.
5.  **Route Protection**: Other API routes are protected by applying the `auth()` middleware. This middleware checks for a valid `Bearer` token in the `Authorization` header. It also supports role-based authorization (e.g., `auth('ADMIN')`).

## Evolution
### Planned
- Replace the mock OTP system in `src/utils/otp.js` with a production-grade service like Twilio Verify.
### Historical
- v1: Initial implementation with mock OTP and JWT-based authentication.
