# API Contract: Keycloak OAuth Authentication

**Feature**: `001-keycloak-auth` | **Date**: 2025-12-09 | **Version**: 1.0.0

---

## Overview

This document defines the REST API contract for Keycloak OAuth authentication endpoints in OpenAPI 3.0 format. All endpoints follow RESTful conventions and return JSON responses.

**Base URL**: `/api/v1`

**Authentication**: Bearer token (JWT) in `Authorization` header for protected endpoints

---

## Table of Contents

1. [OpenAPI Specification](#openapi-specification)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Data Transfer Objects](#data-transfer-objects)
4. [Error Responses](#error-responses)
5. [Security Schemes](#security-schemes)

---

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: Evaluation Framework - Authentication API
  description: |
    REST API for Keycloak OAuth 2.0 authentication with PKCE support.

    ## Authentication Flow
    1. Client calls `GET /auth/login` to get authorization URL and code verifier
    2. Client redirects user to Keycloak authorization URL
    3. User authenticates in Keycloak
    4. Keycloak redirects back with authorization code
    5. Client calls `POST /auth/callback` with code and verifier to exchange for tokens
    6. Client uses access token for API requests
    7. Client calls `POST /auth/refresh` when access token expires
    8. Client calls `POST /auth/logout` to end session

  version: 1.0.0
  contact:
    name: Evaluation Framework Team
    email: support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:3000/api/v1
    description: Development server
  - url: https://staging.example.com/api/v1
    description: Staging server
  - url: https://api.example.com/api/v1
    description: Production server

tags:
  - name: Authentication
    description: User authentication and session management
  - name: User Profile
    description: User profile information

paths:
  /auth/login:
    get:
      tags:
        - Authentication
      summary: Initiate OAuth login
      description: |
        Returns the Keycloak authorization URL with PKCE code challenge.
        Client should redirect user to this URL to begin authentication.
      operationId: initiateLogin
      responses:
        '200':
          description: Authorization URL successfully generated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthorizationUrlResponse'
              example:
                authorizationUrl: "https://keycloak.example.com/realms/my-realm/protocol/openid-connect/auth?client_id=nest-api&redirect_uri=http://localhost:3000/auth/callback&response_type=code&scope=openid+email+profile&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&state=xyz123"
                codeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
                state: "xyz123"
        '500':
          $ref: '#/components/responses/InternalServerError'

  /auth/callback:
    post:
      tags:
        - Authentication
      summary: OAuth callback endpoint
      description: |
        Exchanges the authorization code from Keycloak for access and refresh tokens.
        Creates or updates user in local database.
        Sets refresh token as HTTP-only cookie.
      operationId: handleCallback
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AuthCallbackRequest'
            example:
              code: "ey1234567890abcdef"
              codeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
              state: "xyz123"
      responses:
        '201':
          description: User authenticated successfully
          headers:
            Set-Cookie:
              description: Refresh token stored as HTTP-only cookie
              schema:
                type: string
                example: "refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=604800"
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
              example:
                accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
                expiresIn: 900
                user:
                  id: "123e4567-e89b-12d3-a456-426614174000"
                  email: "user@example.com"
                  name: "John Doe"
                  roles: ["user"]
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '500':
          $ref: '#/components/responses/InternalServerError'

  /auth/refresh:
    post:
      tags:
        - Authentication
      summary: Refresh access token
      description: |
        Generates new access and refresh token pair using refresh token from cookie.
        Implements token rotation: old refresh token is marked as used.
        Sets new refresh token as HTTP-only cookie.
      operationId: refreshTokens
      parameters:
        - in: cookie
          name: refreshToken
          required: true
          schema:
            type: string
          description: Refresh token from HTTP-only cookie
      responses:
        '201':
          description: Tokens refreshed successfully
          headers:
            Set-Cookie:
              description: New refresh token stored as HTTP-only cookie
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TokenResponse'
              example:
                accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
                expiresIn: 900
        '401':
          description: Invalid or expired refresh token
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                expired:
                  summary: Refresh token expired
                  value:
                    statusCode: 401
                    message: "Refresh token has expired"
                    error: "Unauthorized"
                    timestamp: "2025-12-09T10:00:00.000Z"
                    path: "/auth/refresh"
                theftDetected:
                  summary: Token reuse detected (security breach)
                  value:
                    statusCode: 401
                    message: "Token reuse detected - all sessions revoked"
                    error: "Unauthorized"
                    timestamp: "2025-12-09T10:00:00.000Z"
                    path: "/auth/refresh"
        '500':
          $ref: '#/components/responses/InternalServerError'

  /auth/logout:
    post:
      tags:
        - Authentication
      summary: Logout user
      description: |
        Terminates user session by:
        - Revoking refresh token
        - Clearing refresh token cookie
        - Invalidating access token (client-side)
        - Optionally revoking token at Keycloak
      operationId: logout
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Logout successful
          headers:
            Set-Cookie:
              description: Clear refresh token cookie
              schema:
                type: string
                example: "refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=0"
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Logout successful"
        '401':
          $ref: '#/components/responses/Unauthorized'
        '500':
          $ref: '#/components/responses/InternalServerError'

  /auth/me:
    get:
      tags:
        - User Profile
      summary: Get current user profile
      description: |
        Returns authenticated user's profile information.
        Requires valid access token.
      operationId: getCurrentUser
      security:
        - bearerAuth: []
      responses:
        '200':
          description: User profile retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
              example:
                id: "123e4567-e89b-12d3-a456-426614174000"
                email: "user@example.com"
                name: "John Doe"
                roles: ["user"]
                isActive: true
                createdAt: "2025-01-01T00:00:00.000Z"
                updatedAt: "2025-12-09T10:00:00.000Z"
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          description: User account is deactivated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                statusCode: 403
                message: "User account is deactivated"
                error: "Forbidden"
                timestamp: "2025-12-09T10:00:00.000Z"
                path: "/auth/me"
        '500':
          $ref: '#/components/responses/InternalServerError'

components:
  schemas:
    # ========================================================================
    # REQUEST SCHEMAS
    # ========================================================================

    AuthCallbackRequest:
      type: object
      required:
        - code
        - codeVerifier
      properties:
        code:
          type: string
          description: Authorization code from Keycloak
          minLength: 1
          maxLength: 1000
          example: "ey1234567890abcdef"
        codeVerifier:
          type: string
          description: PKCE code verifier (original random string)
          minLength: 43
          maxLength: 128
          example: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
        state:
          type: string
          description: CSRF protection state parameter
          maxLength: 500
          example: "xyz123"

    # ========================================================================
    # RESPONSE SCHEMAS
    # ========================================================================

    AuthorizationUrlResponse:
      type: object
      required:
        - authorizationUrl
        - codeVerifier
        - state
      properties:
        authorizationUrl:
          type: string
          format: uri
          description: Full Keycloak authorization URL for user redirect
          example: "https://keycloak.example.com/realms/my-realm/protocol/openid-connect/auth?client_id=nest-api&redirect_uri=http://localhost:3000/auth/callback&response_type=code&scope=openid+email+profile&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&state=xyz123"
        codeVerifier:
          type: string
          description: PKCE code verifier to be sent in callback
          example: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
        state:
          type: string
          description: CSRF state parameter to validate callback
          example: "xyz123"

    AuthResponse:
      type: object
      required:
        - accessToken
        - expiresIn
        - user
      properties:
        accessToken:
          type: string
          description: JWT access token for API authentication
          example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        expiresIn:
          type: integer
          description: Access token expiration time in seconds
          example: 900
        user:
          $ref: '#/components/schemas/UserResponse'

    TokenResponse:
      type: object
      required:
        - accessToken
        - expiresIn
      properties:
        accessToken:
          type: string
          description: New JWT access token
          example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
        expiresIn:
          type: integer
          description: Access token expiration time in seconds
          example: 900

    UserResponse:
      type: object
      required:
        - id
        - email
        - name
        - roles
        - isActive
        - createdAt
        - updatedAt
      properties:
        id:
          type: string
          format: uuid
          description: Unique user identifier
          example: "123e4567-e89b-12d3-a456-426614174000"
        email:
          type: string
          format: email
          description: User email address
          example: "user@example.com"
        name:
          type: string
          description: User display name
          minLength: 1
          maxLength: 100
          example: "John Doe"
        roles:
          type: array
          description: User roles for authorization
          items:
            type: string
            enum: [admin, manager, user]
          example: ["user"]
        isActive:
          type: boolean
          description: Account active status
          example: true
        createdAt:
          type: string
          format: date-time
          description: Account creation timestamp
          example: "2025-01-01T00:00:00.000Z"
        updatedAt:
          type: string
          format: date-time
          description: Last update timestamp
          example: "2025-12-09T10:00:00.000Z"

    # ========================================================================
    # ERROR SCHEMAS
    # ========================================================================

    ErrorResponse:
      type: object
      required:
        - statusCode
        - message
        - error
        - timestamp
        - path
      properties:
        statusCode:
          type: integer
          description: HTTP status code
          example: 400
        message:
          type: string
          description: Human-readable error message
          example: "Validation failed"
        error:
          type: string
          description: Error type/category
          example: "Bad Request"
        timestamp:
          type: string
          format: date-time
          description: Error occurrence timestamp
          example: "2025-12-09T10:00:00.000Z"
        path:
          type: string
          description: API endpoint path
          example: "/auth/callback"
        details:
          type: array
          description: Additional error details (validation errors)
          items:
            type: object
            properties:
              field:
                type: string
                example: "code"
              message:
                type: string
                example: "code must be a string"

  # ==========================================================================
  # REUSABLE RESPONSES
  # ==========================================================================

  responses:
    BadRequest:
      description: Invalid request parameters
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            statusCode: 400
            message: "Validation failed"
            error: "Bad Request"
            timestamp: "2025-12-09T10:00:00.000Z"
            path: "/auth/callback"
            details:
              - field: "code"
                message: "code must be a string"
              - field: "codeVerifier"
                message: "codeVerifier must be between 43 and 128 characters"

    Unauthorized:
      description: Authentication failed or token invalid
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          examples:
            noToken:
              summary: No token provided
              value:
                statusCode: 401
                message: "No token provided"
                error: "Unauthorized"
                timestamp: "2025-12-09T10:00:00.000Z"
                path: "/auth/me"
            invalidToken:
              summary: Invalid token
              value:
                statusCode: 401
                message: "Invalid token"
                error: "Unauthorized"
                timestamp: "2025-12-09T10:00:00.000Z"
                path: "/auth/me"
            expiredToken:
              summary: Token expired
              value:
                statusCode: 401
                message: "Token has expired"
                error: "Unauthorized"
                timestamp: "2025-12-09T10:00:00.000Z"
                path: "/auth/me"

    InternalServerError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          examples:
            generic:
              summary: Generic server error
              value:
                statusCode: 500
                message: "Internal server error"
                error: "Internal Server Error"
                timestamp: "2025-12-09T10:00:00.000Z"
                path: "/auth/callback"
            keycloakDown:
              summary: Keycloak unavailable
              value:
                statusCode: 500
                message: "Authentication service is temporarily unavailable. Please try again in a few moments."
                error: "Internal Server Error"
                timestamp: "2025-12-09T10:00:00.000Z"
                path: "/auth/callback"

  # ==========================================================================
  # SECURITY SCHEMES
  # ==========================================================================

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        JWT access token obtained from authentication flow.

        **Header Format**: `Authorization: Bearer <access_token>`

        **Token Structure**:
        - Header: `{"alg": "RS256", "typ": "JWT"}`
        - Payload: `{"sub": "user_id", "email": "user@example.com", "roles": ["user"], "iat": 1234567890, "exp": 1234568790}`
        - Signature: RSA256 signed with application secret

        **Token Lifetime**: 15 minutes

        **Token Claims**:
        - `sub`: User ID (UUID)
        - `email`: User email address
        - `roles`: Array of user roles
        - `iat`: Issued at timestamp
        - `exp`: Expiration timestamp
        - `jti`: JWT ID (for revocation)
```

---

## Authentication Endpoints

### Summary Table

| Endpoint | Method | Auth Required | Description | Response Code |
|----------|--------|---------------|-------------|---------------|
| `/auth/login` | GET | No | Initiate OAuth login | 200 |
| `/auth/callback` | POST | No | Exchange code for tokens | 201 |
| `/auth/refresh` | POST | Cookie | Refresh access token | 201 |
| `/auth/logout` | POST | Yes | Logout user | 200 |
| `/auth/me` | GET | Yes | Get user profile | 200 |

---

## Data Transfer Objects

### Request DTOs (NestJS Implementation)

```typescript
// src/auth/presentation/dto/requests/auth-callback.dto.ts

import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthCallbackDto {
  @ApiProperty({
    description: 'Authorization code from Keycloak',
    example: 'ey1234567890abcdef',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  code: string;

  @ApiProperty({
    description: 'PKCE code verifier',
    example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    minLength: 43,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(43)
  @MaxLength(128)
  codeVerifier: string;

  @ApiProperty({
    description: 'CSRF state parameter',
    example: 'xyz123',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  state?: string;
}
```

### Response DTOs (NestJS Implementation)

```typescript
// src/auth/presentation/dto/responses/auth-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: ['user'], enum: ['admin', 'manager', 'user'] })
  roles: string[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-12-09T10:00:00.000Z' })
  updatedAt: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 900, description: 'Token expiration in seconds' })
  expiresIn: number;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;
}

export class AuthorizationUrlResponseDto {
  @ApiProperty({ example: 'https://keycloak.example.com/realms/...' })
  authorizationUrl: string;

  @ApiProperty({ example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk' })
  codeVerifier: string;

  @ApiProperty({ example: 'xyz123' })
  state: string;
}
```

---

## Error Responses

### Error Format

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-12-09T10:00:00.000Z",
  "path": "/auth/callback",
  "details": [
    {
      "field": "code",
      "message": "code must be a string"
    }
  ]
}
```

### HTTP Status Codes

| Status Code | Error Type | Description | Example Scenarios |
|-------------|------------|-------------|-------------------|
| 400 | Bad Request | Invalid request parameters | Missing required field, invalid format |
| 401 | Unauthorized | Authentication failed | Invalid token, expired token, no token |
| 403 | Forbidden | Insufficient permissions | User deactivated, role not allowed |
| 404 | Not Found | Resource not found | User doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded | Too many login attempts |
| 500 | Internal Server Error | Server error | Database connection failed, Keycloak down |
| 503 | Service Unavailable | Service temporarily down | Keycloak maintenance |

### Error Scenarios

**400 Bad Request**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-12-09T10:00:00.000Z",
  "path": "/auth/callback",
  "details": [
    {
      "field": "code",
      "message": "code must be a string"
    },
    {
      "field": "codeVerifier",
      "message": "codeVerifier must be between 43 and 128 characters"
    }
  ]
}
```

**401 Unauthorized - No Token**:
```json
{
  "statusCode": 401,
  "message": "No token provided",
  "error": "Unauthorized",
  "timestamp": "2025-12-09T10:00:00.000Z",
  "path": "/auth/me"
}
```

**401 Unauthorized - Invalid Token**:
```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized",
  "timestamp": "2025-12-09T10:00:00.000Z",
  "path": "/auth/me"
}
```

**401 Unauthorized - Expired Token**:
```json
{
  "statusCode": 401,
  "message": "Token has expired",
  "error": "Unauthorized",
  "timestamp": "2025-12-09T10:00:00.000Z",
  "path": "/auth/me"
}
```

**401 Unauthorized - Token Theft Detected**:
```json
{
  "statusCode": 401,
  "message": "Token reuse detected - all sessions revoked",
  "error": "Unauthorized",
  "timestamp": "2025-12-09T10:00:00.000Z",
  "path": "/auth/refresh"
}
```

**403 Forbidden - User Deactivated**:
```json
{
  "statusCode": 403,
  "message": "User account is deactivated",
  "error": "Forbidden",
  "timestamp": "2025-12-09T10:00:00.000Z",
  "path": "/auth/me"
}
```

**500 Internal Server Error - Keycloak Down**:
```json
{
  "statusCode": 500,
  "message": "Authentication service is temporarily unavailable. Please try again in a few moments.",
  "error": "Internal Server Error",
  "timestamp": "2025-12-09T10:00:00.000Z",
  "path": "/auth/callback"
}
```

---

## Security Schemes

### Bearer Token Authentication

**Header Format**:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Structure** (JWT):

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "roles": ["user"],
    "iat": 1702123456,
    "exp": 1702124356,
    "jti": "unique-token-id"
  },
  "signature": "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}
```

**Token Claims**:
- `sub`: User ID (UUID v4)
- `email`: User email address
- `roles`: Array of user roles (`admin`, `manager`, `user`)
- `iat`: Issued at timestamp (Unix epoch)
- `exp`: Expiration timestamp (Unix epoch)
- `jti`: JWT ID for revocation tracking

**Token Lifetime**: 15 minutes (900 seconds)

**Token Validation**:
1. Verify signature with RSA256 public key
2. Check expiration (`exp` claim)
3. Validate issuer (`iss` claim)
4. Validate audience (`aud` claim)
5. Check if token is revoked (via `jti`)

---

### Refresh Token (HTTP-Only Cookie)

**Cookie Format**:
```
Set-Cookie: refreshToken=<token_value>; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=604800
```

**Cookie Attributes**:
- `HttpOnly`: Prevents JavaScript access (XSS protection)
- `Secure`: Only transmitted over HTTPS (production)
- `SameSite=Strict`: CSRF protection
- `Path=/auth/refresh`: Limited scope (only for refresh endpoint)
- `Max-Age=604800`: 7 days (604800 seconds)

**Token Storage**:
- Client-side: Stored in browser cookie (HTTP-only)
- Server-side: Hashed with bcrypt and stored in database

**Token Rotation**:
- Each refresh generates a new token pair
- Old refresh token is marked as `used=true`
- Reuse of old token triggers security response (all sessions revoked)

---

## CORS Configuration

**Allowed Origins** (configurable):
```typescript
{
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,  // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
```

---

## Rate Limiting

**Authentication Endpoints**:
- `/auth/callback`: 5 requests per minute per IP
- `/auth/refresh`: 10 requests per minute per user
- `/auth/login`: 20 requests per minute per IP
- `/auth/logout`: 10 requests per minute per user

**Exceeded Rate Limit Response**:
```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again in 60 seconds.",
  "error": "Too Many Requests",
  "timestamp": "2025-12-09T10:00:00.000Z",
  "path": "/auth/callback"
}
```

---

## Testing with curl

### 1. Initiate Login
```bash
curl -X GET http://localhost:3000/api/v1/auth/login
```

### 2. Exchange Code for Tokens
```bash
curl -X POST http://localhost:3000/api/v1/auth/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization_code_from_keycloak",
    "codeVerifier": "your_code_verifier"
  }' \
  -c cookies.txt  # Save cookies
```

### 3. Access Protected Endpoint
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -b cookies.txt \  # Load cookies
  -c cookies.txt    # Save new cookies
```

### 5. Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt
```

---

## Summary

This API contract provides:

1. **Clear Interface**: OpenAPI 3.0 specification with complete documentation
2. **Type Safety**: DTO validation with class-validator decorators
3. **Security**: JWT authentication, HTTP-only cookies, CSRF protection
4. **Error Handling**: Consistent error format with detailed messages
5. **Testing Support**: Example requests with curl commands

**Implementation Notes**:
- Controllers must implement these endpoints exactly as specified
- DTOs must use class-validator for input validation
- Guards must enforce authentication requirements
- Exception filters must format errors consistently

**Next Steps**: Implement controllers using the use cases defined in `design.clean-architecture.md` and data models from `data-model.md`.
