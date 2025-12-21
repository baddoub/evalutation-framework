# Pragmatic Architecture Design: Keycloak OAuth Authentication

**Feature**: Keycloak OAuth Authentication
**Approach**: Pragmatic Balance (Speed + Quality)
**Date**: 2025-12-09
**Status**: Ready for Implementation

---

## Executive Summary

This design prioritizes **pragmatic balance** between Clean Architecture principles and rapid delivery. We leverage NestJS patterns effectively while maintaining essential abstractions for testability and future refactoring. The goal is to deliver working authentication quickly while keeping the door open for architectural evolution.

**Key Philosophy**: Start simple, refactor when complexity demands it. Not all layers need the same level of abstraction from day one.

---

## Simplified Layer Structure

Instead of strict 4-layer Clean Architecture, we use a **3-layer pragmatic approach**:

```
src/
├── auth/                           # Feature module (cohesive unit)
│   ├── domain/                     # Core business logic (minimal)
│   │   ├── user.entity.ts          # Domain model (rich entity)
│   │   └── user-repository.interface.ts  # Essential abstraction
│   │
│   ├── application/                # Use cases (merged with services)
│   │   ├── auth.service.ts         # Main authentication logic
│   │   ├── token.service.ts        # JWT token handling
│   │   └── keycloak.service.ts     # Keycloak integration
│   │
│   ├── infrastructure/             # External concerns
│   │   ├── repositories/
│   │   │   └── prisma-user.repository.ts
│   │   └── entities/
│   │       └── user.schema.prisma  # Prisma schema
│   │
│   ├── api/                        # HTTP layer
│   │   ├── auth.controller.ts      # REST endpoints
│   │   ├── dto/                    # Request/Response DTOs
│   │   ├── guards/                 # Auth guards
│   │   └── decorators/             # Custom decorators
│   │
│   └── auth.module.ts              # NestJS module config
│
└── shared/                         # Cross-cutting concerns
    ├── config/                     # Configuration
    ├── exceptions/                 # Custom exceptions
    └── utils/                      # Helpers
```

### Why This Structure?

1. **Feature-based organization**: All auth code in one place
2. **Clear boundaries**: Domain, application, infrastructure, API
3. **Less boilerplate**: Merged use cases with services
4. **NestJS-friendly**: Works naturally with dependency injection
5. **Room to grow**: Can split services into use cases later

---

## Key Components and Responsibilities

### 1. Domain Layer (Minimal but Rich)

**Purpose**: Core business entities and essential abstractions

**Components**:

```typescript
// domain/user.entity.ts
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

  static create(props: CreateUserProps): User {
    // Validation and creation logic
  }

  // Business logic methods
  updateName(name: string): void { }
  deactivate(): void { }
  hasRole(role: string): boolean { }
  hasAnyRole(roles: string[]): boolean { }
}
```

**Key Decision**: Rich domain model with behavior, not anemic data containers.

**Repository Interface** (only essential abstraction):

```typescript
// domain/user-repository.interface.ts
export interface IUserRepository {
  findByKeycloakId(keycloakId: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
```

**Why minimal?**: Only abstract what we need to test and swap. Don't create interfaces for everything.

---

### 2. Application Layer (Services-based)

**Purpose**: Orchestrate business logic and external integrations

**Key Services**:

#### A. AuthService (Main Orchestrator)

```typescript
@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository') private userRepository: IUserRepository,
    private keycloakService: KeycloakService,
    private tokenService: TokenService,
  ) {}

  async authenticateUser(code: string, codeVerifier: string) {
    // 1. Exchange code for tokens with Keycloak
    // 2. Validate token
    // 3. Find or create user
    // 4. Generate app tokens
    // 5. Return result
  }

  async refreshTokens(refreshToken: string) { }
  async logout(userId: string) { }
}
```

**Why this approach?**:
- Single service for auth logic (not split into multiple use cases yet)
- Can refactor into use cases later when complexity grows
- Easier to understand and maintain initially

#### B. KeycloakService (Integration)

```typescript
@Injectable()
export class KeycloakService {
  async exchangeCodeForTokens(code: string, verifier: string) { }
  async validateToken(token: string) { }
  async refreshTokens(refreshToken: string) { }
  async revokeToken(token: string) { }
}
```

**Why separate service?**: Isolate Keycloak integration for testing and potential replacement.

#### C. TokenService (JWT Handling)

```typescript
@Injectable()
export class TokenService {
  generateAccessToken(userId: string, roles: string[]) { }
  generateRefreshToken(userId: string) { }
  validateAccessToken(token: string) { }
  validateRefreshToken(token: string) { }
}
```

**Why separate?**: Token logic is complex enough to warrant its own service.

---

### 3. Infrastructure Layer (Implementation Details)

**Purpose**: Concrete implementations of repositories and external adapters

#### A. Prisma User Repository

```typescript
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { keycloakId },
    });
    return user ? this.toDomain(user) : null;
  }

  async save(user: User): Promise<User> {
    // Upsert logic
  }

  private toDomain(prismaUser: PrismaUser): User {
    // Map Prisma model to domain entity
  }
}
```

**Key Decision**: Keep mapping logic in repository (not a separate mapper class yet).

#### B. Prisma Schema (Simple)

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

  @@map("users")
}
```

**Why Prisma?**:
- Type-safe, fast, great DX
- Built-in migrations
- Less boilerplate than TypeORM

---

### 4. API Layer (Controllers & Guards)

#### A. Auth Controller (Simple REST endpoints)

```typescript
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
  ) {}

  @Post('callback')
  async callback(
    @Body() dto: AuthCallbackDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.authenticateUser(
      dto.code,
      dto.codeVerifier,
    );

    this.cookieService.setRefreshToken(response, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: { id: result.user.id, email: result.user.email },
    };
  }

  @Post('refresh')
  async refresh(@Req() request, @Res() response) { }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user) { }
}
```

**Key Decision**: Keep controllers thin - delegate to services immediately.

#### B. JWT Auth Guard (Simple)

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.tokenService.validateAccessToken(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

**Why simple?**: Guard logic is straightforward - no need for complex abstractions yet.

---

## Where We Leverage NestJS Directly

### 1. Dependency Injection (Full Usage)

```typescript
// auth.module.ts
@Module({
  imports: [HttpModule, PrismaModule],
  providers: [
    // Services
    AuthService,
    KeycloakService,
    TokenService,
    CookieService,

    // Repository
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },

    // Guards
    JwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
```

**Benefit**: NestJS DI handles all wiring - no manual injection containers.

### 2. Guards for Authentication

Use NestJS guards instead of custom middleware:

```typescript
@Get('protected')
@UseGuards(JwtAuthGuard)
async protectedRoute(@CurrentUser() user: User) {
  return { message: 'Protected data', user };
}
```

**Benefit**: Declarative, testable, composable.

### 3. Decorators for User Context

```typescript
// Custom decorator
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Benefit**: Clean controller signatures.

### 4. Exception Filters (NestJS Built-in)

```typescript
// Use NestJS exceptions directly
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Insufficient permissions');
```

**Benefit**: Consistent error responses out of the box.

### 5. Config Module

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        KEYCLOAK_URL: Joi.string().required(),
        KEYCLOAK_REALM: Joi.string().required(),
        // ... other validations
      }),
    }),
  ],
})
```

**Benefit**: Environment-based config with validation.

---

## Essential vs Nice-to-Have Abstractions

### Essential Abstractions (Must Have)

1. **User Repository Interface**
   - Why: Need to mock for testing
   - Why: Might switch from Prisma to TypeORM
   - Cost: Low (1 interface, 1 implementation)

2. **Domain Entity (User)**
   - Why: Business logic should live in domain
   - Why: Separates business rules from persistence
   - Cost: Medium (rich entity with methods)

3. **Service Layer (AuthService, TokenService)**
   - Why: Keep business logic out of controllers
   - Why: Testable without HTTP layer
   - Cost: Medium (3-4 services)

### Nice-to-Have (Defer Until Needed)

1. **Use Cases instead of Services**
   - When: Services grow beyond 300 lines
   - When: Need CQRS pattern
   - Current: Services are good enough

2. **Separate Mapper Classes**
   - When: Mapping logic becomes complex
   - Current: Keep in repositories

3. **Domain Services**
   - When: Business logic spans multiple entities
   - Current: Put logic in User entity

4. **Value Objects**
   - When: Need immutable complex types (Email, Password)
   - Current: Use strings with validation

5. **CQRS / Event Sourcing**
   - When: Complex read/write patterns emerge
   - Current: Simple CRUD is fine

6. **Separate DTOs for each endpoint**
   - When: Request/response shapes diverge significantly
   - Current: Reuse DTOs where sensible

---

## Trade-offs and Future Considerations

### Trade-offs Made

| Decision | Benefit | Cost | Mitigation |
|----------|---------|------|------------|
| Services instead of Use Cases | Faster development, less files | Harder to test individual operations | Refactor when services exceed 300 lines |
| Mappers in repositories | Less boilerplate | Harder to reuse mapping logic | Extract mappers when needed elsewhere |
| Simple domain model | Less abstraction overhead | Domain logic might leak to services | Keep domain entity rich with behavior |
| Direct Keycloak integration | Faster to implement | Harder to swap providers | KeycloakService isolates integration |
| HTTP-only cookies | Security + simplicity | Frontend complexity for refresh | Provide clear API docs |

### When to Refactor

**From Services to Use Cases**:
```
Trigger: Service exceeds 300 lines or has >5 public methods
Action: Extract each operation into separate use case
Effort: 1-2 days per service
```

**From Anemic to Rich Domain**:
```
Trigger: Business logic in services should be in domain
Action: Move logic from services to domain entities
Effort: Ongoing refactoring
```

**From Monolith to Modular**:
```
Trigger: Auth module used by multiple apps
Action: Extract to shared package/microservice
Effort: 1 week
```

### Future Evolution Path

```
Phase 1 (Current): Pragmatic 3-layer
  ↓
Phase 2: Introduce use cases when complexity grows
  ↓
Phase 3: Add CQRS if read/write patterns diverge
  ↓
Phase 4: Extract to microservice if needed
```

---

## Quick-Win Testing Strategy

### Prioritized Testing Approach

**Level 1: Service Layer Tests (Highest ROI)**

```typescript
describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockKeycloakService: jest.Mocked<KeycloakService>;
  let mockTokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockKeycloakService = createMockKeycloakService();
    mockTokenService = createMockTokenService();

    authService = new AuthService(
      mockUserRepository,
      mockKeycloakService,
      mockTokenService,
    );
  });

  it('should create new user on first login', async () => {
    // Arrange: Mock Keycloak returning user data
    // Act: Authenticate
    // Assert: User saved to repository
  });
});
```

**Why start here?**:
- Tests business logic (most important)
- No HTTP or DB needed (fast)
- Easy to write and maintain

**Level 2: Integration Tests (Medium ROI)**

```typescript
describe('Auth Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule, TestDatabaseModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    prisma = module.get(PrismaService);
  });

  it('should authenticate and store user', async () => {
    // Test with real database (SQLite in-memory)
    // Mock Keycloak service only
  });
});
```

**Why next?**: Tests integration between layers without external dependencies.

**Level 3: E2E Tests (Nice to Have)**

```typescript
describe('Auth E2E', () => {
  it('should complete full OAuth flow', async () => {
    // Full flow with Keycloak mock
  });
});
```

**Why last?**: Slowest, most brittle. Use sparingly for critical paths only.

### Testing Coverage Goals (Pragmatic)

- **Services**: 90%+ coverage (easy to achieve)
- **Controllers**: 70%+ coverage (mostly integration tests)
- **Repositories**: 80%+ coverage (integration tests with test DB)
- **Guards**: 90%+ coverage (unit tests)
- **E2E**: Critical paths only (login, refresh, logout)

### What NOT to Test (Initially)

1. **Trivial DTOs**: No logic to test
2. **Prisma queries**: Trust Prisma (test integration instead)
3. **NestJS framework code**: Already tested by NestJS
4. **Simple decorators**: Low risk, high test maintenance

---

## Implementation Sequence

### Phase 1: Foundation (Days 1-2)

```
□ Set up NestJS project
□ Install Prisma + PostgreSQL
□ Create Prisma schema (User model)
□ Set up environment config
□ Create auth module structure
```

**Deliverable**: Project skeleton with database ready.

### Phase 2: Domain + Repository (Days 3-4)

```
□ Create User domain entity
□ Define IUserRepository interface
□ Implement PrismaUserRepository
□ Write repository tests
□ Run migrations
```

**Deliverable**: User persistence working with tests.

### Phase 3: Keycloak Integration (Days 5-6)

```
□ Create KeycloakService
□ Implement OAuth code exchange
□ Implement token validation (JWKS)
□ Write service tests (mocked HTTP)
```

**Deliverable**: Keycloak integration working.

### Phase 4: Token Management (Day 7)

```
□ Create TokenService
□ JWT generation (access + refresh)
□ Token validation logic
□ HTTP-only cookie handling
□ Write token tests
```

**Deliverable**: Token flow working.

### Phase 5: Auth Service (Days 8-9)

```
□ Create AuthService
□ Implement authenticateUser
□ Implement refreshTokens
□ Implement logout
□ Write comprehensive service tests
```

**Deliverable**: Core auth logic complete.

### Phase 6: API Layer (Days 10-11)

```
□ Create AuthController
□ Implement DTOs
□ Create JwtAuthGuard
□ Create @CurrentUser decorator
□ Write integration tests
```

**Deliverable**: REST API working end-to-end.

### Phase 7: Security & Polish (Day 12)

```
□ Add CSRF protection
□ Configure CORS
□ Add rate limiting
□ Security audit
□ Write E2E tests
□ Documentation
```

**Deliverable**: Production-ready authentication.

---

## Module Dependencies

```
auth.module.ts
├── depends on: HttpModule (for Keycloak HTTP calls)
├── depends on: PrismaModule (for database)
├── depends on: ConfigModule (for environment variables)
└── exports: AuthService, JwtAuthGuard (for use in other modules)

Other modules use auth like this:
@Module({
  imports: [AuthModule],
  controllers: [ProjectsController],
})
class ProjectsModule {
  // Use @UseGuards(JwtAuthGuard) in controllers
}
```

---

## Configuration Schema

```typescript
// config/auth.config.ts
export const authConfig = () => ({
  keycloak: {
    url: process.env.KEYCLOAK_URL,
    realm: process.env.KEYCLOAK_REALM,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  },
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },
});

// Validation schema (Joi)
Joi.object({
  KEYCLOAK_URL: Joi.string().uri().required(),
  KEYCLOAK_REALM: Joi.string().required(),
  KEYCLOAK_CLIENT_ID: Joi.string().required(),
  KEYCLOAK_CLIENT_SECRET: Joi.string().required(),
  ACCESS_TOKEN_SECRET: Joi.string().min(32).required(),
  REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
})
```

---

## API Endpoints Summary

```
POST /auth/callback
  Body: { code, codeVerifier }
  Response: { accessToken, user }
  Cookies: refreshToken (HTTP-only)

POST /auth/refresh
  Cookies: refreshToken
  Response: { accessToken }
  Cookies: new refreshToken (HTTP-only)

POST /auth/logout
  Headers: Authorization: Bearer <token>
  Response: { success: true }
  Action: Clear cookies, revoke tokens

GET /auth/me
  Headers: Authorization: Bearer <token>
  Response: { user }
```

---

## Success Metrics

### Development Speed
- **Target**: Feature complete in 12 days (2 weeks)
- **Measure**: All user stories pass acceptance tests

### Code Quality
- **Target**: 85%+ test coverage
- **Target**: No critical security vulnerabilities
- **Target**: Clean code linting passes

### Maintainability
- **Target**: New developer can understand code in < 2 hours
- **Target**: Can add new auth provider in < 2 days
- **Target**: Can refactor to use cases in < 1 week

### Performance
- **Target**: Auth validation < 100ms (95th percentile)
- **Target**: Login flow < 5 seconds end-to-end
- **Target**: Support 100 concurrent logins

---

## Conclusion

This pragmatic architecture balances:

- **Clean Architecture principles** (domain isolation, dependency inversion)
- **NestJS best practices** (DI, guards, modules)
- **Development speed** (fewer abstractions initially)
- **Future flexibility** (clear refactoring path)

**Philosophy**: Start simple, refactor when needed. Not every project needs full Clean Architecture from day one. Build the complexity you need, not the complexity you might need.

**Next Steps**:
1. Review and approve this design
2. Set up project skeleton
3. Begin Phase 1 implementation
4. Write tests first (TDD)

---

**Approved By**: _____________
**Date**: _____________
