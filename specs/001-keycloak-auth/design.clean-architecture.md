# Clean Architecture Design: Keycloak OAuth Authentication

**Feature**: Keycloak OAuth Authentication
**Version**: 1.0.0
**Date**: 2025-12-09
**Status**: Design Phase
**Architecture**: Clean Architecture with SOLID Principles

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Layer Structure](#layer-structure)
4. [Component Design](#component-design)
5. [Data Flow](#data-flow)
6. [Interface Definitions](#interface-definitions)
7. [Module Organization](#module-organization)
8. [Testing Strategy](#testing-strategy)
9. [Security Considerations](#security-considerations)
10. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

This document outlines the Clean Architecture design for implementing Keycloak OAuth authentication in the NestJS evaluation framework. The design emphasizes:

- **Maximum Separation of Concerns**: Four distinct layers with unidirectional dependencies
- **SOLID Principles**: Applied rigorously across all components
- **Domain-Driven Design**: Business logic isolated in the domain layer with zero framework dependencies
- **Testability**: Every layer independently testable with clear boundaries
- **Maintainability**: Clear structure that scales with complexity

### Key Architectural Decisions

1. **4-Layer Clean Architecture**: Domain, Application, Infrastructure, Presentation
2. **Port-Adapter Pattern**: Infrastructure implements domain/application interfaces
3. **CQRS Pattern**: Separate commands and queries where beneficial
4. **Repository Pattern**: Abstract data persistence from domain logic
5. **Use Case Pattern**: Application services encapsulate business flows
6. **Guard Pattern**: NestJS guards for declarative authorization

---

## Architecture Overview

### Dependency Rule

Dependencies flow **inward only**. Each layer can only depend on layers closer to the center:

```
┌─────────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                          │
│              (Controllers, Guards, DTOs)                     │
│                    Framework: NestJS                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ depends on
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                           │
│         (Use Cases, Application Services, Ports)             │
│                  Framework: Independent                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ depends on
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                              │
│    (Entities, Value Objects, Domain Services, Interfaces)   │
│                  Framework: Independent                      │
│                   Dependencies: ZERO                         │
└─────────────────────────────────────────────────────────────┘
                       ↑
                       │ implements
                       │
┌─────────────────────────────────────────────────────────────┐
│                INFRASTRUCTURE LAYER                          │
│    (Keycloak, Database, External APIs, Repositories)        │
│             Framework: NestJS, Prisma, Axios                 │
└─────────────────────────────────────────────────────────────┘
```

### SOLID Principles Mapping

| Principle | Application |
|-----------|-------------|
| **Single Responsibility** | Each class has one reason to change (User entity manages user state, not persistence) |
| **Open/Closed** | Use interfaces for extension points (IKeycloakAdapter can have multiple implementations) |
| **Liskov Substitution** | Any IUserRepository implementation can be substituted without breaking contracts |
| **Interface Segregation** | Narrow interfaces (ITokenValidator vs ITokenGenerator vs ITokenService) |
| **Dependency Inversion** | All layers depend on abstractions (interfaces), not concretions |

---

## Layer Structure

### 1. Domain Layer (Core)

**Purpose**: Contains business entities, business rules, and domain logic.

**Key Characteristics**:
- Zero dependencies on frameworks, libraries, or external concerns
- Pure TypeScript/JavaScript
- Defines interfaces (ports) for external dependencies
- Contains business invariants and validation

**Components**:
```
src/auth/domain/
├── entities/
│   ├── user.entity.ts           # User aggregate root
│   └── session.entity.ts        # Session value object
├── value-objects/
│   ├── email.vo.ts              # Email value object with validation
│   ├── user-id.vo.ts            # User ID value object
│   └── role.vo.ts               # Role value object
├── services/
│   └── user-authorization.service.ts  # Domain service for authorization logic
├── repositories/
│   └── user.repository.interface.ts   # Repository contract (port)
└── exceptions/
    ├── invalid-user.exception.ts
    └── authorization-failed.exception.ts
```

**Responsibilities**:
- Define business entities with encapsulated behavior
- Validate business rules
- Define repository contracts
- Contain domain-specific logic (not application workflow)

---

### 2. Application Layer

**Purpose**: Orchestrates domain objects to fulfill use cases. Contains application-specific business rules.

**Key Characteristics**:
- Depends only on domain layer
- No framework dependencies
- Defines interfaces (ports) for infrastructure
- Orchestrates workflows using domain entities

**Components**:
```
src/auth/application/
├── use-cases/
│   ├── authenticate-user/
│   │   ├── authenticate-user.use-case.ts
│   │   ├── authenticate-user.input.ts
│   │   └── authenticate-user.output.ts
│   ├── refresh-tokens/
│   │   ├── refresh-tokens.use-case.ts
│   │   ├── refresh-tokens.input.ts
│   │   └── refresh-tokens.output.ts
│   ├── logout-user/
│   │   ├── logout-user.use-case.ts
│   │   └── logout-user.input.ts
│   └── validate-session/
│       ├── validate-session.use-case.ts
│       └── validate-session.input.ts
├── ports/
│   ├── keycloak-adapter.interface.ts     # Port for Keycloak integration
│   ├── token-service.interface.ts        # Port for JWT operations
│   ├── session-manager.interface.ts      # Port for session management
│   └── user-synchronizer.interface.ts    # Port for user sync
├── dto/
│   ├── user.dto.ts                       # Application-level user DTO
│   └── token-pair.dto.ts                 # Token pair DTO
└── exceptions/
    ├── authentication-failed.exception.ts
    └── token-expired.exception.ts
```

**Responsibilities**:
- Implement use cases (application workflows)
- Define ports for infrastructure (interfaces)
- Transform domain entities to DTOs
- Coordinate domain services and repositories

---

### 3. Infrastructure Layer

**Purpose**: Implements interfaces defined by domain/application layers. Handles all external concerns.

**Key Characteristics**:
- Depends on domain and application layers
- Contains all framework and library dependencies
- Implements repositories and adapters
- Handles persistence, external APIs, and third-party services

**Components**:
```
src/auth/infrastructure/
├── adapters/
│   ├── keycloak/
│   │   ├── keycloak.adapter.ts              # Implements IKeycloakAdapter
│   │   ├── keycloak.config.ts               # Keycloak configuration
│   │   └── keycloak-client.factory.ts       # Factory for Keycloak client
│   ├── jwt/
│   │   ├── jwt-token.service.ts             # Implements ITokenService
│   │   ├── jwt-validator.service.ts         # JWT validation logic
│   │   └── jwt-generator.service.ts         # JWT generation logic
│   └── session/
│       └── session-manager.service.ts       # Implements ISessionManager
├── persistence/
│   ├── prisma/
│   │   ├── prisma.service.ts                # Prisma client service
│   │   ├── schema.prisma                    # Database schema
│   │   └── migrations/                      # Database migrations
│   ├── repositories/
│   │   ├── prisma-user.repository.ts        # Implements IUserRepository
│   │   └── prisma-session.repository.ts     # Session repository
│   └── entities/
│       ├── user.orm-entity.ts               # Prisma/TypeORM entity
│       ├── session.orm-entity.ts            # Session ORM entity
│       └── refresh-token.orm-entity.ts      # Refresh token ORM entity
├── mappers/
│   ├── user.mapper.ts                       # Domain ↔ ORM mapping
│   └── session.mapper.ts                    # Session mapping
└── config/
    └── auth.config.ts                       # Authentication configuration
```

**Responsibilities**:
- Implement repository interfaces
- Implement adapter interfaces (Keycloak, JWT)
- Handle database operations
- Manage external API communication
- Map between domain entities and ORM entities

---

### 4. Presentation Layer (API)

**Purpose**: Handles HTTP requests, responses, and user interface concerns.

**Key Characteristics**:
- Depends on application layer (use cases)
- NestJS-specific code
- No business logic
- Transforms HTTP to use case inputs/outputs

**Components**:
```
src/auth/presentation/
├── controllers/
│   ├── auth.controller.ts                   # Authentication endpoints
│   └── user.controller.ts                   # User profile endpoints
├── guards/
│   ├── jwt-auth.guard.ts                    # JWT authentication guard
│   ├── roles.guard.ts                       # Role-based authorization guard
│   └── keycloak-auth.guard.ts               # Keycloak-specific guard
├── decorators/
│   ├── current-user.decorator.ts            # Extract current user
│   ├── roles.decorator.ts                   # Declare required roles
│   └── public.decorator.ts                  # Mark public endpoints
├── dto/
│   ├── requests/
│   │   ├── auth-callback.dto.ts             # OAuth callback request
│   │   └── refresh-token.dto.ts             # Token refresh request
│   └── responses/
│       ├── auth-response.dto.ts             # Authentication response
│       └── user-response.dto.ts             # User profile response
├── filters/
│   └── auth-exception.filter.ts             # Exception handling
├── interceptors/
│   └── auth-logging.interceptor.ts          # Audit logging
└── validators/
    └── auth-callback.validator.ts           # Custom validation
```

**Responsibilities**:
- Handle HTTP requests/responses
- Validate input (DTOs)
- Execute guards and interceptors
- Transform use case results to HTTP responses
- Handle authentication/authorization at HTTP layer

---

## Component Design

### Domain Layer Components

#### 1. User Entity (Aggregate Root)

```typescript
// src/auth/domain/entities/user.entity.ts

/**
 * User aggregate root
 *
 * Responsibilities:
 * - Encapsulate user identity and attributes
 * - Enforce business invariants (email format, name length)
 * - Provide methods for business operations (activate, deactivate, update)
 * - Maintain consistency of user state
 *
 * SOLID Principles:
 * - SRP: Manages only user state and behavior
 * - OCP: Extensible through inheritance if needed
 */
export class User {
  private constructor(
    private readonly _id: UserId,
    private readonly _email: Email,
    private _name: string,
    private readonly _keycloakId: string,
    private _roles: Role[],
    private _isActive: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  // Factory method (Creational pattern)
  static create(props: CreateUserProps): User {
    // Validate business rules
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidUserException('User name cannot be empty');
    }

    return new User(
      props.id,
      props.email,
      props.name,
      props.keycloakId,
      props.roles,
      true,
      new Date(),
      new Date()
    );
  }

  // Getters (Encapsulation)
  get id(): UserId { return this._id; }
  get email(): Email { return this._email; }
  get name(): string { return this._name; }
  get keycloakId(): string { return this._keycloakId; }
  get roles(): Role[] { return [...this._roles]; }
  get isActive(): boolean { return this._isActive; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // Business methods (Domain logic)
  updateProfile(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new InvalidUserException('Name cannot be empty');
    }

    this._name = name;
    this._updatedAt = new Date();
  }

  assignRole(role: Role): void {
    if (this.hasRole(role)) {
      return; // Idempotent
    }

    this._roles.push(role);
    this._updatedAt = new Date();
  }

  removeRole(role: Role): void {
    this._roles = this._roles.filter(r => !r.equals(role));
    this._updatedAt = new Date();
  }

  activate(): void {
    if (this._isActive) return;

    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) return;

    this._isActive = false;
    this._updatedAt = new Date();
  }

  hasRole(role: Role): boolean {
    return this._roles.some(r => r.equals(role));
  }

  hasAnyRole(roles: Role[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  synchronizeFromKeycloak(keycloakData: KeycloakUserData): void {
    // Business rule: Only update if data changed
    let hasChanges = false;

    if (keycloakData.email !== this._email.value) {
      // Email changed in Keycloak
      this._email = Email.create(keycloakData.email);
      hasChanges = true;
    }

    if (keycloakData.name !== this._name) {
      this._name = keycloakData.name;
      hasChanges = true;
    }

    if (hasChanges) {
      this._updatedAt = new Date();
    }
  }
}
```

#### 2. Value Objects

```typescript
// src/auth/domain/value-objects/email.vo.ts

/**
 * Email value object
 *
 * Responsibilities:
 * - Ensure email format is always valid
 * - Immutable (cannot be changed after creation)
 * - Value equality (two emails with same value are equal)
 *
 * SOLID Principles:
 * - SRP: Only responsible for email validation and representation
 */
export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new InvalidEmailException(`Invalid email format: ${email}`);
    }

    return new Email(email.toLowerCase().trim());
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toString(): string {
    return this._value;
  }
}
```

```typescript
// src/auth/domain/value-objects/role.vo.ts

/**
 * Role value object
 *
 * Responsibilities:
 * - Represent user roles with type safety
 * - Validate role names
 * - Provide role comparison
 */
export class Role {
  private static readonly VALID_ROLES = ['admin', 'manager', 'user'] as const;

  private constructor(private readonly _value: string) {}

  static create(role: string): Role {
    if (!this.isValid(role)) {
      throw new InvalidRoleException(`Invalid role: ${role}`);
    }

    return new Role(role.toLowerCase());
  }

  static admin(): Role {
    return new Role('admin');
  }

  static manager(): Role {
    return new Role('manager');
  }

  static user(): Role {
    return new Role('user');
  }

  get value(): string {
    return this._value;
  }

  equals(other: Role): boolean {
    return this._value === other._value;
  }

  isAdmin(): boolean {
    return this._value === 'admin';
  }

  private static isValid(role: string): boolean {
    return this.VALID_ROLES.includes(role.toLowerCase() as any);
  }
}
```

#### 3. Repository Interface (Port)

```typescript
// src/auth/domain/repositories/user.repository.interface.ts

/**
 * User repository interface (Port)
 *
 * Responsibilities:
 * - Define contract for user persistence
 * - Abstract storage implementation details
 * - Return domain entities, not ORM entities
 *
 * SOLID Principles:
 * - ISP: Narrow interface with only needed operations
 * - DIP: Domain depends on abstraction, not concrete implementation
 */
export interface IUserRepository {
  /**
   * Find user by unique identifier
   * @returns User entity or null if not found
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Find user by email address
   * @returns User entity or null if not found
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Find user by Keycloak identifier
   * @returns User entity or null if not found
   */
  findByKeycloakId(keycloakId: string): Promise<User | null>;

  /**
   * Persist user entity (create or update)
   * @returns Saved user entity
   */
  save(user: User): Promise<User>;

  /**
   * Soft delete user
   */
  delete(id: UserId): Promise<void>;

  /**
   * Check if user exists by email
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Find all users with specific role
   */
  findByRole(role: Role): Promise<User[]>;
}
```

#### 4. Domain Service

```typescript
// src/auth/domain/services/user-authorization.service.ts

/**
 * Domain service for authorization logic
 *
 * Responsibilities:
 * - Encapsulate complex authorization rules
 * - Operate on domain entities
 * - Stateless (pure functions)
 *
 * SOLID Principles:
 * - SRP: Only handles authorization decisions
 * - OCP: Extensible through strategy pattern if needed
 */
export class UserAuthorizationService {
  /**
   * Check if user can access resource owned by another user
   */
  canAccessUserResource(
    actor: User,
    resourceOwnerId: UserId
  ): boolean {
    // Business rule: Users can access own resources, admins can access all
    return actor.id.equals(resourceOwnerId) || actor.hasRole(Role.admin());
  }

  /**
   * Check if user can perform action on resource type
   */
  canPerformAction(
    user: User,
    action: string,
    resourceType: string
  ): boolean {
    const requiredPermissions = this.getRequiredPermissions(action, resourceType);
    const userPermissions = this.getUserPermissions(user);

    return this.hasPermissions(userPermissions, requiredPermissions);
  }

  /**
   * Check if user has elevated privileges
   */
  hasElevatedPrivileges(user: User): boolean {
    return user.hasAnyRole([Role.admin(), Role.manager()]);
  }

  private getRequiredPermissions(action: string, resourceType: string): string[] {
    // Permission mapping based on domain rules
    const permissionMap: Record<string, string[]> = {
      'create:project': ['project.create'],
      'delete:project': ['project.delete'],
      'view:project': ['project.view'],
      'update:project': ['project.update'],
    };

    return permissionMap[`${action}:${resourceType}`] || [];
  }

  private getUserPermissions(user: User): string[] {
    // Map roles to permissions (domain logic)
    const rolePermissions: Record<string, string[]> = {
      'admin': ['*'], // All permissions
      'manager': ['project.view', 'project.create', 'project.update'],
      'user': ['project.view'],
    };

    return user.roles.flatMap(role =>
      rolePermissions[role.value] || []
    );
  }

  private hasPermissions(
    userPermissions: string[],
    requiredPermissions: string[]
  ): boolean {
    if (userPermissions.includes('*')) {
      return true; // Admin has all permissions
    }

    return requiredPermissions.every(required =>
      userPermissions.includes(required)
    );
  }
}
```

---

### Application Layer Components

#### 1. Authenticate User Use Case

```typescript
// src/auth/application/use-cases/authenticate-user/authenticate-user.use-case.ts

/**
 * Authenticate User Use Case
 *
 * Responsibilities:
 * - Orchestrate OAuth authentication flow
 * - Exchange authorization code for tokens via Keycloak
 * - Create or update user in local database
 * - Generate application tokens
 *
 * SOLID Principles:
 * - SRP: Only handles authentication workflow
 * - DIP: Depends on abstractions (IKeycloakAdapter, IUserRepository)
 */
export class AuthenticateUserUseCase {
  constructor(
    @Inject('IKeycloakAdapter')
    private readonly keycloakAdapter: IKeycloakAdapter,

    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,

    @Inject('ITokenService')
    private readonly tokenService: ITokenService,

    private readonly userSyncService: UserSynchronizationService
  ) {}

  async execute(
    input: AuthenticateUserInput
  ): Promise<AuthenticateUserOutput> {
    // 1. Exchange authorization code for Keycloak tokens
    const keycloakTokens = await this.keycloakAdapter.exchangeCodeForTokens(
      input.authorizationCode,
      input.codeVerifier
    );

    // 2. Validate and decode Keycloak token to get user info
    const keycloakUserInfo = await this.keycloakAdapter.validateToken(
      keycloakTokens.accessToken
    );

    // 3. Find or create user in local database
    let user = await this.userRepository.findByKeycloakId(
      keycloakUserInfo.sub
    );

    if (!user) {
      user = await this.createUserFromKeycloak(keycloakUserInfo);
    } else {
      // Synchronize user data from Keycloak
      await this.userSyncService.synchronizeUser(user, keycloakUserInfo);
      user = await this.userRepository.save(user);
    }

    // 4. Check if user is active
    if (!user.isActive) {
      throw new UserDeactivatedException('User account is deactivated');
    }

    // 5. Generate application tokens
    const appTokens = await this.tokenService.generateTokenPair(
      user.id,
      user.roles
    );

    // 6. Create session record
    await this.sessionManager.createSession({
      userId: user.id,
      accessToken: appTokens.accessToken,
      refreshToken: appTokens.refreshToken,
      expiresAt: this.calculateExpiration(appTokens.expiresIn),
    });

    // 7. Return authentication result
    return {
      user: UserDto.fromDomain(user),
      accessToken: appTokens.accessToken,
      refreshToken: appTokens.refreshToken,
      expiresIn: appTokens.expiresIn,
    };
  }

  private async createUserFromKeycloak(
    keycloakUserInfo: KeycloakUserInfo
  ): Promise<User> {
    const user = User.create({
      id: UserId.generate(),
      email: Email.create(keycloakUserInfo.email),
      name: keycloakUserInfo.name,
      keycloakId: keycloakUserInfo.sub,
      roles: this.mapKeycloakRoles(keycloakUserInfo.roles),
    });

    return await this.userRepository.save(user);
  }

  private mapKeycloakRoles(keycloakRoles: string[]): Role[] {
    return keycloakRoles
      .filter(role => ['admin', 'manager', 'user'].includes(role))
      .map(role => Role.create(role));
  }

  private calculateExpiration(expiresIn: number): Date {
    return new Date(Date.now() + expiresIn * 1000);
  }
}
```

```typescript
// src/auth/application/use-cases/authenticate-user/authenticate-user.input.ts

/**
 * Input for AuthenticateUserUseCase
 *
 * Simple data structure, no business logic
 */
export class AuthenticateUserInput {
  constructor(
    public readonly authorizationCode: string,
    public readonly codeVerifier: string
  ) {}
}
```

```typescript
// src/auth/application/use-cases/authenticate-user/authenticate-user.output.ts

/**
 * Output for AuthenticateUserUseCase
 *
 * Application-level DTO
 */
export class AuthenticateUserOutput {
  constructor(
    public readonly user: UserDto,
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly expiresIn: number
  ) {}
}
```

#### 2. Refresh Tokens Use Case

```typescript
// src/auth/application/use-cases/refresh-tokens/refresh-tokens.use-case.ts

/**
 * Refresh Tokens Use Case
 *
 * Responsibilities:
 * - Validate refresh token
 * - Generate new token pair
 * - Implement token rotation for security
 * - Detect and prevent token theft
 *
 * SOLID Principles:
 * - SRP: Only handles token refresh workflow
 * - DIP: Depends on abstractions
 */
export class RefreshTokensUseCase {
  constructor(
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,

    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,

    @Inject('ISessionManager')
    private readonly sessionManager: ISessionManager
  ) {}

  async execute(input: RefreshTokensInput): Promise<RefreshTokensOutput> {
    // 1. Validate refresh token
    const tokenPayload = await this.tokenService.validateRefreshToken(
      input.refreshToken
    );

    // 2. Check if token was already used (rotation detection)
    const session = await this.sessionManager.findByRefreshToken(
      input.refreshToken
    );

    if (!session) {
      throw new InvalidTokenException('Refresh token not found');
    }

    if (session.isUsed) {
      // Token reuse detected - potential theft
      await this.handleTokenTheft(tokenPayload.userId);
      throw new TokenTheftDetectedException(
        'Token reuse detected - all sessions revoked'
      );
    }

    // 3. Get user and verify active status
    const user = await this.userRepository.findById(
      UserId.fromString(tokenPayload.userId)
    );

    if (!user) {
      throw new UserNotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new UserDeactivatedException('User account is deactivated');
    }

    // 4. Mark old token as used
    await this.sessionManager.markTokenAsUsed(input.refreshToken);

    // 5. Generate new token pair
    const newTokens = await this.tokenService.generateTokenPair(
      user.id,
      user.roles
    );

    // 6. Update session with new tokens
    await this.sessionManager.updateSession({
      sessionId: session.id,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresAt: this.calculateExpiration(newTokens.expiresIn),
    });

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: newTokens.expiresIn,
    };
  }

  private async handleTokenTheft(userId: string): Promise<void> {
    // Revoke all sessions for this user
    await this.sessionManager.revokeAllUserSessions(
      UserId.fromString(userId)
    );
  }

  private calculateExpiration(expiresIn: number): Date {
    return new Date(Date.now() + expiresIn * 1000);
  }
}
```

#### 3. Application Ports (Interfaces)

```typescript
// src/auth/application/ports/keycloak-adapter.interface.ts

/**
 * Keycloak Adapter Port
 *
 * Defines contract for Keycloak integration
 *
 * SOLID Principles:
 * - ISP: Interface segregation (separate read/write if needed)
 * - DIP: Application depends on abstraction
 */
export interface IKeycloakAdapter {
  /**
   * Exchange authorization code for tokens
   */
  exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<KeycloakTokens>;

  /**
   * Validate JWT token from Keycloak
   */
  validateToken(token: string): Promise<KeycloakUserInfo>;

  /**
   * Refresh Keycloak tokens
   */
  refreshTokens(refreshToken: string): Promise<KeycloakTokens>;

  /**
   * Revoke token at Keycloak
   */
  revokeToken(token: string): Promise<void>;

  /**
   * Get user info from Keycloak
   */
  getUserInfo(accessToken: string): Promise<KeycloakUserInfo>;
}

export interface KeycloakTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface KeycloakUserInfo {
  sub: string;          // Keycloak user ID
  email: string;
  name: string;
  roles: string[];
  emailVerified: boolean;
}
```

```typescript
// src/auth/application/ports/token-service.interface.ts

/**
 * Token Service Port
 *
 * Defines contract for JWT operations
 *
 * SOLID Principles:
 * - ISP: Focused interface for token operations
 */
export interface ITokenService {
  /**
   * Generate access and refresh tokens
   */
  generateTokenPair(
    userId: UserId,
    roles: Role[]
  ): Promise<TokenPair>;

  /**
   * Validate access token
   */
  validateAccessToken(token: string): Promise<TokenPayload>;

  /**
   * Validate refresh token
   */
  validateRefreshToken(token: string): Promise<TokenPayload>;

  /**
   * Decode token without validation (for debugging)
   */
  decodeToken(token: string): TokenPayload;

  /**
   * Revoke token (add to blacklist)
   */
  revokeToken(tokenId: string): Promise<void>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
  jti: string;  // JWT ID for revocation
}
```

---

### Infrastructure Layer Components

#### 1. Keycloak Adapter Implementation

```typescript
// src/auth/infrastructure/adapters/keycloak/keycloak.adapter.ts

/**
 * Keycloak Adapter Implementation
 *
 * Responsibilities:
 * - Communicate with Keycloak server
 * - Handle OAuth flows
 * - Validate JWT tokens from Keycloak
 *
 * SOLID Principles:
 * - SRP: Only handles Keycloak integration
 * - DIP: Implements interface defined by application layer
 */
@Injectable()
export class KeycloakAdapter implements IKeycloakAdapter {
  private readonly tokenEndpoint: string;
  private readonly userInfoEndpoint: string;
  private readonly jwksClient: JwksClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    const realm = this.configService.get<string>('KEYCLOAK_REALM');

    this.tokenEndpoint = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
    this.userInfoEndpoint = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/userinfo`;

    this.jwksClient = jwksClient({
      jwksUri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
      cacheMaxAge: 600000, // 10 minutes
    });
  }

  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<KeycloakTokens> {
    try {
      const response = await this.httpService.axiosRef.post(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          code_verifier: codeVerifier,
          client_id: this.configService.get('KEYCLOAK_CLIENT_ID'),
          client_secret: this.configService.get('KEYCLOAK_CLIENT_SECRET'),
          redirect_uri: this.configService.get('KEYCLOAK_REDIRECT_URI'),
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error) {
      throw new KeycloakIntegrationException(
        'Failed to exchange authorization code',
        error
      );
    }
  }

  async validateToken(token: string): Promise<KeycloakUserInfo> {
    try {
      // Decode token header to get key ID
      const decoded = jwt.decode(token, { complete: true }) as {
        header: { kid: string };
        payload: any;
      };

      // Get signing key from Keycloak JWKS
      const signingKey = await this.getSigningKey(decoded.header.kid);

      // Verify token signature and claims
      const payload = jwt.verify(token, signingKey, {
        issuer: this.configService.get('KEYCLOAK_ISSUER'),
        audience: this.configService.get('KEYCLOAK_CLIENT_ID'),
        algorithms: ['RS256'],
      }) as any;

      // Extract user info from token
      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name || payload.preferred_username,
        roles: payload.realm_access?.roles || [],
        emailVerified: payload.email_verified || false,
      };
    } catch (error) {
      throw new InvalidTokenException('Token validation failed', error);
    }
  }

  async refreshTokens(refreshToken: string): Promise<KeycloakTokens> {
    try {
      const response = await this.httpService.axiosRef.post(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.configService.get('KEYCLOAK_CLIENT_ID'),
          client_secret: this.configService.get('KEYCLOAK_CLIENT_SECRET'),
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error) {
      throw new TokenRefreshException('Failed to refresh tokens', error);
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await this.httpService.axiosRef.post(
        `${this.tokenEndpoint}/revoke`,
        new URLSearchParams({
          token,
          client_id: this.configService.get('KEYCLOAK_CLIENT_ID'),
          client_secret: this.configService.get('KEYCLOAK_CLIENT_SECRET'),
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
    } catch (error) {
      throw new TokenRevocationException('Failed to revoke token', error);
    }
  }

  async getUserInfo(accessToken: string): Promise<KeycloakUserInfo> {
    try {
      const response = await this.httpService.axiosRef.get(
        this.userInfoEndpoint,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return {
        sub: response.data.sub,
        email: response.data.email,
        name: response.data.name,
        roles: response.data.realm_access?.roles || [],
        emailVerified: response.data.email_verified,
      };
    } catch (error) {
      throw new KeycloakIntegrationException(
        'Failed to get user info',
        error
      );
    }
  }

  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(new KeycloakIntegrationException('Failed to get signing key', err));
        } else {
          resolve(key.getPublicKey());
        }
      });
    });
  }
}
```

#### 2. Prisma User Repository Implementation

```typescript
// src/auth/infrastructure/persistence/repositories/prisma-user.repository.ts

/**
 * Prisma User Repository Implementation
 *
 * Responsibilities:
 * - Persist and retrieve user entities
 * - Map between domain entities and ORM entities
 * - Handle database operations
 *
 * SOLID Principles:
 * - SRP: Only handles user persistence
 * - DIP: Implements domain interface
 * - LSP: Can be substituted with any IUserRepository implementation
 */
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UserId): Promise<User | null> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: id.value, deletedAt: null },
    });

    return userRecord ? UserMapper.toDomain(userRecord) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userRecord = await this.prisma.user.findUnique({
      where: { email: email.value, deletedAt: null },
    });

    return userRecord ? UserMapper.toDomain(userRecord) : null;
  }

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    const userRecord = await this.prisma.user.findUnique({
      where: { keycloakId, deletedAt: null },
    });

    return userRecord ? UserMapper.toDomain(userRecord) : null;
  }

  async save(user: User): Promise<User> {
    const ormEntity = UserMapper.toOrm(user);

    const saved = await this.prisma.user.upsert({
      where: { id: ormEntity.id },
      update: {
        email: ormEntity.email,
        name: ormEntity.name,
        roles: ormEntity.roles,
        isActive: ormEntity.isActive,
        updatedAt: new Date(),
      },
      create: ormEntity,
    });

    return UserMapper.toDomain(saved);
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.update({
      where: { id: id.value },
      data: { deletedAt: new Date() },
    });
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.value, deletedAt: null },
    });

    return count > 0;
  }

  async findByRole(role: Role): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        roles: { has: role.value },
        deletedAt: null,
      },
    });

    return users.map(user => UserMapper.toDomain(user));
  }
}
```

#### 3. Domain-ORM Mapper

```typescript
// src/auth/infrastructure/mappers/user.mapper.ts

/**
 * User Mapper
 *
 * Responsibilities:
 * - Map between domain entities and ORM entities
 * - Translate database records to domain objects
 *
 * SOLID Principles:
 * - SRP: Only handles mapping
 */
export class UserMapper {
  /**
   * Map ORM entity to domain entity
   */
  static toDomain(ormEntity: UserOrmEntity): User {
    return User.create({
      id: UserId.fromString(ormEntity.id),
      email: Email.create(ormEntity.email),
      name: ormEntity.name,
      keycloakId: ormEntity.keycloakId,
      roles: ormEntity.roles.map(role => Role.create(role)),
    });
  }

  /**
   * Map domain entity to ORM entity
   */
  static toOrm(domainEntity: User): UserOrmEntity {
    return {
      id: domainEntity.id.value,
      email: domainEntity.email.value,
      name: domainEntity.name,
      keycloakId: domainEntity.keycloakId,
      roles: domainEntity.roles.map(role => role.value),
      isActive: domainEntity.isActive,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
      deletedAt: null,
    };
  }
}

/**
 * ORM Entity Type (Prisma model)
 */
export interface UserOrmEntity {
  id: string;
  email: string;
  name: string;
  keycloakId: string;
  roles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

---

### Presentation Layer Components

#### 1. Authentication Controller

```typescript
// src/auth/presentation/controllers/auth.controller.ts

/**
 * Authentication Controller
 *
 * Responsibilities:
 * - Handle HTTP requests for authentication
 * - Validate input DTOs
 * - Execute use cases
 * - Transform use case outputs to HTTP responses
 *
 * SOLID Principles:
 * - SRP: Only handles HTTP concerns
 * - DIP: Depends on use case abstractions
 */
@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase
  ) {}

  /**
   * Initiate OAuth login - redirect to Keycloak
   */
  @Get('login')
  @Public()
  @ApiOperation({ summary: 'Initiate OAuth login' })
  @ApiResponse({ status: 200, description: 'Authorization URL returned' })
  login(): AuthorizationUrlResponse {
    const authUrl = this.buildAuthorizationUrl();

    return {
      authorizationUrl: authUrl,
      codeVerifier: this.generateCodeVerifier(), // For PKCE
    };
  }

  /**
   * OAuth callback - exchange authorization code for tokens
   */
  @Post('callback')
  @Public()
  @ApiOperation({ summary: 'OAuth callback endpoint' })
  @ApiResponse({ status: 201, description: 'User authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async callback(
    @Body() dto: AuthCallbackDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResponse> {
    // Execute use case
    const result = await this.authenticateUserUseCase.execute({
      authorizationCode: dto.code,
      codeVerifier: dto.codeVerifier,
    });

    // Set refresh token in HTTP-only cookie
    this.setRefreshTokenCookie(response, result.refreshToken);

    // Return access token and user info
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 201, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<TokenResponse> {
    // Extract refresh token from cookie
    const refreshToken = request.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    // Execute use case
    const result = await this.refreshTokensUseCase.execute({
      refreshToken,
    });

    // Set new refresh token in cookie
    this.setRefreshTokenCookie(response, result.refreshToken);

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  /**
   * Logout user
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiBearerAuth()
  async logout(
    @CurrentUser() user: UserDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    // Execute use case
    await this.logoutUserUseCase.execute({
      userId: user.id,
    });

    // Clear refresh token cookie
    this.clearRefreshTokenCookie(response);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiBearerAuth()
  getCurrentUser(@CurrentUser() user: UserDto): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    };
  }

  // Private helper methods
  private buildAuthorizationUrl(): string {
    // Build Keycloak authorization URL with PKCE
    const params = new URLSearchParams({
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      redirect_uri: process.env.KEYCLOAK_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: this.generateCodeChallenge(),
      code_challenge_method: 'S256',
    });

    return `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth?${params}`;
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private generateCodeChallenge(): string {
    const verifier = this.generateCodeVerifier();
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  private setRefreshTokenCookie(
    response: Response,
    refreshToken: string
  ): void {
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
    });
  }
}
```

#### 2. JWT Authentication Guard

```typescript
// src/auth/presentation/guards/jwt-auth.guard.ts

/**
 * JWT Authentication Guard
 *
 * Responsibilities:
 * - Extract JWT from request
 * - Validate token
 * - Attach user to request
 * - Handle public endpoints
 *
 * SOLID Principles:
 * - SRP: Only handles authentication check
 * - DIP: Depends on token service abstraction
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Extract request
    const request = context.switchToHttp().getRequest();

    // Extract token
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Validate token
      const payload = await this.tokenService.validateAccessToken(token);

      // Load user
      const user = await this.userRepository.findById(
        UserId.fromString(payload.userId)
      );

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      // Attach user to request
      request.user = UserDto.fromDomain(user);

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: any): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
```

#### 3. Roles Guard

```typescript
// src/auth/presentation/guards/roles.guard.ts

/**
 * Roles Authorization Guard
 *
 * Responsibilities:
 * - Check if user has required roles
 * - Allow access based on role permissions
 *
 * SOLID Principles:
 * - SRP: Only handles role-based authorization
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: UserAuthorizationService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    // Get user from request (attached by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Check if user has any of the required roles
    const userRoles = user.roles.map(r => Role.create(r));
    const requiredRoleObjects = requiredRoles.map(r => Role.create(r));

    return this.hasRequiredRoles(userRoles, requiredRoleObjects);
  }

  private hasRequiredRoles(userRoles: Role[], requiredRoles: Role[]): boolean {
    return requiredRoles.some(required =>
      userRoles.some(user => user.equals(required))
    );
  }
}
```

#### 4. Custom Decorators

```typescript
// src/auth/presentation/decorators/current-user.decorator.ts

/**
 * Current User Decorator
 *
 * Extract current user from request
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

// Usage:
// @Get('profile')
// async getProfile(@CurrentUser() user: UserDto) { ... }
```

```typescript
// src/auth/presentation/decorators/roles.decorator.ts

/**
 * Roles Decorator
 *
 * Declare required roles for endpoint
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Usage:
// @Get('admin')
// @Roles('admin')
// async getAdminData() { ... }
```

```typescript
// src/auth/presentation/decorators/public.decorator.ts

/**
 * Public Decorator
 *
 * Mark endpoint as public (skip authentication)
 */
export const Public = () => SetMetadata('isPublic', true);

// Usage:
// @Post('login')
// @Public()
// async login() { ... }
```

---

## Data Flow

### Authentication Flow (OAuth Authorization Code with PKCE)

```
┌──────────┐                ┌──────────┐                ┌──────────┐                ┌──────────┐
│          │                │          │                │          │                │          │
│  Client  │                │   API    │                │ Keycloak │                │ Database │
│          │                │          │                │          │                │          │
└────┬─────┘                └────┬─────┘                └────┬─────┘                └────┬─────┘
     │                           │                           │                           │
     │  1. GET /auth/login       │                           │                           │
     ├──────────────────────────►│                           │                           │
     │                           │                           │                           │
     │  2. Authorization URL +   │                           │                           │
     │     Code Verifier         │                           │                           │
     │◄──────────────────────────┤                           │                           │
     │                           │                           │                           │
     │  3. Redirect to Keycloak  │                           │                           │
     ├──────────────────────────────────────────────────────►│                           │
     │                           │                           │                           │
     │  4. User enters credentials                           │                           │
     │◄──────────────────────────────────────────────────────┤                           │
     │                           │                           │                           │
     │  5. Authorization Code    │                           │                           │
     │◄──────────────────────────────────────────────────────┤                           │
     │                           │                           │                           │
     │  6. POST /auth/callback   │                           │                           │
     │     (code, codeVerifier)  │                           │                           │
     ├──────────────────────────►│                           │                           │
     │                           │                           │                           │
     │                           │  7. Exchange code         │                           │
     │                           │     for tokens            │                           │
     │                           ├──────────────────────────►│                           │
     │                           │                           │                           │
     │                           │  8. Keycloak tokens       │                           │
     │                           │◄──────────────────────────┤                           │
     │                           │                           │                           │
     │                           │  9. Validate JWT          │                           │
     │                           ├──────────────────────────►│                           │
     │                           │                           │                           │
     │                           │ 10. User info             │                           │
     │                           │◄──────────────────────────┤                           │
     │                           │                           │                           │
     │                           │ 11. Find/Create user                                  │
     │                           ├──────────────────────────────────────────────────────►│
     │                           │                           │                           │
     │                           │ 12. User entity           │                           │
     │                           │◄──────────────────────────────────────────────────────┤
     │                           │                           │                           │
     │                           │ 13. Generate app tokens   │                           │
     │                           │    (internal)             │                           │
     │                           │                           │                           │
     │                           │ 14. Save session          │                           │
     │                           ├──────────────────────────────────────────────────────►│
     │                           │                           │                           │
     │ 15. Access token +        │                           │                           │
     │     Refresh token (cookie)│                           │                           │
     │◄──────────────────────────┤                           │                           │
     │                           │                           │                           │
```

### Protected Resource Access Flow

```
┌──────────┐                ┌──────────┐                ┌──────────┐
│          │                │          │                │          │
│  Client  │                │   API    │                │ Database │
│          │                │          │                │          │
└────┬─────┘                └────┬─────┘                └────┬─────┘
     │                           │                           │
     │  1. GET /api/protected    │                           │
     │     Bearer <access-token> │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │  2. Extract token         │
     │                           │     (JwtAuthGuard)        │
     │                           │                           │
     │                           │  3. Validate token        │
     │                           │     (TokenService)        │
     │                           │                           │
     │                           │  4. Load user             │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │  5. User entity           │
     │                           │◄──────────────────────────┤
     │                           │                           │
     │                           │  6. Check roles           │
     │                           │     (RolesGuard)          │
     │                           │                           │
     │                           │  7. Execute use case      │
     │                           │                           │
     │  8. Protected resource    │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
```

### Token Refresh Flow

```
┌──────────┐                ┌──────────┐                ┌──────────┐
│          │                │          │                │          │
│  Client  │                │   API    │                │ Database │
│          │                │          │                │          │
└────┬─────┘                └────┬─────┘                └────┬─────┘
     │                           │                           │
     │  1. POST /auth/refresh    │                           │
     │     Cookie: refreshToken  │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │  2. Extract refresh token │
     │                           │     from cookie           │
     │                           │                           │
     │                           │  3. Validate token        │
     │                           │                           │
     │                           │  4. Check if token used   │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │  5. Session info          │
     │                           │◄──────────────────────────┤
     │                           │                           │
     │                           │  6. Mark token as used    │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │  7. Load user             │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │  8. User entity           │
     │                           │◄──────────────────────────┤
     │                           │                           │
     │                           │  9. Generate new tokens   │
     │                           │                           │
     │                           │ 10. Update session        │
     │                           ├──────────────────────────►│
     │                           │                           │
     │ 11. New access token +    │                           │
     │     New refresh token     │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
```

---

## Interface Definitions

### Domain Layer Interfaces

```typescript
// User Repository Interface
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByKeycloakId(keycloakId: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: UserId): Promise<void>;
  existsByEmail(email: Email): Promise<boolean>;
  findByRole(role: Role): Promise<User[]>;
}
```

### Application Layer Interfaces

```typescript
// Keycloak Adapter Interface
export interface IKeycloakAdapter {
  exchangeCodeForTokens(code: string, codeVerifier: string): Promise<KeycloakTokens>;
  validateToken(token: string): Promise<KeycloakUserInfo>;
  refreshTokens(refreshToken: string): Promise<KeycloakTokens>;
  revokeToken(token: string): Promise<void>;
  getUserInfo(accessToken: string): Promise<KeycloakUserInfo>;
}

// Token Service Interface
export interface ITokenService {
  generateTokenPair(userId: UserId, roles: Role[]): Promise<TokenPair>;
  validateAccessToken(token: string): Promise<TokenPayload>;
  validateRefreshToken(token: string): Promise<TokenPayload>;
  decodeToken(token: string): TokenPayload;
  revokeToken(tokenId: string): Promise<void>;
}

// Session Manager Interface
export interface ISessionManager {
  createSession(session: CreateSessionDto): Promise<Session>;
  findByRefreshToken(token: string): Promise<Session | null>;
  markTokenAsUsed(token: string): Promise<void>;
  updateSession(session: UpdateSessionDto): Promise<void>;
  revokeAllUserSessions(userId: UserId): Promise<void>;
  findActiveSessions(userId: UserId): Promise<Session[]>;
}
```

---

## Module Organization

### NestJS Module Structure

```typescript
// src/auth/auth.module.ts

/**
 * Auth Module
 *
 * Organizes all authentication-related components
 * Follows Clean Architecture with clear layer boundaries
 */
@Module({
  imports: [
    // Infrastructure dependencies
    HttpModule,
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    PrismaModule,
  ],
  controllers: [
    // Presentation layer
    AuthController,
    UserController,
  ],
  providers: [
    // Application layer - Use cases
    AuthenticateUserUseCase,
    RefreshTokensUseCase,
    LogoutUserUseCase,
    ValidateSessionUseCase,

    // Application layer - Services
    UserSynchronizationService,

    // Infrastructure layer - Adapters
    {
      provide: 'IKeycloakAdapter',
      useClass: KeycloakAdapter,
    },
    {
      provide: 'ITokenService',
      useClass: JwtTokenService,
    },
    {
      provide: 'ISessionManager',
      useClass: SessionManagerService,
    },

    // Infrastructure layer - Repositories
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },

    // Domain layer - Services
    UserAuthorizationService,

    // Presentation layer - Guards
    JwtAuthGuard,
    RolesGuard,

    // Presentation layer - Other
    CookieService,
  ],
  exports: [
    // Export for use in other modules
    JwtAuthGuard,
    RolesGuard,
    'IUserRepository',
    'ITokenService',
  ],
})
export class AuthModule {}
```

### File Structure

```
src/
├── auth/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   ├── user.entity.spec.ts
│   │   │   └── session.entity.ts
│   │   ├── value-objects/
│   │   │   ├── email.vo.ts
│   │   │   ├── email.vo.spec.ts
│   │   │   ├── user-id.vo.ts
│   │   │   └── role.vo.ts
│   │   ├── services/
│   │   │   ├── user-authorization.service.ts
│   │   │   └── user-authorization.service.spec.ts
│   │   ├── repositories/
│   │   │   └── user.repository.interface.ts
│   │   └── exceptions/
│   │       ├── invalid-user.exception.ts
│   │       └── authorization-failed.exception.ts
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── authenticate-user/
│   │   │   │   ├── authenticate-user.use-case.ts
│   │   │   │   ├── authenticate-user.use-case.spec.ts
│   │   │   │   ├── authenticate-user.input.ts
│   │   │   │   └── authenticate-user.output.ts
│   │   │   ├── refresh-tokens/
│   │   │   ├── logout-user/
│   │   │   └── validate-session/
│   │   ├── ports/
│   │   │   ├── keycloak-adapter.interface.ts
│   │   │   ├── token-service.interface.ts
│   │   │   └── session-manager.interface.ts
│   │   ├── services/
│   │   │   ├── user-synchronization.service.ts
│   │   │   └── user-synchronization.service.spec.ts
│   │   ├── dto/
│   │   │   ├── user.dto.ts
│   │   │   └── token-pair.dto.ts
│   │   └── exceptions/
│   │       ├── authentication-failed.exception.ts
│   │       └── token-expired.exception.ts
│   │
│   ├── infrastructure/
│   │   ├── adapters/
│   │   │   ├── keycloak/
│   │   │   │   ├── keycloak.adapter.ts
│   │   │   │   ├── keycloak.adapter.spec.ts
│   │   │   │   ├── keycloak.config.ts
│   │   │   │   └── keycloak-client.factory.ts
│   │   │   ├── jwt/
│   │   │   │   ├── jwt-token.service.ts
│   │   │   │   ├── jwt-token.service.spec.ts
│   │   │   │   ├── jwt-validator.service.ts
│   │   │   │   └── jwt-generator.service.ts
│   │   │   └── session/
│   │   │       └── session-manager.service.ts
│   │   ├── persistence/
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.service.ts
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   ├── repositories/
│   │   │   │   ├── prisma-user.repository.ts
│   │   │   │   ├── prisma-user.repository.spec.ts
│   │   │   │   └── prisma-session.repository.ts
│   │   │   └── entities/
│   │   │       ├── user.orm-entity.ts
│   │   │       ├── session.orm-entity.ts
│   │   │       └── refresh-token.orm-entity.ts
│   │   ├── mappers/
│   │   │   ├── user.mapper.ts
│   │   │   ├── user.mapper.spec.ts
│   │   │   └── session.mapper.ts
│   │   └── config/
│   │       └── auth.config.ts
│   │
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.controller.spec.ts
│   │   │   └── user.controller.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── jwt-auth.guard.spec.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── keycloak-auth.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── dto/
│   │   │   ├── requests/
│   │   │   │   ├── auth-callback.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   └── responses/
│   │   │       ├── auth-response.dto.ts
│   │   │       └── user-response.dto.ts
│   │   ├── filters/
│   │   │   └── auth-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── auth-logging.interceptor.ts
│   │   └── validators/
│   │       └── auth-callback.validator.ts
│   │
│   └── auth.module.ts
│
├── common/
│   ├── exceptions/
│   │   └── base.exception.ts
│   └── interfaces/
│       └── use-case.interface.ts
│
└── main.ts
```

---

## Testing Strategy

### Testing Pyramid

```
                    ┌──────────────┐
                    │     E2E      │
                    │   (10-20%)   │
                    └──────────────┘
                   ┌──────────────────┐
                   │   Integration    │
                   │    (20-30%)      │
                   └──────────────────┘
                ┌────────────────────────┐
                │        Unit            │
                │       (50-70%)         │
                └────────────────────────┘
```

### 1. Unit Tests (Domain Layer)

**Focus**: Test business logic in isolation

```typescript
// user.entity.spec.ts
describe('User Entity', () => {
  describe('create', () => {
    it('should create user with valid data', () => {
      const user = User.create({
        id: UserId.generate(),
        email: Email.create('test@example.com'),
        name: 'Test User',
        keycloakId: 'kc-123',
        roles: [Role.user()],
      });

      expect(user).toBeDefined();
      expect(user.email.value).toBe('test@example.com');
    });

    it('should throw error when name is empty', () => {
      expect(() => {
        User.create({
          id: UserId.generate(),
          email: Email.create('test@example.com'),
          name: '',
          keycloakId: 'kc-123',
          roles: [Role.user()],
        });
      }).toThrow(InvalidUserException);
    });
  });

  describe('updateProfile', () => {
    it('should update user name', () => {
      const user = createTestUser();

      user.updateProfile('New Name');

      expect(user.name).toBe('New Name');
    });

    it('should update updatedAt timestamp', () => {
      const user = createTestUser();
      const originalUpdatedAt = user.updatedAt;

      user.updateProfile('New Name');

      expect(user.updatedAt).not.toEqual(originalUpdatedAt);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', () => {
      const user = createTestUser({ roles: [Role.admin()] });

      expect(user.hasRole(Role.admin())).toBe(true);
    });

    it('should return false when user does not have role', () => {
      const user = createTestUser({ roles: [Role.user()] });

      expect(user.hasRole(Role.admin())).toBe(false);
    });
  });
});
```

### 2. Unit Tests (Application Layer)

**Focus**: Test use case orchestration with mocks

```typescript
// authenticate-user.use-case.spec.ts
describe('AuthenticateUserUseCase', () => {
  let useCase: AuthenticateUserUseCase;
  let keycloakAdapter: jest.Mocked<IKeycloakAdapter>;
  let userRepository: jest.Mocked<IUserRepository>;
  let tokenService: jest.Mocked<ITokenService>;

  beforeEach(() => {
    keycloakAdapter = createMockKeycloakAdapter();
    userRepository = createMockUserRepository();
    tokenService = createMockTokenService();

    useCase = new AuthenticateUserUseCase(
      keycloakAdapter,
      userRepository,
      tokenService,
      new UserSynchronizationService()
    );
  });

  it('should authenticate existing user', async () => {
    // Arrange
    const existingUser = createTestUser();
    keycloakAdapter.exchangeCodeForTokens.mockResolvedValue({
      accessToken: 'kc-access-token',
      refreshToken: 'kc-refresh-token',
      expiresIn: 300,
      tokenType: 'Bearer',
    });
    keycloakAdapter.validateToken.mockResolvedValue({
      sub: existingUser.keycloakId,
      email: existingUser.email.value,
      name: existingUser.name,
      roles: ['user'],
      emailVerified: true,
    });
    userRepository.findByKeycloakId.mockResolvedValue(existingUser);
    tokenService.generateTokenPair.mockResolvedValue({
      accessToken: 'app-access-token',
      refreshToken: 'app-refresh-token',
      expiresIn: 900,
    });

    // Act
    const result = await useCase.execute({
      authorizationCode: 'auth-code',
      codeVerifier: 'verifier',
    });

    // Assert
    expect(result.user.email).toBe(existingUser.email.value);
    expect(result.accessToken).toBe('app-access-token');
    expect(keycloakAdapter.exchangeCodeForTokens).toHaveBeenCalledWith(
      'auth-code',
      'verifier'
    );
  });

  it('should create new user when not found', async () => {
    // Arrange
    keycloakAdapter.exchangeCodeForTokens.mockResolvedValue({
      accessToken: 'kc-access-token',
      refreshToken: 'kc-refresh-token',
      expiresIn: 300,
      tokenType: 'Bearer',
    });
    keycloakAdapter.validateToken.mockResolvedValue({
      sub: 'new-kc-id',
      email: 'newuser@example.com',
      name: 'New User',
      roles: ['user'],
      emailVerified: true,
    });
    userRepository.findByKeycloakId.mockResolvedValue(null);
    userRepository.save.mockImplementation(user => Promise.resolve(user));
    tokenService.generateTokenPair.mockResolvedValue({
      accessToken: 'app-access-token',
      refreshToken: 'app-refresh-token',
      expiresIn: 900,
    });

    // Act
    const result = await useCase.execute({
      authorizationCode: 'auth-code',
      codeVerifier: 'verifier',
    });

    // Assert
    expect(userRepository.save).toHaveBeenCalled();
    expect(result.user.email).toBe('newuser@example.com');
  });

  it('should throw error when user is deactivated', async () => {
    // Arrange
    const deactivatedUser = createTestUser({ isActive: false });
    keycloakAdapter.exchangeCodeForTokens.mockResolvedValue({
      accessToken: 'kc-access-token',
      refreshToken: 'kc-refresh-token',
      expiresIn: 300,
      tokenType: 'Bearer',
    });
    keycloakAdapter.validateToken.mockResolvedValue({
      sub: deactivatedUser.keycloakId,
      email: deactivatedUser.email.value,
      name: deactivatedUser.name,
      roles: ['user'],
      emailVerified: true,
    });
    userRepository.findByKeycloakId.mockResolvedValue(deactivatedUser);

    // Act & Assert
    await expect(
      useCase.execute({
        authorizationCode: 'auth-code',
        codeVerifier: 'verifier',
      })
    ).rejects.toThrow(UserDeactivatedException);
  });
});
```

### 3. Integration Tests (Infrastructure Layer)

**Focus**: Test infrastructure implementations with real dependencies

```typescript
// prisma-user.repository.integration.spec.ts
describe('PrismaUserRepository Integration', () => {
  let repository: PrismaUserRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Setup test database
    prisma = await setupTestDatabase();
    repository = new PrismaUserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await cleanupDatabase(prisma);
  });

  it('should save and retrieve user', async () => {
    // Arrange
    const user = createTestUser();

    // Act
    await repository.save(user);
    const retrieved = await repository.findById(user.id);

    // Assert
    expect(retrieved).toBeDefined();
    expect(retrieved.email.value).toBe(user.email.value);
  });

  it('should find user by email', async () => {
    // Arrange
    const user = createTestUser();
    await repository.save(user);

    // Act
    const found = await repository.findByEmail(user.email);

    // Assert
    expect(found).toBeDefined();
    expect(found.id.value).toBe(user.id.value);
  });

  it('should return null for non-existent user', async () => {
    // Act
    const user = await repository.findById(UserId.generate());

    // Assert
    expect(user).toBeNull();
  });

  it('should soft delete user', async () => {
    // Arrange
    const user = createTestUser();
    await repository.save(user);

    // Act
    await repository.delete(user.id);
    const found = await repository.findById(user.id);

    // Assert
    expect(found).toBeNull();
  });
});
```

### 4. Integration Tests (Keycloak Mock)

```typescript
// keycloak.adapter.integration.spec.ts
describe('KeycloakAdapter Integration', () => {
  let adapter: KeycloakAdapter;
  let keycloakMock: KeycloakMock;

  beforeAll(async () => {
    keycloakMock = await setupKeycloakMock();
    adapter = new KeycloakAdapter(
      createMockConfigService(keycloakMock.getConfig()),
      createMockHttpService()
    );
  });

  afterAll(async () => {
    await teardownKeycloakMock();
  });

  it('should exchange authorization code for tokens', async () => {
    // Arrange
    const authCode = keycloakMock.createAuthorizationCode('test-user-id');

    // Act
    const tokens = await adapter.exchangeCodeForTokens(
      authCode,
      'code-verifier'
    );

    // Assert
    expect(tokens).toBeDefined();
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
  });

  it('should validate token and return user info', async () => {
    // Arrange
    const token = keycloakMock.createAccessToken({
      sub: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
    });

    // Act
    const userInfo = await adapter.validateToken(token);

    // Assert
    expect(userInfo.sub).toBe('test-user-id');
    expect(userInfo.email).toBe('test@example.com');
  });

  it('should throw error for invalid token', async () => {
    // Act & Assert
    await expect(
      adapter.validateToken('invalid-token')
    ).rejects.toThrow(InvalidTokenException);
  });
});
```

### 5. E2E Tests

**Focus**: Test complete user flows

```typescript
// auth.e2e-spec.ts
describe('Authentication E2E', () => {
  let app: INestApplication;
  let keycloakMock: KeycloakMock;

  beforeAll(async () => {
    keycloakMock = await setupKeycloakMock();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('IKeycloakAdapter')
      .useValue(createKeycloakAdapterWithMock(keycloakMock))
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await teardownKeycloakMock();
  });

  it('should complete full authentication flow', async () => {
    // 1. Get authorization URL
    const authUrlResponse = await request(app.getHttpServer())
      .get('/auth/login')
      .expect(200);

    expect(authUrlResponse.body).toHaveProperty('authorizationUrl');

    // 2. Exchange authorization code for tokens
    const authCode = keycloakMock.createAuthorizationCode('test-user-id');
    const callbackResponse = await request(app.getHttpServer())
      .post('/auth/callback')
      .send({
        code: authCode,
        codeVerifier: 'test-verifier',
      })
      .expect(201);

    expect(callbackResponse.body).toHaveProperty('accessToken');
    const accessToken = callbackResponse.body.accessToken;

    // 3. Access protected resource
    const protectedResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(protectedResponse.body).toHaveProperty('email');

    // 4. Refresh tokens
    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', callbackResponse.headers['set-cookie'])
      .expect(201);

    expect(refreshResponse.body).toHaveProperty('accessToken');

    // 5. Logout
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 6. Verify logout - access should be denied
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('should deny access without token', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });

  it('should deny access to admin routes for non-admin users', async () => {
    // Login as regular user
    const authCode = keycloakMock.createAuthorizationCode('user-id');
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/callback')
      .send({ code: authCode, codeVerifier: 'verifier' });

    const userToken = loginResponse.body.accessToken;

    // Try to access admin route
    await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});
```

### Test Coverage Goals

| Layer | Coverage Target | Focus |
|-------|----------------|-------|
| Domain | 90%+ | All business logic |
| Application | 85%+ | Use case orchestration |
| Infrastructure | 70%+ | Integration points |
| Presentation | 80%+ | HTTP handling, guards |

---

## Security Considerations

### 1. Token Security

**Access Tokens**:
- Short-lived (15 minutes)
- Stored in memory (frontend)
- Transmitted via Authorization header
- JWT format with signature verification

**Refresh Tokens**:
- Long-lived (7 days)
- Stored in HTTP-only cookies
- Rotation on each use
- Hashed in database

### 2. CSRF Protection

```typescript
// Apply CSRF protection to state-changing operations
@Post('refresh')
@UseGuards(CsrfGuard)
async refresh() { ... }
```

### 3. Rate Limiting

```typescript
// Apply rate limiting to authentication endpoints
@Post('callback')
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 requests per minute
async callback() { ... }
```

### 4. Input Validation

```typescript
// Validate all inputs with DTOs
export class AuthCallbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  codeVerifier: string;
}
```

### 5. Audit Logging

```typescript
// Log all authentication events
@Injectable()
export class AuthLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Log authentication attempt
    logger.info('Authentication attempt', {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      timestamp: new Date(),
    });

    return next.handle().pipe(
      tap(() => {
        // Log success
        logger.info('Authentication successful');
      }),
      catchError((error) => {
        // Log failure
        logger.error('Authentication failed', { error });
        throw error;
      })
    );
  }
}
```

---

## Implementation Checklist

### Phase 1: Domain Layer
- [ ] Define User entity with business methods
- [ ] Create Email value object with validation
- [ ] Create UserId value object
- [ ] Create Role value object
- [ ] Implement IUserRepository interface
- [ ] Implement UserAuthorizationService
- [ ] Write unit tests for all domain components (90%+ coverage)

### Phase 2: Application Layer
- [ ] Define IKeycloakAdapter port
- [ ] Define ITokenService port
- [ ] Define ISessionManager port
- [ ] Implement AuthenticateUserUseCase
- [ ] Implement RefreshTokensUseCase
- [ ] Implement LogoutUserUseCase
- [ ] Implement ValidateSessionUseCase
- [ ] Create UserDto and other application DTOs
- [ ] Write unit tests for all use cases (85%+ coverage)

### Phase 3: Infrastructure Layer
- [ ] Implement KeycloakAdapter
- [ ] Implement JwtTokenService
- [ ] Implement SessionManagerService
- [ ] Create Prisma schema for User, Session, RefreshToken
- [ ] Implement PrismaUserRepository
- [ ] Create UserMapper for domain-ORM mapping
- [ ] Setup database migrations
- [ ] Write integration tests for all infrastructure components (70%+ coverage)

### Phase 4: Presentation Layer
- [ ] Implement AuthController with all endpoints
- [ ] Implement JwtAuthGuard
- [ ] Implement RolesGuard
- [ ] Create @CurrentUser decorator
- [ ] Create @Roles decorator
- [ ] Create @Public decorator
- [ ] Implement request/response DTOs
- [ ] Add input validation
- [ ] Implement exception filters
- [ ] Add Swagger documentation
- [ ] Write unit tests for guards and controllers (80%+ coverage)

### Phase 5: Module Configuration
- [ ] Configure AuthModule with dependency injection
- [ ] Setup configuration management (environment variables)
- [ ] Configure CORS
- [ ] Setup CSRF protection
- [ ] Configure rate limiting
- [ ] Setup logging and monitoring

### Phase 6: Testing & Quality
- [ ] Write E2E tests for all user flows
- [ ] Setup Keycloak mock for testing
- [ ] Verify test coverage meets targets
- [ ] Perform security audit
- [ ] Load testing (100 concurrent users)
- [ ] Performance optimization

### Phase 7: Documentation & Deployment
- [ ] Complete API documentation (Swagger)
- [ ] Write developer guide
- [ ] Create deployment guide
- [ ] Setup CI/CD pipeline
- [ ] Configure production environment
- [ ] Deploy to staging for QA
- [ ] Production deployment

---

## Summary

This Clean Architecture design provides:

1. **Maximum Separation of Concerns**: Four distinct layers with clear responsibilities
2. **SOLID Principles**: Applied throughout the design
3. **Testability**: Every component independently testable
4. **Maintainability**: Clear structure that scales with complexity
5. **Framework Independence**: Domain and application layers have zero NestJS dependencies
6. **Flexibility**: Easy to swap implementations (e.g., TypeORM instead of Prisma)
7. **Security**: Multiple layers of defense (JWT validation, CSRF protection, rate limiting)

The design follows the constitution's principles:
- Clean Architecture with strict layer separation
- SOLID principles enforced at every level
- TDD-ready with clear testing strategy
- TypeScript type safety throughout
- NestJS best practices for framework integration

Next steps: Begin implementation following the checklist, starting with the domain layer and progressing outward.

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-09
**Approved By**: [Architecture Team]
**Next Review**: After Phase 1 completion
