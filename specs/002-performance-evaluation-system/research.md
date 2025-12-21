# Research: Performance Evaluation System

**Feature ID**: 002
**Date**: 2025-12-12
**Research Phase**: Codebase Analysis & Technical Discovery

---

## 1. Codebase Architecture Analysis

### Existing Module Structure

The application follows **Clean Architecture** with strict layer separation:

```
src/
├── auth/                          # Reference module for Feature 002
│   ├── domain/                    # Entities, value objects, repositories (interfaces)
│   ├── application/               # Use cases, DTOs, application services
│   ├── infrastructure/            # Persistence, adapters, external services
│   └── presentation/              # Controllers, guards, filters, DTOs
├── common/                        # Shared utilities
├── config/                        # Environment configuration
└── main.ts
```

### Key Architectural Patterns to Follow

#### A. Dependency Inversion Pattern
```typescript
// Domain layer defines interface
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>
  save(user: User): Promise<User>
}

// Infrastructure implements
@Injectable()
export class PrismaUserRepository implements IUserRepository { ... }

// Module binds implementation
{
  provide: 'IUserRepository',
  useClass: PrismaUserRepository,
}

// Use case injects via interface token
constructor(
  @Inject('IUserRepository') private userRepository: IUserRepository
) {}
```

#### B. Entity & Value Object Pattern
- **Entities**: Have identity (User, RefreshToken, Session)
- **Value Objects**: No identity, immutable (UserId, Email, Role)
- Factory methods for validation (`User.create()`, `UserId.fromString()`)
- Business logic in entities

#### C. Mapper Pattern
Separate mappers for each entity to convert between layers:
```typescript
export class UserMapper {
  static toDomain(prismaUser: PrismaUser): User { ... }
  static toOrmData(domainUser: User): Omit<PrismaUser, 'id'> { ... }
}
```

#### D. Use Case Pattern
Each business flow is a separate use case service:
```typescript
@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    @Inject('IKeycloakAdapter') private keycloak: IKeycloakAdapter,
    @Inject('ITokenService') private tokenService: ITokenService,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    // Orchestrate business logic
  }
}
```

---

## 2. Database Patterns (Prisma)

### Current Schema Conventions

```prisma
model User {
  id         String   @id @default(uuid())   // UUID primary keys
  email      String   @unique                 // Unique constraints
  keycloakId String   @unique
  roles      String[] @default(["user"])      // Array fields for multi-value
  isActive   Boolean  @default(true)          // Soft activation
  createdAt  DateTime @default(now())         // Automatic timestamps
  updatedAt  DateTime @updatedAt
  deletedAt  DateTime?                        // Soft deletes

  // Relations
  refreshTokens RefreshToken[]
  sessions      Session[]
}
```

### Patterns Identified

1. **UUID Primary Keys**: All entities use `@id @default(uuid())`
2. **Soft Deletes**: `deletedAt` timestamp field
3. **Timestamps**: Auto `createdAt`, `updatedAt` on all entities
4. **Cascading Deletes**: `onDelete: Cascade` for dependent entities
5. **Unique Constraints**: Critical fields marked `@unique`
6. **Indexes**: Foreign keys automatically indexed
7. **Array Fields**: Use `String[]` for multi-value columns (roles)

### Repository Implementation Pattern

```typescript
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async save(user: User): Promise<User> {
    const ormData = UserMapper.toOrmData(user)
    const savedUser = await this.prisma.user.upsert({
      where: { id: user.id.value },
      create: { id: user.id.value, ...ormData },
      update: ormData,
    })
    return UserMapper.toDomain(savedUser)
  }

  // Soft delete filter on queries
  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findFirst({
      where: { keycloakId, deletedAt: null },
    })
    return prismaUser ? UserMapper.toDomain(prismaUser) : null
  }
}
```

---

## 3. NestJS Integration Patterns

### Module Organization

```typescript
@Module({
  imports: [
    PrismaModule,           // Database access
    JwtModule,              // JWT utilities
    ThrottlerModule,        // Rate limiting
  ],
  controllers: [AuthController],
  providers: [
    // Use Cases
    AuthenticateUserUseCase,
    RefreshTokensUseCase,

    // Repository Bindings
    { provide: 'IUserRepository', useClass: PrismaUserRepository },
    { provide: 'ISessionRepository', useClass: PrismaSessionRepository },

    // Service Bindings
    { provide: 'ITokenService', useClass: JwtTokenService },
    { provide: 'IKeycloakAdapter', useClass: KeycloakAdapter },

    // Guards/Filters/Interceptors (must be in providers before APP_* use)
    JwtAuthGuard,
    AuthExceptionFilter,
    AuthLoggingInterceptor,

    // Global Providers
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AuthExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: AuthLoggingInterceptor },
  ],
  exports: [
    'IUserRepository',      // Export for other modules
    'ITokenService',
    JwtAuthGuard,
  ],
})
export class AuthModule {}
```

### Controller Pattern

```typescript
@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
  ) {}

  @Public()  // Custom decorator to bypass JwtAuthGuard
  @Post('callback')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Handle OAuth callback' })
  async handleCallback(
    @Body() dto: AuthCallbackDto
  ): Promise<AuthResponseDto> {
    const result = await this.authenticateUserUseCase.execute({
      code: dto.code,
      codeVerifier: dto.codeVerifier,
    })
    return { accessToken: result.accessToken, ... }
  }
}
```

### DTO Validation Pattern

```typescript
// Request DTO with validation
export class AuthCallbackDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Authorization code from Keycloak' })
  code!: string

  @IsString()
  @ApiProperty({ description: 'PKCE code verifier' })
  codeVerifier!: string
}

// Response DTO with Swagger annotations
export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string
}
```

### Guard & Security Pattern

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('ITokenService') private readonly tokenService: ITokenService,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    // Extract and validate token
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)
    if (!token) throw new UnauthorizedException('No token provided')

    // Validate and attach user to request
    const payload = await this.tokenService.validateToken(token)
    const user = await this.userRepository.findById(UserId.fromString(payload.sub))
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid user')

    request['user'] = user
    return true
  }
}
```

### Exception Handling Pattern

```typescript
// Domain/Application exceptions
export class UserNotFoundException extends ApplicationException {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`)
  }
}

// Exception filter
@Catch(BaseException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: BaseException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const statusCode = this.mapExceptionToHttpStatus(exception)

    response.status(statusCode).json({
      statusCode,
      message: exception.message,
      timestamp: new Date().toISOString(),
    })
  }
}
```

---

## 4. User Management Integration

### Existing User Entity

```typescript
export class User {
  private _id: UserId
  private _email: Email
  private _name: string
  private _keycloakId: string
  private _roles: Role[]
  private _isActive: boolean
  private _createdAt: Date
  private _updatedAt: Date
  private _deletedAt?: Date

  // Methods for performance review integration:
  hasRole(role: Role): boolean
  hasAnyRole(roles: Role[]): boolean
  assignRole(role: Role): void
}
```

### User Extensions Needed for Performance Reviews

The current User entity will need extension to support:

1. **Manager Hierarchy**:
   - Add `managerId` field to User (self-referential foreign key)
   - Add `reports` relation (User[])
   - Domain methods: `getManager()`, `getDirectReports()`, `isManagerOf(user)`

2. **Organization Structure**:
   - Add `departmentId` or `department` field
   - Add `level` field (Junior, Mid, Senior, Lead, Manager)
   - Domain method: `getLevel()` for weight calculation

3. **Role Extensions**:
   - Add roles: `REVIEWER`, `CALIBRATOR`, `HR_ADMIN`
   - Keep existing: `USER`, `ADMIN`

### Proposed User Schema Extension

```prisma
model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String
  keycloakId String   @unique
  roles      String[] @default(["USER"])
  isActive   Boolean  @default(true)

  // NEW: Performance review fields
  level        String?  // Junior, Mid, Senior, Lead, Manager
  department   String?
  managerId    String?
  manager      User?    @relation("ManagerReports", fields: [managerId], references: [id])
  reports      User[]   @relation("ManagerReports")

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  deletedAt  DateTime?

  // Existing relations
  refreshTokens RefreshToken[]
  sessions      Session[]

  // NEW: Performance review relations
  selfReviews         SelfReview[]
  peerFeedbackGiven   PeerFeedback[] @relation("ReviewerFeedback")
  peerFeedbackReceived PeerFeedback[] @relation("RevieweeFeedback")
  managerEvaluations  ManagerEvaluation[] @relation("ManagerEvaluations")
  employeeEvaluations ManagerEvaluation[] @relation("EmployeeEvaluations")
  finalScores         FinalScore[]
}
```

---

## 5. Proposed Domain Model for Performance Reviews

### Entities & Value Objects

#### Entities (have identity)
1. **ReviewCycle**: Annual review period
2. **SelfReview**: Engineer's self-assessment
3. **PeerNomination**: Nominated peer reviewers
4. **PeerFeedback**: Peer's evaluation
5. **ManagerEvaluation**: Manager's evaluation
6. **CalibrationSession**: Calibration meeting
7. **CalibrationAdjustment**: Score adjustments from calibration
8. **FinalScore**: Calculated final evaluation

#### Value Objects (no identity, immutable)
1. **ReviewCycleId**: UUID
2. **SelfReviewId**: UUID
3. **PeerFeedbackId**: UUID
4. **ManagerEvaluationId**: UUID
5. **CalibrationSessionId**: UUID
6. **FinalScoreId**: UUID
7. **EngineerLevel**: Enum (Junior, Mid, Senior, Lead, Manager)
8. **ReviewStatus**: Enum (Draft, Submitted, Calibrated, Completed)
9. **PillarScore**: Score (0-4) with validation
10. **PillarScores**: Collection of 5 pillar scores
11. **WeightedScore**: Calculated score (0-4 float)
12. **BonusTier**: Enum (Exceeds, Meets, Below)
13. **ReviewPhase**: Enum (SelfReview, PeerFeedback, ManagerEval, Calibration, Delivery)

### Aggregates

**ReviewCycle Aggregate Root**:
- Owns lifecycle of entire review cycle
- Enforces phase transitions
- Validates deadlines

**EmployeeReview Aggregate Root**:
- Aggregates all review data for one employee in one cycle
- Contains: SelfReview, PeerFeedback[], ManagerEvaluation, FinalScore
- Enforces business rules (e.g., can't submit manager eval before peer feedback)
- Calculates weighted scores

---

## 6. Critical Business Logic Patterns

### A. Weighted Score Calculation

```typescript
export class PillarWeights {
  private static readonly WEIGHTS_BY_LEVEL: Record<EngineerLevel, Record<Pillar, number>> = {
    JUNIOR: {
      PROJECT_IMPACT: 0.20,
      DIRECTION: 0.10,
      ENGINEERING_EXCELLENCE: 0.25,
      OPERATIONAL_OWNERSHIP: 0.20,
      PEOPLE_IMPACT: 0.25,
    },
    MID: {
      PROJECT_IMPACT: 0.25,
      DIRECTION: 0.15,
      ENGINEERING_EXCELLENCE: 0.25,
      OPERATIONAL_OWNERSHIP: 0.20,
      PEOPLE_IMPACT: 0.15,
    },
    // ... other levels
  }

  static getWeightsForLevel(level: EngineerLevel): Record<Pillar, number> {
    return this.WEIGHTS_BY_LEVEL[level]
  }

  static calculateWeightedScore(
    pillarScores: PillarScores,
    level: EngineerLevel
  ): WeightedScore {
    const weights = this.getWeightsForLevel(level)
    let total = 0

    for (const [pillar, score] of Object.entries(pillarScores.toObject())) {
      total += score * weights[pillar]
    }

    return WeightedScore.fromValue(total)
  }
}
```

### B. Peer Feedback Aggregation

```typescript
export class PeerFeedbackAggregator {
  static aggregateScores(feedbacks: PeerFeedback[]): PillarScores {
    if (feedbacks.length === 0) {
      throw new NoPeerFeedbackException()
    }

    const pillarAverages = {
      PROJECT_IMPACT: 0,
      DIRECTION: 0,
      ENGINEERING_EXCELLENCE: 0,
      OPERATIONAL_OWNERSHIP: 0,
      PEOPLE_IMPACT: 0,
    }

    for (const feedback of feedbacks) {
      const scores = feedback.pillarScores.toObject()
      for (const [pillar, score] of Object.entries(scores)) {
        pillarAverages[pillar] += score
      }
    }

    // Calculate averages
    for (const pillar of Object.keys(pillarAverages)) {
      pillarAverages[pillar] = Math.round(
        pillarAverages[pillar] / feedbacks.length
      )
    }

    return PillarScores.fromObject(pillarAverages)
  }
}
```

### C. Review Authorization Logic

```typescript
export class ReviewAuthorizationService {
  canViewReview(user: User, review: EmployeeReview): boolean {
    // Employee can view their own review
    if (review.employeeId.equals(user.id)) return true

    // Manager can view reports' reviews
    if (user.isManagerOf(review.employee)) return true

    // HR admin can view all
    if (user.hasRole(Role.HR_ADMIN)) return true

    // Calibrators can view reviews in their department
    if (user.hasRole(Role.CALIBRATOR) &&
        user.department === review.employee.department) return true

    return false
  }

  canSubmitPeerFeedback(user: User, revieweeId: UserId): boolean {
    // Cannot review self
    if (revieweeId.equals(user.id)) return false

    // Cannot review manager (bidirectional feedback not allowed in V1)
    if (user.isManagerOf(revieweeId)) return false

    return true
  }
}
```

---

## 7. Technical Unknowns & Research Needed

### A. Complex Validation Requirements

**Question**: How to enforce 1000-word limit on self-review narrative?

**Options**:
1. Client-side validation only (not secure)
2. Server-side character count validation
3. Server-side word count validation (split by whitespace)
4. Custom class-validator decorator `@MaxWords(1000)`

**Recommendation**: Option 4 - Custom decorator for reusability

```typescript
export function MaxWords(maxWords: number) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'maxWords',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxWords],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false
          const wordCount = value.trim().split(/\s+/).length
          return wordCount <= args.constraints[0]
        },
        defaultMessage(args: ValidationArguments) {
          return `Text must not exceed ${args.constraints[0]} words`
        },
      },
    })
  }
}
```

### B. Aggregation Queries

**Question**: How to efficiently query all review data for an employee?

**Options**:
1. Multiple repository calls (N+1 query problem)
2. Single Prisma query with nested includes
3. Create database view for aggregated data
4. Implement query object pattern with optimized joins

**Recommendation**: Option 2 with selective includes based on use case

```typescript
async findEmployeeReview(employeeId: string, cycleId: string) {
  return this.prisma.user.findUnique({
    where: { id: employeeId },
    include: {
      selfReviews: {
        where: { cycleId },
      },
      peerFeedbackReceived: {
        where: { cycleId },
        include: {
          reviewer: {
            select: { id: true, name: true },  // Limited fields
          },
        },
      },
      employeeEvaluations: {
        where: { cycleId },
        include: {
          manager: {
            select: { id: true, name: true },
          },
        },
      },
      finalScores: {
        where: { cycleId },
      },
    },
  })
}
```

### C. Transaction Management

**Question**: Calibration session updates multiple evaluations - how to ensure atomicity?

**Answer**: Use Prisma transactions

```typescript
async applyCalibratio nAdjustments(
  sessionId: string,
  adjustments: CalibrationAdjustment[]
): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    for (const adjustment of adjustments) {
      // Update manager evaluation score
      await tx.managerEvaluation.update({
        where: { id: adjustment.evaluationId },
        data: { pillarScores: adjustment.adjustedScores },
      })

      // Record adjustment
      await tx.calibrationAdjustment.create({
        data: {
          sessionId,
          evaluationId: adjustment.evaluationId,
          originalScore: adjustment.originalScore,
          adjustedScore: adjustment.adjustedScore,
          justification: adjustment.justification,
        },
      })

      // Recalculate final score
      await tx.finalScore.update({
        where: {
          userId: adjustment.userId,
          cycleId: adjustment.cycleId,
        },
        data: {
          weightedScore: adjustment.newWeightedScore,
          percentageScore: adjustment.newPercentageScore,
          bonusTier: adjustment.newBonusTier,
        },
      })
    }
  })
}
```

### D. Role-Based Access Control

**Question**: How to implement fine-grained RBAC for different review phases?

**Options**:
1. Multiple guards per endpoint (`@UseGuards(IsManagerGuard, ReviewPhaseGuard)`)
2. Single flexible guard with metadata (`@RequiresRole('MANAGER')`, `@ReviewPhase('CALIBRATION')`)
3. Domain service injected into guard (authorization logic in domain)
4. CASL library for attribute-based access control

**Recommendation**: Option 3 - Keep auth logic in domain layer

```typescript
@Injectable()
export class ReviewAuthorizationGuard implements CanActivate {
  constructor(
    @Inject('IReviewAuthorizationService')
    private authService: IReviewAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user: User = request.user
    const reviewId = request.params.reviewId

    const review = await this.reviewRepository.findById(reviewId)
    if (!review) throw new NotFoundException()

    // Delegate to domain service
    if (!this.authService.canViewReview(user, review)) {
      throw new ForbiddenException('Not authorized to view this review')
    }

    return true
  }
}
```

---

## 8. External Dependencies

### Required
- **Prisma**: Already in use for database ORM
- **class-validator**: Already in use for DTO validation
- **class-transformer**: Already in use for DTO transformation
- **@nestjs/swagger**: Already in use for API docs

### Optional/Future
- **@nestjs/schedule**: For automated review cycle phase transitions (cron jobs)
- **@nestjs/bull**: For async job processing (email notifications, score calculations)
- **@casl/ability**: For advanced RBAC (if domain service approach insufficient)

### Email Notifications
Currently no email service exists. Will need to implement:
- Port interface: `INotificationService`
- Adapter: Email provider (SendGrid, AWS SES, NodeMailer)
- Templates for: review deadlines, peer feedback requests, calibration reminders

---

## 9. Module Dependency Map

```
PerformanceReviewsModule
├── imports
│   ├── PrismaModule (database access)
│   ├── AuthModule (user repository, guards)
│   ├── ConfigModule (environment config)
│   └── NotificationModule (NEW - email service)
├── providers
│   ├── Use Cases (15-20 use cases)
│   ├── Repositories (8 repositories)
│   ├── Services (calculation, authorization)
│   └── Guards/Filters
└── exports
    └── Review services (for future integrations)
```

---

## 10. Testing Strategy

### Unit Tests
- Domain entities (validation, state transitions)
- Value objects (immutability, equality)
- Use cases (mocked dependencies)
- Calculation logic (weighted scores, aggregations)

### Integration Tests
- Repository implementations with test database
- Controller endpoints with mocked use cases
- Guard behavior with mocked auth

### E2E Tests
- Full review cycle workflow
- Authorization scenarios
- Calibration session flow

---

## 11. Open Technical Questions

1. **Performance**: With 500 engineers, 5 peers each = 2,500 peer feedback records per cycle. Will Prisma queries handle this efficiently?
   - **Action**: Create performance benchmarks during implementation

2. **Concurrency**: What happens if two calibrators adjust the same evaluation simultaneously?
   - **Action**: Implement optimistic locking with version field

3. **Data Retention**: How long to keep historical review data? Soft delete or hard delete after N years?
   - **Action**: Needs business clarification (add to questions)

4. **Audit Trail**: Should all score changes be logged for compliance?
   - **Action**: Needs business clarification (add to questions)

5. **Real-time Updates**: Should managers see live peer feedback submissions or only after deadline?
   - **Action**: Needs business clarification (add to questions)

---

## 12. Architectural Decision Records

### ADR-001: Use Clean Architecture for Performance Reviews

**Context**: Need to implement complex business logic for review cycles.

**Decision**: Follow existing auth module's Clean Architecture pattern with domain/application/infrastructure/presentation layers.

**Rationale**:
- Consistency with existing codebase
- Testability (can test domain logic without database)
- Maintainability (clear separation of concerns)
- Constitution requirement (non-negotiable)

**Consequences**:
- More boilerplate code
- Steeper learning curve for new developers
- Better long-term maintainability

### ADR-002: Single Module vs Multiple Modules

**Context**: Performance review system has 8-10 entities and complex workflows.

**Decision**: Implement as a single `PerformanceReviewsModule` with internal subdirectories for logical grouping.

**Rationale**:
- High cohesion - all entities work together in review workflows
- Simpler dependency management
- Easier to understand as single bounded context
- Can refactor to multiple modules later if needed

**Consequences**:
- Larger module file
- Requires discipline to maintain internal organization

### ADR-003: Aggregate Roots

**Context**: Multiple related entities (SelfReview, PeerFeedback, ManagerEvaluation, FinalScore).

**Decision**: Use `ReviewCycle` and `EmployeeReview` as aggregate roots.

**Rationale**:
- ReviewCycle owns lifecycle of entire review period
- EmployeeReview owns all review data for one employee in one cycle
- Enforces invariants (e.g., can't skip review phases)
- Clear transaction boundaries

**Consequences**:
- Need to load entire aggregate for some operations (may impact performance)
- Can optimize with CQRS pattern later if needed

---

## Summary

The existing codebase provides excellent architectural patterns to follow:

**Strengths to Leverage:**
- ✅ Clean Architecture implementation
- ✅ Strong typing with value objects
- ✅ Repository pattern with Prisma
- ✅ Use case pattern for business flows
- ✅ Guard-based authorization
- ✅ Exception hierarchy
- ✅ Soft deletes and audit timestamps

**Gaps to Address:**
- ❌ No email notification system (need to build)
- ❌ No scheduled jobs (need for phase transitions)
- ❌ No complex aggregation examples (need to design)
- ❌ User entity lacks manager hierarchy (need to extend)

**Next Steps:**
1. Clarify open business questions
2. Design detailed data model
3. Design API contracts
4. Create implementation plan with task breakdown
