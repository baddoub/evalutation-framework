# Keycloak OAuth Integration with NestJS - Research Document

**Date:** December 9, 2025
**Status:** Complete
**Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Keycloak OAuth 2.0 Integration](#1-keycloak-oauth-20-integration)
3. [NestJS Authentication Patterns](#2-nestjs-authentication-patterns)
4. [JWT Token Handling](#3-jwt-token-handling)
5. [Clean Architecture with NestJS Authentication](#4-clean-architecture-with-nestjs-authentication)
6. [PostgreSQL User Storage](#5-postgresql-user-storage)
7. [Testing Authentication Flows](#6-testing-authentication-flows)
8. [Implementation Roadmap](#implementation-roadmap)
9. [References](#references)

---

## Executive Summary

This document provides comprehensive research findings for implementing Keycloak OAuth authentication in a NestJS application following Clean Architecture principles. The research covers best practices as of 2025, including OAuth 2.0 flows, JWT handling, database integration, and testing strategies.

### Key Recommendations

- **OAuth Flow:** Authorization Code Flow with PKCE (mandatory as of Keycloak v23)
- **NestJS Integration:** Use `nest-keycloak-connect` with Passport.js fallback
- **Token Storage:** HTTP-only cookies for refresh tokens, short-lived access tokens
- **Database ORM:** Prisma recommended for new projects; TypeORM for existing codebases
- **Architecture Pattern:** Clean Architecture with domain-driven design principles
- **Testing Strategy:** TDD with `keycloak-mock` for unit tests, in-memory database for E2E

---

## 1. Keycloak OAuth 2.0 Integration

### 1.1 Authorization Code Flow with PKCE

**Decision:** Use Authorization Code Flow with PKCE for all client types

**Rationale:**
- PKCE is now mandatory in Keycloak v23+ (active by default)
- Provides extra layer of security against interception attacks
- Aligns with OAuth 2.1 specifications and RFC 9700 security guidelines
- Recommended for both confidential and public clients (SPAs, mobile apps)

**Implementation Notes:**
```
Flow Steps:
1. Client generates code_verifier and code_challenge
2. Authorization request includes code_challenge
3. Keycloak returns authorization code
4. Token request includes code_verifier
5. Keycloak validates and returns tokens
```

**Security Requirements:**
- PKCE is mandatory for public clients
- Confidential clients should use standard authorization code flow with client authentication
- Always use HTTPS for all OAuth endpoints
- Never use Implicit Flow (deprecated in OAuth 2.1)
- Avoid Resource Owner Password Credentials (Direct Grant)

### 1.2 Keycloak Realm Configuration

**Decision:** Create dedicated realm for application (not master realm)

**Rationale:**
- Master realm should be used for management only
- Realms provide isolation and security boundaries
- Each realm manages its own users, credentials, roles, and groups
- Better multi-tenancy support

**Configuration Steps:**

1. **Realm Setup:**
   - Create application-specific realm
   - Configure realm-level settings (token lifespans, login flows)
   - Enable required features (user registration, email verification)

2. **Client Configuration:**
   - Client ID: unique identifier for the application
   - Client Type: confidential (backend) or public (frontend)
   - Valid Redirect URIs: whitelist allowed callback URLs
   - Web Origins: configure CORS settings
   - Enable "Client Authentication" for confidential clients

3. **Security Settings:**
   - Enable PKCE
   - Set appropriate token expiration times
   - Configure refresh token rotation
   - Implement proper redirect URI validation
   - Use specific redirect URIs (avoid wildcards)

### 1.3 Scopes, Roles, and Permissions

**Decision:** Use verb-style scopes with role-based and attribute-based access control

**Rationale:**
- Reusable scopes across resource types (view, create, update, delete)
- Roles for broad permission groups (Admin, Manager, User)
- Attributes for fine-grained access control (department-specific access)
- Modular policies for better maintainability

**Best Practices:**

**Scopes:**
```
- Use action-based naming: view, create, update, delete
- Reuse across resources: view:users, view:projects
- Avoid resource-specific scopes: viewAccount (not recommended)
```

**Roles:**
```
- Broad categories: Admin, Manager, User
- Use role scope mappings to limit token claims
- Keep role hierarchy simple
```

**Permissions:**
```
- Create scope-based permissions for operations
- Create resource-based permissions for ownership constraints
- One permission per meaningful rule
- Avoid mega-permissions with all logic combined
```

**Fine-Grained Admin Permissions (FGAP V2):**
- Available in Keycloak 26.2+
- Explicit scopes: view-members, manage-members, map-roles, impersonate
- Better visibility and control over admin permissions

### 1.4 Alternatives Considered

**OAuth Implicit Flow:**
- Status: Deprecated (removed in OAuth 2.1)
- Reason: Security vulnerabilities, token exposed in URL
- Verdict: Do not use

**Resource Owner Password Credentials:**
- Status: Not recommended (RFC 9700)
- Use Cases: Legacy system migration only
- Alternatives: Device Authorization Grant, Authorization Code Flow
- Verdict: Avoid unless absolutely necessary

**Custom JWT Implementation:**
- Pros: Full control over token structure
- Cons: Reinventing security, maintenance burden, compliance issues
- Verdict: Use Keycloak's proven implementation

---

## 2. NestJS Authentication Patterns

### 2.1 Integration Approach

**Decision:** Primary - `nest-keycloak-connect`, Fallback - Custom Passport.js strategy

**Rationale:**
- `nest-keycloak-connect` provides tight integration with NestJS
- Native support for guards, decorators, and dependency injection
- Active maintenance and community support
- Passport.js provides fallback for custom scenarios

**Implementation:**

**Option 1: nest-keycloak-connect (Recommended)**

```typescript
// Installation
npm install nest-keycloak-connect keycloak-connect

// Module Configuration
import { KeycloakConnectModule } from 'nest-keycloak-connect';

@Module({
  imports: [
    KeycloakConnectModule.register({
      authServerUrl: 'https://keycloak.example.com',
      realm: 'my-realm',
      clientId: 'nest-api',
      secret: 'client-secret',
      policyEnforcement: 'enforcing', // enforcing | permissive
      tokenValidation: 'online', // online | offline
    }),
  ],
})
export class AppModule {}

// Guard Usage
import { AuthGuard, RoleGuard, ResourceGuard } from 'nest-keycloak-connect';

@Controller('users')
@UseGuards(AuthGuard, RoleGuard)
export class UsersController {
  @Get()
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }
}
```

**Benefits:**
- Built-in guards: AuthGuard, RoleGuard, ResourceGuard
- Automatic JWT validation
- Policy enforcement integration
- Decorator support for roles and resources

**Option 2: Passport.js with Keycloak Strategy**

```typescript
// Installation
npm install @nestjs/passport passport passport-keycloak-bearer

// Strategy Implementation
import { Strategy } from 'passport-keycloak-bearer';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor() {
    super({
      host: 'https://keycloak.example.com',
      realm: 'my-realm',
      clientID: 'nest-api',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.realm_access.roles,
    };
  }
}

// Guard Usage
@Controller('users')
@UseGuards(AuthGuard('keycloak'))
export class UsersController {}
```

**Use Cases:**
- Custom token validation logic
- Multi-authentication strategy
- Migration from existing Passport setup

### 2.2 Guard Implementation Patterns

**Decision:** Use custom guards with dependency injection for business logic

**Rationale:**
- Separation of concerns
- Testability
- Reusability across routes
- Integration with domain layer

**Guard Structure:**

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.authService.validateToken(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromRequest(request: any): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
```

**Custom Role Guard:**

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

**Decorator for Roles:**

```typescript
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Usage
@Get('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
getAdminData() {
  return this.service.getAdminData();
}
```

### 2.3 Bearer Token vs Cookie Authentication

**Decision:** Hybrid approach - Bearer tokens for API, cookies for web sessions

**API Endpoints (Bearer Token):**
```typescript
@Controller('api')
@UseGuards(JwtAuthGuard)
export class ApiController {
  // Access token in Authorization header
}
```

**Web Application (Cookie-based):**
```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Res({ passthrough: true }) response: Response) {
    const tokens = await this.authService.login();

    // Set HTTP-only cookie for refresh token
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken: tokens.accessToken };
  }
}
```

### 2.4 Alternatives Considered

**Session-based Authentication:**
- Pros: Simple, works without tokens
- Cons: Stateful, scaling challenges, not RESTful
- Verdict: Not suitable for microservices architecture

**API Keys:**
- Pros: Simple for machine-to-machine
- Cons: No user context, harder to rotate, limited features
- Verdict: Use only for service accounts, not user authentication

**OAuth 2.0 Password Grant:**
- Pros: Simple for trusted clients
- Cons: Deprecated, security risks, requires password storage
- Verdict: Use Authorization Code Flow instead

---

## 3. JWT Token Handling

### 3.1 Token Validation

**Decision:** Validate JWT signatures, expiration, issuer, and audience

**Rationale:**
- Prevents token tampering
- Ensures token freshness
- Verifies token origin
- Confirms intended recipient

**Validation Steps:**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class TokenValidationService {
  private jwksClient: jwksClient.JwksClient;

  constructor(private jwtService: JwtService) {
    this.jwksClient = jwksClient({
      jwksUri: 'https://keycloak.example.com/realms/my-realm/protocol/openid-connect/certs',
      cache: true,
      rateLimit: true,
    });
  }

  async validateToken(token: string): Promise<any> {
    try {
      // Decode token header to get key ID
      const decoded = this.jwtService.decode(token, { complete: true });
      const kid = decoded.header.kid;

      // Get signing key from Keycloak
      const key = await this.getSigningKey(kid);

      // Verify token signature and claims
      const payload = this.jwtService.verify(token, {
        publicKey: key,
        issuer: 'https://keycloak.example.com/realms/my-realm',
        audience: 'nest-api',
      });

      // Additional validation
      if (payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
        } else {
          resolve(key.getPublicKey());
        }
      });
    });
  }
}
```

**Validation Checklist:**
- ✓ Signature verification (RSA256 with Keycloak's public key)
- ✓ Expiration time (exp claim)
- ✓ Issued at time (iat claim)
- ✓ Not before (nbf claim)
- ✓ Issuer (iss claim)
- ✓ Audience (aud claim)
- ✓ Subject (sub claim - user ID)

### 3.2 Token Storage Strategy

**Decision:** HTTP-only cookies for refresh tokens, memory/storage for access tokens

**Rationale:**
- HTTP-only cookies prevent XSS attacks
- Refresh tokens have longer lifespans and need more protection
- Access tokens are short-lived (15 minutes)
- Separate storage prevents CSRF attacks on access tokens

**Cookie Configuration:**

```typescript
@Injectable()
export class CookieService {
  setRefreshToken(response: Response, token: string): void {
    response.cookie('refreshToken', token, {
      httpOnly: true,        // Prevents JavaScript access
      secure: true,          // HTTPS only
      sameSite: 'strict',    // CSRF protection
      path: '/auth/refresh', // Limited scope
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  clearRefreshToken(response: Response): void {
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });
  }

  getRefreshToken(request: Request): string | null {
    return request.cookies?.refreshToken || null;
  }
}
```

**Access Token Storage (Frontend):**
```typescript
// In-memory storage (SPA)
class AuthService {
  private accessToken: string | null = null;

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }
}

// Pros: Protected from XSS if token never touches DOM
// Cons: Lost on page refresh (use refresh token to re-obtain)
```

### 3.3 Token Refresh and Rotation

**Decision:** Implement refresh token rotation with one-time use tokens

**Rationale:**
- Prevents replay attacks
- Limits damage from token theft
- Follows OAuth 2.0 Security Best Practices (RFC 9700)
- Detects token theft through concurrent use

**Implementation:**

```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
  ) {}

  async refreshTokens(oldRefreshToken: string): Promise<TokenPair> {
    // Validate old refresh token
    const payload = await this.validateRefreshToken(oldRefreshToken);

    // Check if token was already used (rotation detection)
    const tokenRecord = await this.usersRepository.findRefreshToken(
      oldRefreshToken,
    );

    if (!tokenRecord || tokenRecord.used) {
      // Token reuse detected - revoke all tokens for this user
      await this.revokeAllUserTokens(payload.sub);
      throw new UnauthorizedException('Token reuse detected');
    }

    // Mark old token as used
    await this.usersRepository.markTokenAsUsed(oldRefreshToken);

    // Generate new token pair
    const newAccessToken = this.generateAccessToken(payload.sub);
    const newRefreshToken = this.generateRefreshToken(payload.sub);

    // Store new refresh token (hashed)
    await this.usersRepository.saveRefreshToken({
      userId: payload.sub,
      token: await this.hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      used: false,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  private async validateRefreshToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.usersRepository.deleteAllRefreshTokens(userId);
  }
}
```

**Token Rotation Controller:**

```typescript
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
  ) {}

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const oldRefreshToken = this.cookieService.getRefreshToken(request);

    if (!oldRefreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokens = await this.authService.refreshTokens(oldRefreshToken);

    // Set new refresh token in cookie
    this.cookieService.setRefreshToken(response, tokens.refreshToken);

    // Return new access token
    return { accessToken: tokens.accessToken };
  }
}
```

**Token Expiration Strategy:**
- Access Token: 15 minutes (short-lived)
- Refresh Token: 7 days (long-lived)
- Rotation: Every refresh generates new token pair
- Concurrent Sessions: Maximum 5 per user

### 3.4 CSRF Protection

**Decision:** Use double-submit cookie pattern with CSRF tokens

**Rationale:**
- Required when using cookies for authentication
- Prevents CSRF attacks
- Complements HTTP-only cookie protection

**Implementation:**

```typescript
// Installation
npm install @nestjs/csrf csurf

// Main.ts Configuration
import * as csurf from 'csurf';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use(csurf({
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    },
  }));

  await app.listen(3000);
}
```

**CSRF Token Endpoint:**

```typescript
@Controller('auth')
export class AuthController {
  @Get('csrf-token')
  getCsrfToken(@Req() request: Request) {
    return { csrfToken: request.csrfToken() };
  }
}
```

**Frontend Integration:**

```typescript
// Fetch CSRF token before making requests
const response = await fetch('/auth/csrf-token');
const { csrfToken } = await response.json();

// Include in requests
await fetch('/api/protected', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  credentials: 'include', // Include cookies
  body: JSON.stringify(data),
});
```

**Alternative: Custom CSRF Module**

```typescript
import { Module } from '@nestjs/common';
import { CsrfModule } from '@tekuconcept/nestjs-csrf';

@Module({
  imports: [
    CsrfModule.forRoot({
      ttl: 3600, // Token TTL in seconds
    }),
  ],
})
export class AppModule {}
```

### 3.5 Security Best Practices

**Token Generation:**
```typescript
// Use strong secrets (minimum 256 bits)
ACCESS_TOKEN_SECRET=<random-256-bit-string>
REFRESH_TOKEN_SECRET=<different-random-256-bit-string>

// Rotate secrets periodically (every 90 days)
// Use environment-specific secrets
```

**Token Claims:**
```typescript
interface TokenPayload {
  sub: string;           // Subject (user ID)
  email: string;         // User email
  roles: string[];       // User roles
  iat: number;           // Issued at
  exp: number;           // Expiration
  iss: string;           // Issuer
  aud: string;           // Audience
  jti: string;           // JWT ID (for revocation)
}

// Avoid sensitive data in tokens (PII, passwords, etc.)
```

**Token Revocation:**
```typescript
@Injectable()
export class TokenBlacklistService {
  private blacklist = new Set<string>();

  async revokeToken(tokenId: string): Promise<void> {
    this.blacklist.add(tokenId);
    // Also store in Redis for distributed systems
  }

  async isRevoked(tokenId: string): Promise<boolean> {
    return this.blacklist.has(tokenId);
  }
}
```

### 3.6 Alternatives Considered

**LocalStorage for Tokens:**
- Pros: Survives page refresh
- Cons: Vulnerable to XSS attacks
- Verdict: Never store sensitive tokens in localStorage

**SessionStorage:**
- Pros: Cleared on tab close
- Cons: Still vulnerable to XSS
- Verdict: Not recommended for sensitive tokens

**Encrypted Cookies:**
- Pros: Added security layer
- Cons: Complexity, performance overhead
- Verdict: HTTP-only + secure flag is sufficient with proper CSRF protection

---

## 4. Clean Architecture with NestJS Authentication

### 4.1 Layer Structure

**Decision:** Implement 4-layer Clean Architecture with strict dependency rules

**Rationale:**
- Separation of concerns
- Testability (mock infrastructure easily)
- Framework independence
- Business logic isolation
- Maintainability and scalability

**Architecture Layers:**

```
┌─────────────────────────────────────────────────────────┐
│                    API/Presentation Layer                │
│  (Controllers, DTOs, Guards, Decorators, HTTP Adapters) │
└────────────────────┬────────────────────────────────────┘
                     │ depends on
                     ↓
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (Use Cases, Application Services, CQRS Handlers)       │
└────────────────────┬────────────────────────────────────┘
                     │ depends on
                     ↓
┌─────────────────────────────────────────────────────────┐
│                      Domain Layer                        │
│  (Entities, Value Objects, Domain Services, Interfaces) │
└─────────────────────────────────────────────────────────┘
                     ↑
                     │ implements
                     │
┌─────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                    │
│  (Database, External APIs, Keycloak, Repositories)      │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Domain Layer

**Domain Entity Example:**

```typescript
// src/domain/entities/user.entity.ts
export class User {
  private constructor(
    private readonly _id: string,
    private readonly _email: string,
    private _name: string,
    private readonly _roles: string[],
    private readonly _keycloakId: string,
    private _isActive: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    keycloakId: string;
  }): User {
    return new User(
      props.id,
      props.email,
      props.name,
      props.roles,
      props.keycloakId,
      true,
      new Date(),
      new Date(),
    );
  }

  // Getters
  get id(): string { return this._id; }
  get email(): string { return this._email; }
  get name(): string { return this._name; }
  get roles(): string[] { return [...this._roles]; }
  get keycloakId(): string { return this._keycloakId; }
  get isActive(): boolean { return this._isActive; }

  // Business Logic
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this._name = name;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  hasRole(role: string): boolean {
    return this._roles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this._roles.includes(role));
  }
}
```

**Repository Interface (Domain):**

```typescript
// src/domain/repositories/user.repository.interface.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByKeycloakId(keycloakId: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
}
```

**Domain Service:**

```typescript
// src/domain/services/user-authorization.service.ts
export class UserAuthorizationService {
  canAccessResource(user: User, resourceOwnerId: string): boolean {
    // Business rule: Users can access their own resources or admins can access all
    return user.id === resourceOwnerId || user.hasRole('admin');
  }

  canPerformAction(user: User, action: string, resource: string): boolean {
    const permissions = this.getRolePermissions(user.roles);
    return permissions.includes(`${action}:${resource}`);
  }

  private getRolePermissions(roles: string[]): string[] {
    // Domain logic for role-based permissions
    const permissionMap = {
      admin: ['create:*', 'read:*', 'update:*', 'delete:*'],
      manager: ['create:projects', 'read:*', 'update:projects'],
      user: ['read:projects', 'update:own'],
    };

    return roles.flatMap(role => permissionMap[role] || []);
  }
}
```

### 4.3 Application Layer

**Use Case Example:**

```typescript
// src/application/use-cases/authenticate-user.use-case.ts
export interface AuthenticateUserInput {
  authorizationCode: string;
  codeVerifier: string;
}

export interface AuthenticateUserOutput {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export class AuthenticateUserUseCase {
  constructor(
    private readonly keycloakAdapter: IKeycloakAdapter,
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    // 1. Exchange authorization code for tokens (via Keycloak)
    const keycloakTokens = await this.keycloakAdapter.exchangeCodeForTokens(
      input.authorizationCode,
      input.codeVerifier,
    );

    // 2. Validate and decode tokens
    const tokenPayload = await this.tokenService.validateToken(
      keycloakTokens.accessToken,
    );

    // 3. Find or create user in local database
    let user = await this.userRepository.findByKeycloakId(tokenPayload.sub);

    if (!user) {
      user = User.create({
        id: this.generateId(),
        email: tokenPayload.email,
        name: tokenPayload.name,
        roles: tokenPayload.roles,
        keycloakId: tokenPayload.sub,
      });
      await this.userRepository.save(user);
    }

    // 4. Generate application tokens
    const appTokens = await this.tokenService.generateTokenPair(user.id);

    return {
      user,
      accessToken: appTokens.accessToken,
      refreshToken: appTokens.refreshToken,
    };
  }

  private generateId(): string {
    return crypto.randomUUID();
  }
}
```

**Application Service Interfaces:**

```typescript
// src/application/ports/keycloak-adapter.interface.ts
export interface IKeycloakAdapter {
  exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<KeycloakTokens>;

  validateToken(token: string): Promise<TokenPayload>;

  refreshTokens(refreshToken: string): Promise<KeycloakTokens>;

  revokeToken(token: string): Promise<void>;
}

// src/application/ports/token-service.interface.ts
export interface ITokenService {
  generateTokenPair(userId: string): Promise<TokenPair>;
  validateToken(token: string): Promise<TokenPayload>;
  refreshTokens(refreshToken: string): Promise<TokenPair>;
  revokeToken(tokenId: string): Promise<void>;
}
```

### 4.4 Infrastructure Layer

**Keycloak Adapter Implementation:**

```typescript
// src/infrastructure/adapters/keycloak.adapter.ts
import axios from 'axios';

@Injectable()
export class KeycloakAdapter implements IKeycloakAdapter {
  private readonly tokenEndpoint: string;
  private readonly jwksUri: string;

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get('KEYCLOAK_URL');
    const realm = this.configService.get('KEYCLOAK_REALM');
    this.tokenEndpoint = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
    this.jwksUri = `${baseUrl}/realms/${realm}/protocol/openid-connect/certs`;
  }

  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<KeycloakTokens> {
    const response = await axios.post(
      this.tokenEndpoint,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        code_verifier: codeVerifier,
        client_id: this.configService.get('KEYCLOAK_CLIENT_ID'),
        client_secret: this.configService.get('KEYCLOAK_CLIENT_SECRET'),
        redirect_uri: this.configService.get('KEYCLOAK_REDIRECT_URI'),
      }),
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  }

  async validateToken(token: string): Promise<TokenPayload> {
    // Implementation using jwks-rsa and jsonwebtoken
    const decoded = jwt.decode(token, { complete: true });
    const signingKey = await this.getSigningKey(decoded.header.kid);

    const payload = jwt.verify(token, signingKey, {
      issuer: this.configService.get('KEYCLOAK_ISSUER'),
      audience: this.configService.get('KEYCLOAK_CLIENT_ID'),
    });

    return payload as TokenPayload;
  }

  async refreshTokens(refreshToken: string): Promise<KeycloakTokens> {
    const response = await axios.post(
      this.tokenEndpoint,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.configService.get('KEYCLOAK_CLIENT_ID'),
        client_secret: this.configService.get('KEYCLOAK_CLIENT_SECRET'),
      }),
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  }

  async revokeToken(token: string): Promise<void> {
    await axios.post(
      `${this.tokenEndpoint}/revoke`,
      new URLSearchParams({
        token,
        client_id: this.configService.get('KEYCLOAK_CLIENT_ID'),
        client_secret: this.configService.get('KEYCLOAK_CLIENT_SECRET'),
      }),
    );
  }

  private async getSigningKey(kid: string): Promise<string> {
    // Implementation using jwks-rsa
  }
}
```

**Repository Implementation:**

```typescript
// src/infrastructure/persistence/repositories/user.repository.ts
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { keycloakId } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return await this.repository.exists({ where: { email } });
  }

  // Mapping methods
  private toDomain(entity: UserEntity): User {
    return User.create({
      id: entity.id,
      email: entity.email,
      name: entity.name,
      roles: entity.roles,
      keycloakId: entity.keycloakId,
    });
  }

  private toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.name = user.name;
    entity.roles = user.roles;
    entity.keycloakId = user.keycloakId;
    entity.isActive = user.isActive;
    return entity;
  }
}
```

### 4.5 API/Presentation Layer

**Controller with Use Case:**

```typescript
// src/api/controllers/auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly cookieService: CookieService,
  ) {}

  @Post('callback')
  async callback(
    @Body() body: AuthCallbackDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authenticateUserUseCase.execute({
      authorizationCode: body.code,
      codeVerifier: body.codeVerifier,
    });

    // Set refresh token in HTTP-only cookie
    this.cookieService.setRefreshToken(response, result.refreshToken);

    // Return access token and user info
    return {
      accessToken: result.accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        roles: result.user.roles,
      },
    };
  }
}
```

**DTO Validation:**

```typescript
// src/api/dtos/auth-callback.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class AuthCallbackDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  codeVerifier: string;
}
```

### 4.6 Dependency Injection Configuration

**Module Structure:**

```typescript
// src/infrastructure/infrastructure.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    HttpModule,
  ],
  providers: [
    // Repository implementations
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    // Adapter implementations
    {
      provide: 'IKeycloakAdapter',
      useClass: KeycloakAdapter,
    },
    {
      provide: 'ITokenService',
      useClass: TokenService,
    },
  ],
  exports: [
    'IUserRepository',
    'IKeycloakAdapter',
    'ITokenService',
  ],
})
export class InfrastructureModule {}

// src/application/application.module.ts
@Module({
  imports: [InfrastructureModule],
  providers: [
    // Use cases
    AuthenticateUserUseCase,
    RefreshTokensUseCase,
    LogoutUserUseCase,
  ],
  exports: [
    AuthenticateUserUseCase,
    RefreshTokensUseCase,
    LogoutUserUseCase,
  ],
})
export class ApplicationModule {}

// src/api/api.module.ts
@Module({
  imports: [ApplicationModule],
  controllers: [AuthController],
  providers: [
    CookieService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class ApiModule {}
```

### 4.7 Benefits and Trade-offs

**Benefits:**
- ✓ Framework independence (can switch from NestJS if needed)
- ✓ Highly testable (mock infrastructure easily)
- ✓ Clear separation of concerns
- ✓ Business logic in domain layer (isolated)
- ✓ Easy to understand and maintain
- ✓ Supports CQRS and Event Sourcing if needed

**Trade-offs:**
- × More boilerplate code (interfaces, mappers)
- × Steeper learning curve for new developers
- × More files and folders
- × Requires discipline to maintain boundaries

**When to Use:**
- Enterprise applications
- Long-term projects (> 2 years)
- Complex business logic
- Multiple developers/teams
- High testability requirements

**When Not to Use:**
- Simple CRUD applications
- Prototypes or MVPs
- Single developer projects
- Short-term projects (< 6 months)

### 4.8 Alternatives Considered

**MVC Pattern:**
- Pros: Simple, familiar, less code
- Cons: Business logic in controllers, hard to test, framework coupling
- Verdict: Good for simple apps, not scalable for complex systems

**3-Layer Architecture:**
- Pros: Simpler than Clean Architecture
- Cons: Business logic mixed with application logic
- Verdict: Acceptable for medium complexity, lacks strict boundaries

**Hexagonal Architecture:**
- Pros: Similar benefits to Clean Architecture
- Cons: More abstract, fewer examples in NestJS community
- Verdict: Good alternative, but Clean Architecture has better NestJS adoption

---

## 5. PostgreSQL User Storage

### 5.1 ORM Selection

**Decision:** Prisma for new projects, TypeORM for existing codebases

**Rationale:**

**Prisma (Recommended for New Projects):**
- Type-safe auto-generated client
- Superior developer experience
- Modern schema-first approach
- Better performance (especially with Prisma Accelerate)
- Built-in migration system
- Active development and support
- Excellent NestJS integration

**TypeORM (For Existing Codebases):**
- Mature and battle-tested
- Flexible (Active Record + Data Mapper patterns)
- Decorator-based entities
- Wide community adoption
- Comprehensive features
- Better for complex SQL queries

**Performance Comparison (2025):**
```
Benchmark (1000 queries):
- Drizzle ORM: Fastest (new contender)
- Prisma: Very fast (with connection pooling)
- TypeORM: Good performance (traditional approach)
```

### 5.2 User Entity Modeling with Prisma

**Schema Definition:**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String
  keycloakId String   @unique @map("keycloak_id")
  roles      String[]
  isActive   Boolean  @default(true) @map("is_active")

  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  deletedAt  DateTime? @map("deleted_at")

  // Relations
  refreshTokens RefreshToken[]
  sessions      Session[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique // Hashed token
  used      Boolean  @default(false)
  expiresAt DateTime @map("expires_at")

  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
  @@index([userId])
  @@index([expiresAt])
}

model Session {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  deviceId  String?  @map("device_id")
  userAgent String?  @map("user_agent")
  ipAddress String?  @map("ip_address")
  expiresAt DateTime @map("expires_at")

  createdAt DateTime @default(now()) @map("created_at")
  lastUsed  DateTime @default(now()) @map("last_used")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
  @@index([userId])
  @@index([expiresAt])
}
```

**NestJS Service Integration:**

```typescript
// src/infrastructure/persistence/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: any) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

**Repository Implementation with Prisma:**

```typescript
// src/infrastructure/persistence/repositories/prisma-user.repository.ts
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { keycloakId, deletedAt: null },
    });
    return user ? this.toDomain(user) : null;
  }

  async save(user: User): Promise<User> {
    const data = {
      email: user.email,
      name: user.name,
      keycloakId: user.keycloakId,
      roles: user.roles,
      isActive: user.isActive,
    };

    const saved = await this.prisma.user.upsert({
      where: { id: user.id },
      update: data,
      create: { id: user.id, ...data },
    });

    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email, deletedAt: null },
    });
    return count > 0;
  }

  // Refresh token management
  async saveRefreshToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return await this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { token },
      data: { used: true },
    });
  }

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private toDomain(user: any): User {
    return User.create({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      keycloakId: user.keycloakId,
    });
  }
}
```

### 5.3 User Entity Modeling with TypeORM

**Entity Definition:**

```typescript
// src/infrastructure/persistence/entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  name: string;

  @Column({ name: 'keycloak_id', unique: true })
  @Index()
  keycloakId: string;

  @Column('simple-array')
  roles: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => RefreshTokenEntity, (token) => token.user)
  refreshTokens: RefreshTokenEntity[];

  @OneToMany(() => SessionEntity, (session) => session.user)
  sessions: SessionEntity[];
}

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ unique: true })
  token: string;

  @Column({ default: false })
  used: boolean;

  @Column({ name: 'expires_at' })
  @Index()
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;
}

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'device_id', nullable: true })
  deviceId: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'expires_at' })
  @Index()
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'last_used' })
  lastUsed: Date;

  @ManyToOne(() => UserEntity, (user) => user.sessions, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;
}
```

**Repository Implementation with TypeORM:**

```typescript
// src/infrastructure/persistence/repositories/typeorm-user.repository.ts
@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { keycloakId } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return await this.repository.exists({ where: { email } });
  }

  private toDomain(entity: UserEntity): User {
    return User.create({
      id: entity.id,
      email: entity.email,
      name: entity.name,
      roles: entity.roles,
      keycloakId: entity.keycloakId,
    });
  }

  private toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.name = user.name;
    entity.roles = user.roles;
    entity.keycloakId = user.keycloakId;
    entity.isActive = user.isActive;
    return entity;
  }
}
```

### 5.4 Soft Delete Implementation

**Prisma Approach (Client Extensions):**

```typescript
// src/infrastructure/persistence/prisma-extensions/soft-delete.extension.ts
import { Prisma } from '@prisma/client';

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    $allModels: {
      async findUnique({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async update({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async delete({ args, query }) {
        return query({
          ...args,
          data: { deletedAt: new Date() },
        } as any);
      },
    },
  },
});

// Usage in PrismaService
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private extendedClient: any;

  async onModuleInit() {
    await this.$connect();
    this.extendedClient = this.$extends(softDeleteExtension);
  }

  get user() {
    return this.extendedClient.user;
  }
}
```

**TypeORM Approach (Built-in):**

```typescript
// TypeORM soft delete is built-in using @DeleteDateColumn

// Soft delete
await userRepository.softDelete(id);

// Hard delete
await userRepository.delete(id);

// Find without deleted
await userRepository.find(); // Automatically excludes soft-deleted

// Find with deleted
await userRepository.find({ withDeleted: true });

// Restore soft-deleted
await userRepository.restore(id);
```

### 5.5 Database Migrations

**Prisma Migrations:**

```bash
# Create migration
npx prisma migrate dev --name add_users_table

# Apply migrations
npx prisma migrate deploy

# Generate client
npx prisma generate

# Seed database
npx prisma db seed
```

**Seed Script:**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      keycloakId: 'keycloak-admin-id',
      roles: ['admin'],
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

**TypeORM Migrations:**

```bash
# Generate migration
npm run typeorm migration:generate -- -n AddUsersTable

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

**Migration Example:**

```typescript
// src/infrastructure/persistence/migrations/1234567890-AddUsersTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddUsersTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'keycloak_id',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'roles',
            type: 'text[]',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_USER_EMAIL',
            columnNames: ['email'],
          },
          {
            name: 'IDX_USER_KEYCLOAK_ID',
            columnNames: ['keycloak_id'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

### 5.6 Database Security Best Practices

**PostgreSQL Configuration:**

```sql
-- Use SCRAM-SHA-256 authentication (strongest method)
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- Create application user with limited privileges
CREATE USER nest_app WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE mydb TO nest_app;
GRANT USAGE ON SCHEMA public TO nest_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nest_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nest_app;

-- Enable SSL/TLS
ALTER SYSTEM SET ssl = on;
```

**Connection String (Environment Variable):**

```bash
# Development
DATABASE_URL="postgresql://nest_app:password@localhost:5432/mydb?schema=public"

# Production (with SSL)
DATABASE_URL="postgresql://nest_app:password@prod-db.example.com:5432/mydb?schema=public&sslmode=require"
```

**Connection Pooling:**

```typescript
// For Prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 20
}

// For TypeORM
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [UserEntity],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  extra: {
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
}),
```

### 5.7 Alternatives Considered

**MongoDB:**
- Pros: Flexible schema, good for rapid prototyping
- Cons: No ACID transactions (before v4), less mature for auth
- Verdict: Not ideal for authentication data (relational nature)

**MySQL:**
- Pros: Widely used, good performance
- Cons: Less advanced features than PostgreSQL
- Verdict: Good alternative, but PostgreSQL preferred for JSON support

**SQLite:**
- Pros: Simple, no server, good for testing
- Cons: Not suitable for production (concurrent writes)
- Verdict: Good for local development and testing only

---

## 6. Testing Authentication Flows

### 6.1 TDD Approach

**Decision:** Write tests first, focusing on behavior and use cases

**Rationale:**
- Ensures tests actually verify behavior (not implementation)
- Forces thinking about API design before coding
- Prevents over-testing of implementation details
- Provides living documentation
- Increases confidence in refactoring

**TDD Cycle:**

```
1. RED: Write failing test
2. GREEN: Write minimal code to pass
3. REFACTOR: Improve code while keeping tests green
```

**Example TDD Flow for Authentication:**

```typescript
// Step 1: Write failing test
describe('AuthenticateUserUseCase', () => {
  it('should create new user when keycloak user does not exist locally', async () => {
    // Arrange
    const mockKeycloakAdapter = {
      exchangeCodeForTokens: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    };
    const mockTokenService = {
      validateToken: jest.fn().mockResolvedValue({
        sub: 'keycloak-user-id',
        email: 'user@example.com',
        name: 'Test User',
        roles: ['user'],
      }),
    };
    const mockUserRepository = {
      findByKeycloakId: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((user) => user),
    };

    const useCase = new AuthenticateUserUseCase(
      mockKeycloakAdapter,
      mockUserRepository,
      mockTokenService,
    );

    // Act
    const result = await useCase.execute({
      authorizationCode: 'auth-code',
      codeVerifier: 'verifier',
    });

    // Assert
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(result.user.email).toBe('user@example.com');
  });
});

// Step 2: Implement minimal code to pass
// (Implementation shown in section 4.3)

// Step 3: Refactor (extract methods, improve readability)
```

### 6.2 Unit Testing with Mocks

**Mocking Keycloak Adapter:**

```typescript
// tests/mocks/keycloak-adapter.mock.ts
export const createMockKeycloakAdapter = (): jest.Mocked<IKeycloakAdapter> => ({
  exchangeCodeForTokens: jest.fn(),
  validateToken: jest.fn(),
  refreshTokens: jest.fn(),
  revokeToken: jest.fn(),
});

// Usage in tests
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
    );
  });

  it('should exchange authorization code for tokens', async () => {
    // Arrange
    keycloakAdapter.exchangeCodeForTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 300,
    });

    // Act
    await useCase.execute({
      authorizationCode: 'code',
      codeVerifier: 'verifier',
    });

    // Assert
    expect(keycloakAdapter.exchangeCodeForTokens).toHaveBeenCalledWith(
      'code',
      'verifier',
    );
  });
});
```

**Testing Guards:**

```typescript
// tests/unit/guards/jwt-auth.guard.spec.ts
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: jest.Mocked<AuthService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    authService = {
      validateToken: jest.fn(),
    } as any;
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    guard = new JwtAuthGuard(authService, reflector);
  });

  it('should allow access with valid token', async () => {
    // Arrange
    const mockContext = createMockExecutionContext({
      headers: { authorization: 'Bearer valid-token' },
    });

    authService.validateToken.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
    });

    // Act
    const result = await guard.canActivate(mockContext);

    // Assert
    expect(result).toBe(true);
    expect(authService.validateToken).toHaveBeenCalledWith('valid-token');
  });

  it('should deny access with invalid token', async () => {
    // Arrange
    const mockContext = createMockExecutionContext({
      headers: { authorization: 'Bearer invalid-token' },
    });

    authService.validateToken.mockRejectedValue(new Error('Invalid token'));

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should deny access without token', async () => {
    // Arrange
    const mockContext = createMockExecutionContext({
      headers: {},
    });

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
```

### 6.3 Integration Testing with Keycloak Mock

**Setup keycloak-mock:**

```typescript
// tests/integration/setup-keycloak-mock.ts
import { KeycloakMock } from 'keycloak-node-mock';

export let keycloakMock: KeycloakMock;

export async function setupKeycloakMock() {
  keycloakMock = new KeycloakMock({
    realm: 'test-realm',
    issuer: 'http://localhost:8080/realms/test-realm',
  });

  await keycloakMock.start();

  // Create test users
  keycloakMock.createUser({
    sub: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    preferred_username: 'testuser',
    realm_access: {
      roles: ['user'],
    },
  });

  keycloakMock.createUser({
    sub: 'admin-user-id',
    email: 'admin@example.com',
    name: 'Admin User',
    preferred_username: 'adminuser',
    realm_access: {
      roles: ['admin'],
    },
  });

  return keycloakMock;
}

export async function teardownKeycloakMock() {
  if (keycloakMock) {
    await keycloakMock.stop();
  }
}
```

**Integration Test Example:**

```typescript
// tests/integration/auth.integration.spec.ts
describe('Authentication Integration Tests', () => {
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

  describe('POST /auth/callback', () => {
    it('should authenticate user with valid authorization code', async () => {
      // Arrange
      const authCode = keycloakMock.createAuthorizationCode('test-user-id');

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/callback')
        .send({
          code: authCode,
          codeVerifier: 'test-verifier',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should return 401 with invalid authorization code', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/callback')
        .send({
          code: 'invalid-code',
          codeVerifier: 'test-verifier',
        });

      // Assert
      expect(response.status).toBe(401);
    });
  });
});
```

### 6.4 E2E Testing

**E2E Test Setup:**

```typescript
// tests/e2e/auth.e2e-spec.ts
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Authentication E2E Tests', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // Step 1: Get authorization URL
      const authUrlResponse = await request(app.getHttpServer())
        .get('/auth/login')
        .expect(200);

      expect(authUrlResponse.body).toHaveProperty('authorizationUrl');

      // Step 2: Simulate callback with authorization code
      // (In real E2E, you would use Playwright/Puppeteer to interact with Keycloak)
      const callbackResponse = await request(app.getHttpServer())
        .post('/auth/callback')
        .send({
          code: 'mock-auth-code',
          codeVerifier: 'mock-verifier',
        })
        .expect(201);

      expect(callbackResponse.body).toHaveProperty('accessToken');
      accessToken = callbackResponse.body.accessToken;

      // Step 3: Access protected resource
      const protectedResponse = await request(app.getHttpServer())
        .get('/api/protected')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(protectedResponse.body).toBeDefined();
    });

    it('should refresh access token', async () => {
      // Act
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', ['refreshToken=mock-refresh-token'])
        .expect(201);

      // Assert
      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.headers['set-cookie']).toBeDefined();
    });

    it('should logout and revoke tokens', async () => {
      // Act
      const logoutResponse = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify token is revoked
      const protectedResponse = await request(app.getHttpServer())
        .get('/api/protected')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    it('should deny access without token', async () => {
      await request(app.getHttpServer())
        .get('/api/protected')
        .expect(401);
    });

    it('should deny access with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should deny access to admin routes for non-admin users', async () => {
      // Login as regular user
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/callback')
        .send({
          code: 'user-auth-code',
          codeVerifier: 'verifier',
        });

      const userToken = loginResponse.body.accessToken;

      // Try to access admin route
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
```

### 6.5 Database Testing Strategy

**In-Memory Database for Testing:**

```typescript
// tests/setup-test-database.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export async function setupTestDatabase() {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [UserEntity, RefreshTokenEntity, SessionEntity],
        synchronize: true,
        dropSchema: true,
      }),
    ],
  }).compile();

  return module.get(DataSource);
}

// For Prisma (use SQLite in-memory)
// .env.test
DATABASE_URL="file::memory:?cache=shared"
```

**Test Database Cleanup:**

```typescript
// tests/helpers/database-cleanup.ts
export async function cleanupDatabase(prisma: PrismaService) {
  await prisma.refreshToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

// Usage in tests
beforeEach(async () => {
  await cleanupDatabase(prisma);
});
```

### 6.6 Test Coverage Goals

**Coverage Targets:**
- Unit Tests: 90%+ coverage
- Integration Tests: Critical paths covered
- E2E Tests: Main user flows covered

**Critical Paths to Test:**
1. User authentication (happy path)
2. Token validation and refresh
3. Authorization (role-based access)
4. Token expiration handling
5. Concurrent session management
6. Token theft detection (rotation)
7. CSRF protection
8. Error scenarios (invalid tokens, network failures)

**Test Organization:**

```
tests/
├── unit/
│   ├── domain/
│   │   ├── entities/
│   │   └── services/
│   ├── application/
│   │   └── use-cases/
│   └── infrastructure/
│       └── adapters/
├── integration/
│   ├── auth/
│   └── database/
├── e2e/
│   ├── auth.e2e-spec.ts
│   └── protected-routes.e2e-spec.ts
├── mocks/
│   ├── keycloak-adapter.mock.ts
│   └── user-repository.mock.ts
└── helpers/
    ├── setup-keycloak-mock.ts
    ├── setup-test-database.ts
    └── test-data-builder.ts
```

### 6.7 Continuous Testing

**Pre-commit Hook:**

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test:unit
npm run lint
```

**CI/CD Pipeline:**

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 6.8 Alternatives Considered

**Manual Testing Only:**
- Pros: No test writing time
- Cons: Error-prone, time-consuming, no regression protection
- Verdict: Unacceptable for authentication (security-critical)

**End-to-End Tests Only:**
- Pros: Tests real user scenarios
- Cons: Slow, brittle, hard to debug
- Verdict: Use sparingly, focus on unit/integration tests

**Integration Tests with Real Keycloak:**
- Pros: Tests actual integration
- Cons: Slow, requires Keycloak setup, flaky
- Verdict: Use in staging environment, not in CI pipeline

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Day 1-2: Project Setup**
- [ ] Initialize NestJS project
- [ ] Set up PostgreSQL with Prisma
- [ ] Configure environment variables
- [ ] Set up Git repository and CI/CD

**Day 3-4: Domain Layer**
- [ ] Create User entity
- [ ] Define repository interfaces
- [ ] Implement domain services
- [ ] Write unit tests for domain logic

**Day 5-7: Infrastructure Layer**
- [ ] Implement Prisma repositories
- [ ] Set up database migrations
- [ ] Create Keycloak adapter
- [ ] Write integration tests

### Phase 2: Authentication Core (Week 2)

**Day 1-2: Keycloak Integration**
- [ ] Configure Keycloak client
- [ ] Implement OAuth 2.0 authorization code flow
- [ ] Add PKCE support
- [ ] Test token exchange

**Day 3-4: JWT Handling**
- [ ] Implement JWT validation
- [ ] Set up HTTP-only cookies
- [ ] Add CSRF protection
- [ ] Implement token refresh

**Day 5-7: Application Layer**
- [ ] Create authentication use cases
- [ ] Implement token rotation
- [ ] Add session management
- [ ] Write use case tests

### Phase 3: API Layer (Week 3)

**Day 1-2: Controllers**
- [ ] Implement auth controller (login, callback, refresh, logout)
- [ ] Add DTOs and validation
- [ ] Configure Swagger documentation

**Day 3-4: Guards and Decorators**
- [ ] Create JWT authentication guard
- [ ] Implement role-based authorization guard
- [ ] Create custom decorators (@CurrentUser, @Roles)
- [ ] Write guard tests

**Day 5-7: Protected Routes**
- [ ] Secure API endpoints
- [ ] Add authorization checks
- [ ] Test protected routes

### Phase 4: Testing and Security (Week 4)

**Day 1-3: Comprehensive Testing**
- [ ] Complete unit test coverage
- [ ] Write integration tests with Keycloak mock
- [ ] Create E2E test scenarios
- [ ] Set up test database

**Day 4-5: Security Hardening**
- [ ] Security audit
- [ ] Add rate limiting
- [ ] Implement token blacklisting
- [ ] Configure CORS properly

**Day 6-7: Documentation and Deployment**
- [ ] Write API documentation
- [ ] Create deployment guide
- [ ] Set up monitoring and logging
- [ ] Prepare for production deployment

---

## References

### Official Documentation

1. **Keycloak Documentation**
   - Authorization Services Guide: https://www.keycloak.org/docs/latest/authorization_services/
   - Server Administration Guide: https://www.keycloak.org/docs/latest/server_admin/
   - Securing Apps with OIDC: https://www.keycloak.org/securing-apps/oidc-layers

2. **NestJS Documentation**
   - Authentication: https://docs.nestjs.com/security/authentication
   - Guards: https://docs.nestjs.com/guards
   - CSRF Protection: https://docs.nestjs.com/security/csrf

3. **OAuth 2.0 Standards**
   - RFC 6749 - OAuth 2.0 Framework: https://datatracker.ietf.org/doc/html/rfc6749
   - RFC 7636 - PKCE: https://datatracker.ietf.org/doc/html/rfc7636
   - RFC 9700 - OAuth 2.0 Security Best Practices: https://datatracker.ietf.org/doc/html/rfc9700

4. **Prisma Documentation**
   - Getting Started with NestJS: https://www.prisma.io/docs/guides/nestjs
   - PostgreSQL Connection: https://www.prisma.io/docs/concepts/database-connectors/postgresql

### NPM Packages

1. **Authentication**
   - nest-keycloak-connect: https://www.npmjs.com/package/nest-keycloak-connect
   - passport-keycloak-bearer: https://www.npmjs.com/package/passport-keycloak-bearer
   - @nestjs/jwt: https://www.npmjs.com/package/@nestjs/jwt
   - jsonwebtoken: https://www.npmjs.com/package/jsonwebtoken
   - jwks-rsa: https://www.npmjs.com/package/jwks-rsa

2. **Security**
   - @nestjs/csrf: https://www.npmjs.com/package/@nestjs/csrf
   - csurf: https://www.npmjs.com/package/csurf
   - helmet: https://www.npmjs.com/package/helmet
   - bcrypt: https://www.npmjs.com/package/bcrypt

3. **Database**
   - @prisma/client: https://www.npmjs.com/package/@prisma/client
   - typeorm: https://www.npmjs.com/package/typeorm
   - @nestjs/typeorm: https://www.npmjs.com/package/@nestjs/typeorm

4. **Testing**
   - keycloak-node-mock: https://www.npmjs.com/package/keycloak-node-mock
   - @nestjs/testing: https://www.npmjs.com/package/@nestjs/testing
   - supertest: https://www.npmjs.com/package/supertest

### Articles and Tutorials

1. **Keycloak Integration**
   - "How to set up Keycloak with NestJS": https://www.creowis.com/blog/how-to-set-up-keycloak-with-nestjs
   - "Secure Your Nest.js App Using KeyCloak": https://www.meetri.in/blogs/key-cloak-with-nestjs-iam.html
   - "Resources, Scopes, Permissions & Policies in Keycloak": https://medium.com/@trivajay259/resources-scopes-permissions-policies-in-keycloak-a-practical-guide-for-mapping-legacy-rbac-fd5a60f392bf

2. **JWT and Security**
   - "JWT Authentication: A Deep Dive": https://blog.stackademic.com/jwt-authentication-a-deep-dive-into-access-tokens-and-refresh-tokens-274c6c3b352d
   - "Refresh Token Rotation in NestJS": https://blog.iamstarcode.com/refresh-token-rotation-in-nestjs-jwt-authentication
   - "Securing Web Applications with Next.js and Nest.js": https://medium.com/reversebits/securing-web-applications-with-next-js-and-nest-js-178de7d47316

3. **Clean Architecture**
   - "Mastering NestJS: Clean Architecture and DDD": https://medium.com/nestjs-ninja/mastering-nestjs-unleashing-the-power-of-clean-architecture-and-ddd-in-e-commerce-development-97850131fd87
   - "Applying Domain-Driven Design to NestJS": https://dev.to/bendix/applying-domain-driven-design-principles-to-a-nest-js-project-5f7b

4. **Database and ORM**
   - "Best ORM for NestJS in 2025": https://dev.to/sasithwarnakafonseka/best-orm-for-nestjs-in-2025-drizzle-orm-vs-typeorm-vs-prisma-229c
   - "Prisma vs TypeORM": https://www.bytebase.com/blog/prisma-vs-typeorm/
   - "NestJS + TypeORM + PostgreSQL: The Enterprise Stack": https://medium.com/@lucaswade0595/typenestjs-typeorm-postgresql-the-enterprise-node-js-stack-in-2025-cba739f350a8

5. **Testing**
   - "Best Practices for Testing NestJS Applications in 2025": https://toxigon.com/best-practices-for-testing-nestjs-applications
   - "End-to-End Testing in NestJS with TypeORM": https://blog.logrocket.com/end-end-testing-nestjs-typeorm/

### GitHub Repositories

1. **Example Projects**
   - nestjs-keycloak-example: https://github.com/Vipcube/nestjs-keycloak-example
   - typescript-ddd-architecture: https://github.com/zhuravlevma/typescript-ddd-architecture
   - nest-clean-architecture: https://github.com/wesleey/nest-clean-architecture
   - testing-nestjs: https://github.com/jmcdo29/testing-nestjs

2. **Tools and Libraries**
   - keycloak-mock: https://github.com/SectorLabs/keycloak-mock
   - prisma-soft-delete-middleware: https://github.com/olivierwilkinson/prisma-soft-delete-middleware

### Security Resources

1. **OWASP**
   - Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
   - Session Management: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
   - JWT Security: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html

2. **PostgreSQL Security**
   - Official Security Documentation: https://www.postgresql.org/docs/current/client-authentication.html
   - "PostgreSQL Security: A Comprehensive Guide": https://www.percona.com/blog/postgresql-database-security-what-you-need-to-know/

---

## Appendix

### Glossary

**Authorization Code Flow**: OAuth 2.0 flow where client exchanges authorization code for tokens
**PKCE**: Proof Key for Code Exchange - security extension for OAuth 2.0
**JWT**: JSON Web Token - compact, URL-safe token format
**JWKS**: JSON Web Key Set - set of public keys for JWT verification
**CSRF**: Cross-Site Request Forgery - security vulnerability
**XSS**: Cross-Site Scripting - security vulnerability
**Soft Delete**: Marking records as deleted without physical removal
**Repository Pattern**: Abstraction over data access layer
**Use Case**: Application-specific business rule
**Domain Entity**: Core business object with identity
**Value Object**: Immutable object without identity
**Guard**: NestJS concept for request authorization
**Decorator**: TypeScript feature for metadata and code modification

### Environment Variables Template

```bash
# .env.example

# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Keycloak
KEYCLOAK_URL=https://keycloak.example.com
KEYCLOAK_REALM=my-realm
KEYCLOAK_CLIENT_ID=nest-api
KEYCLOAK_CLIENT_SECRET=client-secret
KEYCLOAK_REDIRECT_URI=http://localhost:3000/auth/callback
KEYCLOAK_ISSUER=https://keycloak.example.com/realms/my-realm

# JWT
ACCESS_TOKEN_SECRET=<256-bit-random-string>
REFRESH_TOKEN_SECRET=<256-bit-random-string>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Security
CSRF_SECRET=<256-bit-random-string>
COOKIE_SECRET=<256-bit-random-string>

# Logging
LOG_LEVEL=debug
```

### Quick Start Commands

```bash
# Install dependencies
npm install

# Database setup
npx prisma generate
npx prisma migrate dev

# Run tests
npm run test:unit
npm run test:integration
npm run test:e2e

# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

---

**Document End**
