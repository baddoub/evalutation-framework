# Data Model: Keycloak OAuth Authentication

**Feature**: `001-keycloak-auth` | **Date**: 2025-12-09 | **Status**: Design Phase

---

## Overview

This document defines the data model for Keycloak OAuth authentication, including domain entities, value objects, database schema (Prisma), relationships, validation rules, and state transitions. The model supports user authentication, session management, and refresh token rotation with soft delete capabilities.

---

## Table of Contents

1. [Domain Entities](#domain-entities)
2. [Value Objects](#value-objects)
3. [Database Schema (Prisma)](#database-schema-prisma)
4. [Entity Relationships](#entity-relationships)
5. [Validation Rules](#validation-rules)
6. [State Transitions](#state-transitions)
7. [Database Migration Strategy](#database-migration-strategy)

---

## Domain Entities

### 1. User (Aggregate Root)

**Purpose**: Represents an authenticated user in the system. Central entity for authentication and authorization.

**Properties**:
```typescript
class User {
  private readonly _id: UserId;              // Unique identifier (UUID)
  private readonly _email: Email;            // User email (value object)
  private _name: string;                     // Display name
  private readonly _keycloakId: string;      // Keycloak user ID (external reference)
  private _roles: Role[];                    // User roles (value objects)
  private _isActive: boolean;                // Account active status
  private readonly _createdAt: Date;         // Account creation timestamp
  private _updatedAt: Date;                  // Last update timestamp
}
```

**Business Methods**:
- `updateProfile(name: string): void` - Update user name
- `assignRole(role: Role): void` - Add role to user
- `removeRole(role: Role): void` - Remove role from user
- `activate(): void` - Activate user account
- `deactivate(): void` - Deactivate user account (soft delete alternative)
- `hasRole(role: Role): boolean` - Check if user has specific role
- `hasAnyRole(roles: Role[]): boolean` - Check if user has any of given roles
- `synchronizeFromKeycloak(data: KeycloakUserData): void` - Update user from Keycloak data

**Invariants**:
- Name cannot be empty
- Email must be valid format
- Keycloak ID is immutable after creation
- At least one role must be assigned
- User ID is immutable

---

### 2. Session

**Purpose**: Tracks active user sessions for security monitoring and concurrent session management.

**Properties**:
```typescript
class Session {
  private readonly _id: string;              // Unique identifier (UUID)
  private readonly _userId: UserId;          // User reference
  private _deviceId: string | null;          // Device identifier
  private _userAgent: string | null;         // Browser/client user agent
  private _ipAddress: string | null;         // Client IP address
  private _expiresAt: Date;                  // Session expiration time
  private readonly _createdAt: Date;         // Session creation time
  private _lastUsed: Date;                   // Last activity timestamp
}
```

**Business Methods**:
- `isExpired(): boolean` - Check if session has expired
- `updateLastUsed(): void` - Update last activity timestamp
- `isFromSameDevice(deviceId: string): boolean` - Verify device

**Invariants**:
- Expiration time must be in the future (on creation)
- User ID is immutable
- Session ID is immutable

---

### 3. RefreshToken

**Purpose**: Manages refresh tokens with rotation support for enhanced security.

**Properties**:
```typescript
class RefreshToken {
  private readonly _id: string;              // Unique identifier (UUID)
  private readonly _userId: UserId;          // User reference
  private readonly _tokenHash: string;       // Hashed token value (bcrypt)
  private _used: boolean;                    // Token used flag (rotation detection)
  private readonly _expiresAt: Date;         // Token expiration time
  private readonly _createdAt: Date;         // Token creation time
  private _revokedAt: Date | null;           // Token revocation time
}
```

**Business Methods**:
- `markAsUsed(): void` - Mark token as used (rotation)
- `revoke(): void` - Revoke token (theft detection)
- `isExpired(): boolean` - Check if token has expired
- `isValid(): boolean` - Check if token is valid (not used, not revoked, not expired)

**Invariants**:
- Token hash is immutable after creation
- Once used, cannot be marked as unused
- Once revoked, cannot be unrevoked
- User ID is immutable

---

## Value Objects

### 1. Email

**Purpose**: Ensure email addresses are always valid and normalized.

```typescript
class Email {
  private readonly _value: string;

  static create(email: string): Email {
    if (!Email.isValid(email)) {
      throw new InvalidEmailException(`Invalid email format: ${email}`);
    }
    return new Email(email.toLowerCase().trim());
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  get value(): string { return this._value; }
  equals(other: Email): boolean { return this._value === other._value; }
}
```

**Validation Rules**:
- Must match standard email regex pattern
- Automatically converted to lowercase
- Trimmed of whitespace

---

### 2. UserId

**Purpose**: Type-safe user identifier with UUID format.

```typescript
class UserId {
  private readonly _value: string;

  static generate(): UserId {
    return new UserId(crypto.randomUUID());
  }

  static fromString(id: string): UserId {
    if (!UserId.isValid(id)) {
      throw new InvalidUserIdException(`Invalid UUID format: ${id}`);
    }
    return new UserId(id);
  }

  private static isValid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  get value(): string { return this._value; }
  equals(other: UserId): boolean { return this._value === other._value; }
}
```

**Validation Rules**:
- Must be valid UUID v4 format
- Immutable after creation

---

### 3. Role

**Purpose**: Type-safe role enumeration with validation.

```typescript
class Role {
  private static readonly VALID_ROLES = ['admin', 'manager', 'user'] as const;
  private readonly _value: string;

  static create(role: string): Role {
    if (!Role.isValid(role)) {
      throw new InvalidRoleException(`Invalid role: ${role}. Valid roles: ${Role.VALID_ROLES.join(', ')}`);
    }
    return new Role(role.toLowerCase());
  }

  static admin(): Role { return new Role('admin'); }
  static manager(): Role { return new Role('manager'); }
  static user(): Role { return new Role('user'); }

  private static isValid(role: string): boolean {
    return Role.VALID_ROLES.includes(role.toLowerCase() as any);
  }

  get value(): string { return this._value; }
  equals(other: Role): boolean { return this._value === other._value; }
  isAdmin(): boolean { return this._value === 'admin'; }
}
```

**Validation Rules**:
- Only predefined roles allowed: `admin`, `manager`, `user`
- Case-insensitive matching
- Immutable after creation

---

## Database Schema (Prisma)

### Prisma Schema Definition

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USER ENTITY
// ============================================================================

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String
  keycloakId String   @unique @map("keycloak_id")
  roles      String[] @default(["user"])
  isActive   Boolean  @default(true) @map("is_active")

  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")
  deletedAt  DateTime? @map("deleted_at")

  // Relations
  refreshTokens RefreshToken[]
  sessions      Session[]

  @@map("users")
  @@index([email])
  @@index([keycloakId])
  @@index([deletedAt])
}

// ============================================================================
// REFRESH TOKEN ENTITY
// ============================================================================

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  tokenHash String   @unique @map("token_hash")  // bcrypt hashed token
  used      Boolean  @default(false)
  expiresAt DateTime @map("expires_at")

  createdAt DateTime  @default(now()) @map("created_at")
  revokedAt DateTime? @map("revoked_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
  @@index([userId])
  @@index([expiresAt])
  @@index([tokenHash])
}

// ============================================================================
// SESSION ENTITY
// ============================================================================

model Session {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  deviceId  String?  @map("device_id")
  userAgent String?  @map("user_agent") @db.Text
  ipAddress String?  @map("ip_address")
  expiresAt DateTime @map("expires_at")

  createdAt DateTime @default(now()) @map("created_at")
  lastUsed  DateTime @default(now()) @map("last_used")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
  @@index([userId])
  @@index([expiresAt])
  @@index([deviceId])
}
```

### Schema Design Decisions

1. **Snake Case Mapping**: Database columns use `snake_case` (PostgreSQL convention), mapped via `@map()` to TypeScript `camelCase`

2. **Soft Delete**: `deletedAt` timestamp enables soft delete (users marked as deleted but data retained)

3. **Cascade Delete**: When user is deleted, all related refresh tokens and sessions are automatically removed

4. **Indexes**: Strategic indexes on frequently queried fields:
   - `email`, `keycloakId` for user lookups
   - `userId` for relationship queries
   - `expiresAt` for cleanup jobs
   - `tokenHash` for token validation
   - `deletedAt` for filtering soft-deleted records

5. **Default Values**:
   - `roles`: Default to `["user"]` for new users
   - `isActive`: Default to `true`
   - `used`: Default to `false` for refresh tokens
   - Timestamps: Auto-managed by Prisma

---

## Entity Relationships

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                          USER                                │
│  - id: UUID (PK)                                             │
│  - email: string (unique)                                    │
│  - name: string                                              │
│  - keycloakId: string (unique)                               │
│  - roles: string[]                                           │
│  - isActive: boolean                                         │
│  - createdAt, updatedAt, deletedAt                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ 1:N (one user, many tokens)
                        │
        ┌───────────────┴──────────────┐
        │                              │
        ↓                              ↓
┌──────────────────────┐      ┌──────────────────────┐
│   REFRESH_TOKEN      │      │      SESSION         │
│  - id: UUID (PK)     │      │  - id: UUID (PK)     │
│  - userId: UUID (FK) │      │  - userId: UUID (FK) │
│  - tokenHash: string │      │  - deviceId: string  │
│  - used: boolean     │      │  - userAgent: string │
│  - expiresAt: date   │      │  - ipAddress: string │
│  - createdAt: date   │      │  - expiresAt: date   │
│  - revokedAt: date   │      │  - createdAt: date   │
│                      │      │  - lastUsed: date    │
└──────────────────────┘      └──────────────────────┘
```

### Relationship Rules

1. **User → RefreshToken (1:N)**
   - One user can have multiple refresh tokens (one per session/device)
   - Maximum 5 active refresh tokens per user (enforced in application layer)
   - Cascade delete: Deleting user removes all refresh tokens

2. **User → Session (1:N)**
   - One user can have multiple active sessions (multi-device support)
   - Maximum 10 concurrent sessions per user (enforced in application layer)
   - Cascade delete: Deleting user removes all sessions

3. **No direct relationship between RefreshToken and Session**
   - Independent tracking for different purposes
   - Refresh tokens for token rotation
   - Sessions for security monitoring

---

## Validation Rules

### User Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `id` | Must be valid UUID v4 | "Invalid user ID format" |
| `email` | Must match email regex | "Invalid email format: {email}" |
| `email` | Must be unique | "Email already exists: {email}" |
| `name` | Cannot be empty or whitespace | "User name cannot be empty" |
| `name` | Max length: 100 characters | "Name too long (max 100 chars)" |
| `keycloakId` | Cannot be empty | "Keycloak ID is required" |
| `keycloakId` | Must be unique | "Keycloak ID already registered" |
| `roles` | Must contain at least one role | "User must have at least one role" |
| `roles` | Only valid role values | "Invalid role: {role}" |

### RefreshToken Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `id` | Must be valid UUID v4 | "Invalid refresh token ID" |
| `userId` | Must reference existing user | "User not found: {userId}" |
| `tokenHash` | Must be bcrypt hash | "Invalid token hash format" |
| `tokenHash` | Must be unique | "Token hash collision detected" |
| `expiresAt` | Must be in future (creation) | "Expiration must be in future" |
| `expiresAt` | Max 7 days from creation | "Token expiration too long" |

### Session Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `id` | Must be valid UUID v4 | "Invalid session ID" |
| `userId` | Must reference existing user | "User not found: {userId}" |
| `expiresAt` | Must be in future (creation) | "Session expiration in past" |
| `ipAddress` | Valid IP format (if provided) | "Invalid IP address format" |
| `userAgent` | Max length: 500 characters | "User agent string too long" |

### Application-Level Validation

```typescript
// User constraints
const MAX_SESSIONS_PER_USER = 10;
const MAX_REFRESH_TOKENS_PER_USER = 5;

// Token constraints
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000;  // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;  // 7 days

// Validation functions
function validateMaxSessions(userId: UserId, count: number): void {
  if (count >= MAX_SESSIONS_PER_USER) {
    throw new TooManySessionsException(
      `Maximum ${MAX_SESSIONS_PER_USER} sessions allowed per user`
    );
  }
}

function validateMaxRefreshTokens(userId: UserId, count: number): void {
  if (count >= MAX_REFRESH_TOKENS_PER_USER) {
    throw new TooManyTokensException(
      `Maximum ${MAX_REFRESH_TOKENS_PER_USER} refresh tokens allowed per user`
    );
  }
}
```

---

## State Transitions

### User Lifecycle

```
┌──────────┐
│  NEW     │  (User.create())
└────┬─────┘
     │
     ↓
┌──────────┐
│  ACTIVE  │  (isActive = true)
└────┬─────┘
     │
     ├─────→ synchronizeFromKeycloak() → ACTIVE (updated)
     │
     ├─────→ deactivate() → DEACTIVATED
     │
     └─────→ delete() → SOFT_DELETED (deletedAt set)

┌──────────────┐
│ DEACTIVATED  │  (isActive = false)
└──────┬───────┘
       │
       └─────→ activate() → ACTIVE
```

**States**:
- **NEW**: User created, not yet persisted
- **ACTIVE**: User can authenticate and access system
- **DEACTIVATED**: User exists but cannot authenticate (isActive = false)
- **SOFT_DELETED**: User marked as deleted (deletedAt set), excluded from queries

---

### Authentication Flow State Transitions

```
┌─────────────┐
│ UNAUTHENTI- │
│   CATED     │
└──────┬──────┘
       │
       │ 1. GET /auth/login (get authorization URL)
       ↓
┌─────────────┐
│  REDIRECT   │
│ TO KEYCLOAK │
└──────┬──────┘
       │
       │ 2. User enters credentials in Keycloak
       ↓
┌─────────────┐
│  AUTHZ CODE │
│  RECEIVED   │
└──────┬──────┘
       │
       │ 3. POST /auth/callback (exchange code for tokens)
       ↓
┌─────────────┐
│ TOKENS      │
│ GENERATED   │
└──────┬──────┘
       │
       │ 4. Access token + Refresh token (cookie)
       ↓
┌─────────────┐
│ AUTHENTI-   │
│ CATED       │  ←──────┐
└──────┬──────┘         │
       │                │
       │ Access token expires (15 min)
       ↓                │
┌─────────────┐         │
│ TOKEN       │         │
│ EXPIRED     │         │
└──────┬──────┘         │
       │                │
       │ POST /auth/refresh (use refresh token)
       └────────────────┘ (New access token, token rotation)

       OR

       ↓
┌─────────────┐
│ POST        │
│ /auth/logout│
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ TOKENS      │
│ REVOKED     │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ UNAUTHENTI- │
│   CATED     │
└─────────────┘
```

---

### Refresh Token Rotation Flow

```
┌──────────────────┐
│ NEW REFRESH      │
│ TOKEN CREATED    │  (used = false, revokedAt = null)
└────────┬─────────┘
         │
         │ Used once for token refresh
         ↓
┌──────────────────┐
│ TOKEN USED       │  (used = true)
└────────┬─────────┘
         │
         │ New token pair generated
         ↓
┌──────────────────┐
│ NEW TOKEN        │  (rotation complete)
│ REPLACES OLD     │
└──────────────────┘

   OR (if token reused)

┌──────────────────┐
│ TOKEN USED       │  (used = true)
└────────┬─────────┘
         │
         │ Same token used again (THEFT DETECTED)
         ↓
┌──────────────────┐
│ ALL USER TOKENS  │
│ REVOKED          │  (revokedAt = now())
└──────────────────┘
```

**Token States**:
- **ACTIVE**: `used = false`, `revokedAt = null`, `expiresAt > now()`
- **USED**: `used = true` (single use, rotation)
- **REVOKED**: `revokedAt != null` (theft detected)
- **EXPIRED**: `expiresAt <= now()`

---

## Database Migration Strategy

### Migration Plan

**Phase 1: Initial Schema Creation**
```bash
# Create initial migration
npx prisma migrate dev --name init_auth_schema

# Generated migration creates:
# - users table
# - refresh_tokens table
# - sessions table
# - All indexes and foreign keys
```

**Phase 2: Seed Data (Development)**
```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user for testing
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      keycloakId: 'keycloak-admin-id',
      roles: ['admin'],
      isActive: true,
    },
  });

  // Create regular user for testing
  await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'Test User',
      keycloakId: 'keycloak-user-id',
      roles: ['user'],
      isActive: true,
    },
  });

  console.log('Seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Phase 3: Cleanup Jobs (Production)**

Scheduled tasks for data maintenance:

```typescript
// Clean up expired refresh tokens (daily)
await prisma.refreshToken.deleteMany({
  where: {
    OR: [
      { expiresAt: { lt: new Date() } },
      { revokedAt: { not: null } },
    ],
  },
});

// Clean up expired sessions (hourly)
await prisma.session.deleteMany({
  where: {
    expiresAt: { lt: new Date() },
  },
});

// Permanently delete soft-deleted users after 90 days (weekly)
await prisma.user.deleteMany({
  where: {
    deletedAt: {
      lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    },
  },
});
```

### Migration Commands

```bash
# Development
npx prisma migrate dev          # Create and apply migration
npx prisma generate             # Generate Prisma client
npx prisma db seed              # Run seed script

# Production
npx prisma migrate deploy       # Apply pending migrations
npx prisma generate             # Generate client

# Rollback (if needed)
npx prisma migrate resolve --rolled-back <migration_name>
```

### Database Performance Optimization

1. **Connection Pooling**:
   ```typescript
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     connection_limit = 20
   }
   ```

2. **Query Optimization**:
   - Use `findUnique` instead of `findFirst` when possible
   - Include only needed fields with `select`
   - Use pagination for large result sets

3. **Index Strategy**:
   - Composite indexes for common query patterns
   - Partial indexes for soft-delete filtering (future enhancement)

---

## Summary

This data model provides:

1. **Clean Architecture Alignment**: Clear separation between domain entities (User, Session, RefreshToken) and infrastructure concerns (Prisma schema)

2. **Type Safety**: Value objects (Email, UserId, Role) enforce validation at domain level

3. **Security**: Token hashing, rotation support, soft delete, cascade deletion

4. **Scalability**: Indexed queries, connection pooling, cleanup jobs

5. **Maintainability**: Clear relationships, validation rules, state transitions documented

**Next Steps**: Implement repository pattern to map between domain entities and Prisma models (see `design.clean-architecture.md` for implementation details).
