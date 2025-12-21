# Final Design: Keycloak OAuth Authentication

**Feature**: Keycloak OAuth Authentication
**Architecture Approach**: Clean Architecture with SOLID Principles
**Version**: 1.0.0
**Date**: 2025-12-09
**Status**: Final - Ready for Implementation
**Chosen By**: User

---

## Executive Summary

This document defines the **final architecture** for implementing Keycloak OAuth authentication using Clean Architecture principles with strict SOLID compliance. This approach was chosen for:

- **Maximum Separation of Concerns**: Four distinct layers with unidirectional dependencies
- **Long-term Maintainability**: Clear structure that scales with project complexity
- **Framework Independence**: Domain and application layers have zero framework dependencies
- **Testability**: Every component independently testable with clear boundaries
- **Professional Standards**: Enterprise-grade architecture suitable for complex systems

---

## Architecture Decision

After evaluating two approaches:

1. **Clean Architecture (SELECTED)**: Maximum abstraction, 4-layer separation, SOLID principles
2. **Pragmatic Architecture (NOT SELECTED)**: 3-layer with NestJS conventions, faster but less flexible

**Decision**: Clean Architecture was selected to align with project constitution and long-term scalability goals.

---

## Architecture Overview

### Dependency Rule (Fundamental)

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

---

## Layer Responsibilities

### 1. Domain Layer (Core Business Logic)

**Purpose**: Contains pure business entities, value objects, and business rules. Zero external dependencies.

**Key Components**:
- **User Entity**: Aggregate root with business behavior
- **Value Objects**: Email, UserId, Role (immutable types with validation)
- **Domain Services**: Complex business rules spanning multiple entities
- **Repository Interfaces**: Contracts for data persistence (ports)
- **Domain Exceptions**: Business rule violations

**Example**:
```typescript
export class User {
  private constructor(
    private readonly _id: UserId,
    private readonly _email: Email,
    private _name: string,
    private readonly _keycloakId: string,
    private _roles: Role[],
    private _isActive: boolean
  ) {}

  static create(props: CreateUserProps): User {
    // Business validation
  }

  // Business methods
  updateProfile(name: string): void { }
  assignRole(role: Role): void { }
  hasRole(role: Role): boolean { }
}
```

---

### 2. Application Layer (Use Cases & Workflows)

**Purpose**: Orchestrates domain objects to fulfill application-specific use cases. Defines ports for infrastructure.

**Key Components**:
- **Use Cases**: Single-purpose application operations (AuthenticateUser, RefreshTokens, LogoutUser)
- **Port Interfaces**: Contracts for external services (IKeycloakAdapter, ITokenService, ISessionManager)
- **Application DTOs**: Data transfer objects for use case inputs/outputs
- **Application Services**: Cross-cutting application logic
- **Application Exceptions**: Application workflow errors

**Example**:
```typescript
export class AuthenticateUserUseCase {
  constructor(
    private readonly keycloakAdapter: IKeycloakAdapter,
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    // 1. Exchange code with Keycloak
    // 2. Validate token
    // 3. Find or create user
    // 4. Generate app tokens
    // 5. Return result
  }
}
```

---

### 3. Infrastructure Layer (External Concerns)

**Purpose**: Implements interfaces defined by domain/application layers. Handles all framework and external dependencies.

**Key Components**:
- **Keycloak Adapter**: Implements IKeycloakAdapter (OAuth flows, JWT validation)
- **JWT Token Service**: Implements ITokenService (token generation, validation)
- **Prisma Repositories**: Implements IUserRepository (database persistence)
- **Session Manager**: Implements ISessionManager (session tracking)
- **Mappers**: Convert between domain entities and ORM entities
- **Configuration**: Environment-based configuration

**Example**:
```typescript
@Injectable()
export class KeycloakAdapter implements IKeycloakAdapter {
  async exchangeCodeForTokens(code: string, verifier: string): Promise<KeycloakTokens> {
    // HTTP call to Keycloak
  }

  async validateToken(token: string): Promise<KeycloakUserInfo> {
    // JWT validation with JWKS
  }
}
```

---

### 4. Presentation Layer (HTTP Interface)

**Purpose**: Handles HTTP requests, responses, and user interface concerns. NestJS-specific code.

**Key Components**:
- **Controllers**: REST API endpoints (AuthController)
- **Guards**: Authentication/authorization (JwtAuthGuard, RolesGuard)
- **Decorators**: Custom parameter decorators (@CurrentUser, @Roles, @Public)
- **Request/Response DTOs**: HTTP-specific data structures
- **Exception Filters**: HTTP error handling
- **Interceptors**: Cross-cutting concerns (logging, transformation)

**Example**:
```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authenticateUserUseCase: AuthenticateUserUseCase) {}

  @Post('callback')
  async callback(@Body() dto: AuthCallbackDto): Promise<AuthResponse> {
    const result = await this.authenticateUserUseCase.execute({
      authorizationCode: dto.code,
      codeVerifier: dto.codeVerifier
    });
    return result;
  }
}
```

---

## Component Architecture

### Core Use Cases

1. **AuthenticateUserUseCase**
   - Exchange OAuth authorization code for tokens
   - Validate token with Keycloak
   - Create or update user in local database
   - Generate application tokens
   - Create session

2. **RefreshTokensUseCase**
   - Validate refresh token
   - Detect token reuse (security)
   - Generate new token pair
   - Update session with rotation

3. **LogoutUserUseCase**
   - Revoke refresh token
   - Clear session
   - Optionally revoke at Keycloak

4. **ValidateSessionUseCase**
   - Validate access token
   - Check user active status
   - Return user context

---

## Data Flow

### Authentication Flow (OAuth Authorization Code with PKCE)

```
1. Client → GET /auth/login → API
   ↓ Authorization URL + Code Verifier

2. Client → Keycloak Login → User enters credentials
   ↓ Authorization Code

3. Client → POST /auth/callback → API
   ↓ (code, codeVerifier)

4. API → Keycloak → Exchange code for tokens
   ↓ Keycloak tokens

5. API → Validate JWT → Keycloak
   ↓ User info

6. API → Find/Create User → Database
   ↓ User entity

7. API → Generate App Tokens → Internal
   ↓ Access token + Refresh token

8. API → Client
   ↓ Access token (response body)
   ↓ Refresh token (HTTP-only cookie)
```

### Protected Resource Access Flow

```
1. Client → GET /api/protected (Bearer token) → API
   ↓

2. JwtAuthGuard → Extract & Validate Token
   ↓

3. API → Load User → Database
   ↓ User entity

4. RolesGuard → Check Permissions
   ↓

5. Controller → Execute Use Case
   ↓

6. API → Client (Protected data)
```

---

## Module Organization

### File Structure

```
src/auth/
├── domain/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   ├── user.entity.spec.ts
│   │   └── session.entity.ts
│   ├── value-objects/
│   │   ├── email.vo.ts
│   │   ├── user-id.vo.ts
│   │   └── role.vo.ts
│   ├── services/
│   │   ├── user-authorization.service.ts
│   │   └── user-authorization.service.spec.ts
│   ├── repositories/
│   │   └── user.repository.interface.ts
│   └── exceptions/
│       ├── invalid-user.exception.ts
│       └── authorization-failed.exception.ts
│
├── application/
│   ├── use-cases/
│   │   ├── authenticate-user/
│   │   │   ├── authenticate-user.use-case.ts
│   │   │   ├── authenticate-user.use-case.spec.ts
│   │   │   ├── authenticate-user.input.ts
│   │   │   └── authenticate-user.output.ts
│   │   ├── refresh-tokens/
│   │   ├── logout-user/
│   │   └── validate-session/
│   ├── ports/
│   │   ├── keycloak-adapter.interface.ts
│   │   ├── token-service.interface.ts
│   │   └── session-manager.interface.ts
│   ├── services/
│   │   └── user-synchronization.service.ts
│   ├── dto/
│   │   ├── user.dto.ts
│   │   └── token-pair.dto.ts
│   └── exceptions/
│       ├── authentication-failed.exception.ts
│       └── token-expired.exception.ts
│
├── infrastructure/
│   ├── adapters/
│   │   ├── keycloak/
│   │   │   ├── keycloak.adapter.ts
│   │   │   ├── keycloak.adapter.spec.ts
│   │   │   └── keycloak.config.ts
│   │   ├── jwt/
│   │   │   ├── jwt-token.service.ts
│   │   │   └── jwt-validator.service.ts
│   │   └── session/
│   │       └── session-manager.service.ts
│   ├── persistence/
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts
│   │   │   └── schema.prisma
│   │   ├── repositories/
│   │   │   ├── prisma-user.repository.ts
│   │   │   └── prisma-session.repository.ts
│   │   └── entities/
│   │       └── user.orm-entity.ts
│   ├── mappers/
│   │   ├── user.mapper.ts
│   │   └── user.mapper.spec.ts
│   └── config/
│       └── auth.config.ts
│
├── presentation/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── auth.controller.spec.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt-auth.guard.spec.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── public.decorator.ts
│   ├── dto/
│   │   ├── requests/
│   │   │   ├── auth-callback.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   └── responses/
│   │       ├── auth-response.dto.ts
│   │       └── user-response.dto.ts
│   ├── filters/
│   │   └── auth-exception.filter.ts
│   └── interceptors/
│       └── auth-logging.interceptor.ts
│
└── auth.module.ts
```

### NestJS Module Configuration

```typescript
@Module({
  imports: [HttpModule, JwtModule, PrismaModule],
  controllers: [AuthController, UserController],
  providers: [
    // Use cases
    AuthenticateUserUseCase,
    RefreshTokensUseCase,
    LogoutUserUseCase,

    // Infrastructure (implements application ports)
    { provide: 'IKeycloakAdapter', useClass: KeycloakAdapter },
    { provide: 'ITokenService', useClass: JwtTokenService },
    { provide: 'ISessionManager', useClass: SessionManagerService },
    { provide: 'IUserRepository', useClass: PrismaUserRepository },

    // Domain services
    UserAuthorizationService,

    // Guards
    JwtAuthGuard,
    RolesGuard
  ],
  exports: [JwtAuthGuard, RolesGuard, 'IUserRepository']
})
export class AuthModule {}
```

---

## Security Implementation

### 1. Token Management

**Access Tokens**:
- Short-lived: 15 minutes
- JWT format with RS256 signature
- Stored in memory (frontend)
- Transmitted via Authorization header

**Refresh Tokens**:
- Long-lived: 7 days
- Stored in HTTP-only cookies
- Rotation on each use
- Hashed in database

### 2. CSRF Protection

```typescript
// Enable CSRF for state-changing operations
app.use(csurf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
}));
```

### 3. Rate Limiting

```typescript
@Post('callback')
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 requests per minute
async callback() { }
```

### 4. Input Validation

```typescript
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

---

## Testing Strategy

### Testing Pyramid

```
           ┌────────┐
           │  E2E   │ 10-20%
           └────────┘
        ┌──────────────┐
        │ Integration  │ 20-30%
        └──────────────┘
     ┌──────────────────────┐
     │       Unit           │ 50-70%
     └──────────────────────┘
```

### Coverage Targets

| Layer | Target | Focus |
|-------|--------|-------|
| Domain | 90%+ | Business logic |
| Application | 85%+ | Use case orchestration |
| Infrastructure | 70%+ | Integration points |
| Presentation | 80%+ | HTTP handling, guards |

---

## Database Schema (Prisma)

```prisma
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

  refreshTokens RefreshToken[]
  sessions      Session[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
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

---

## API Endpoints

### Authentication Endpoints

```
POST /auth/callback
  Body: { code: string, codeVerifier: string }
  Response: { accessToken: string, user: UserDto }
  Cookies: refreshToken (HTTP-only)

POST /auth/refresh
  Cookies: refreshToken
  Response: { accessToken: string }
  Cookies: new refreshToken (HTTP-only)

POST /auth/logout
  Headers: Authorization: Bearer <token>
  Response: { success: boolean }
  Action: Clear cookies, revoke tokens

GET /auth/me
  Headers: Authorization: Bearer <token>
  Response: { user: UserDto }
```

---

## Dependencies

### Required NPM Packages

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/platform-express": "^10.0.0",
    "@prisma/client": "^5.7.0",
    "axios": "^1.6.2",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "jsonwebtoken": "^9.0.2",
    "jwks-rsa": "^3.1.0",
    "cookie-parser": "^1.4.6",
    "csurf": "^1.11.0"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "prisma": "^5.7.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "keycloak-node-mock": "^2.0.0"
  }
}
```

---

## Environment Configuration

```bash
# Keycloak
KEYCLOAK_URL=https://keycloak.example.com
KEYCLOAK_REALM=my-realm
KEYCLOAK_CLIENT_ID=nest-api
KEYCLOAK_CLIENT_SECRET=<secret>
KEYCLOAK_REDIRECT_URI=http://localhost:3000/auth/callback
KEYCLOAK_ISSUER=https://keycloak.example.com/realms/my-realm

# JWT
ACCESS_TOKEN_SECRET=<256-bit-random-string>
REFRESH_TOKEN_SECRET=<256-bit-random-string>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Security
CSRF_SECRET=<256-bit-random-string>
COOKIE_SECRET=<256-bit-random-string>

# Application
NODE_ENV=development
PORT=3000
```

---

## Success Criteria

### Functional Requirements Met
- Users can log in using Keycloak credentials
- Users can access protected resources after authentication
- Users can maintain sessions without repeated logins
- Users can explicitly log out
- Unauthenticated users are properly blocked

### Non-Functional Requirements Met
- Authentication verification completes within 100ms (95th percentile)
- System supports 100 concurrent users
- Tokens are cryptographically validated
- All authentication failures are logged
- Configuration is environment-based

### Quality Gates
- 85%+ test coverage achieved
- All acceptance tests pass
- No critical security vulnerabilities
- Architecture boundaries respected
- SOLID principles followed

---

## Implementation Phases

### Phase 1: Domain Layer (Foundation)
**Duration**: 2-3 days
- User entity with business methods
- Value objects (Email, UserId, Role)
- Repository interfaces
- Domain services
- Unit tests (90%+ coverage)

### Phase 2: Application Layer (Use Cases)
**Duration**: 3-4 days
- Port interfaces (Keycloak, Token, Session)
- Use cases (Authenticate, Refresh, Logout)
- Application services
- DTOs
- Unit tests (85%+ coverage)

### Phase 3: Infrastructure Layer (Integrations)
**Duration**: 3-4 days
- Keycloak adapter
- JWT token service
- Prisma repositories
- Session manager
- Database migrations
- Integration tests (70%+ coverage)

### Phase 4: Presentation Layer (API)
**Duration**: 2-3 days
- Controllers
- Guards
- Decorators
- Request/Response DTOs
- Exception filters
- Integration tests (80%+ coverage)

### Phase 5: Security & Quality
**Duration**: 2-3 days
- CSRF protection
- Rate limiting
- Security audit
- E2E tests
- Documentation

### Phase 6: Testing & Polish
**Duration**: 2-3 days
- Comprehensive test coverage
- Performance testing
- Load testing (100 concurrent users)
- Documentation completion

### Phase 7: Deployment
**Duration**: 1-2 days
- CI/CD setup
- Staging deployment
- Production deployment
- Monitoring setup

**Total Estimated Duration**: 15-22 days (3-4.5 weeks)

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Keycloak configuration complexity | High | Medium | Detailed documentation, automated setup |
| Performance with many concurrent users | Medium | Low | Load testing early, connection pooling |
| Token refresh complexity | High | Medium | Comprehensive testing, clear error messages |
| Database migration issues | Medium | Low | Test migrations thoroughly, backup strategy |
| CORS configuration issues | Low | Medium | Test with actual frontend early |

---

## References

- Project Constitution: `/specs/constitution.md`
- Feature Specification: `/specs/001-keycloak-auth/spec.md`
- Research Document: `/specs/001-keycloak-auth/research.md`
- Clean Architecture Design: `/specs/001-keycloak-auth/design.clean-architecture.md`

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-09
**Status**: Final - Approved for Implementation
**Next Review**: After Phase 1 completion
