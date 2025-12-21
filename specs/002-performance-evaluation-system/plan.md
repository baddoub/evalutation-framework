# Implementation Plan: Performance Evaluation System

**Branch**: `feature/002-performance-evaluation-system` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-performance-evaluation-system/spec.md`

---

## Summary

Build a comprehensive web-based performance evaluation system implementing Meta's 5-pillar framework with level-scaled weightings. The system supports the full annual review cycle: self-reviews, peer feedback (anonymized), manager evaluations, calibration sessions, and final score calculation with bonus tier determination.

**Key Technical Approach**:
- Follow existing Clean Architecture pattern from auth module
- Extend User entity with manager hierarchy and level fields
- Implement 9 new Prisma models for review entities
- Create single `PerformanceReviewsModule` with 4-layer architecture
- Build ~30 REST API endpoints with role-based access control
- Use domain services for score calculation and authorization logic

---

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 20 LTS (current project standard)
**Primary Dependencies**:
- NestJS 10.x (backend framework)
- Prisma 6.19.0 (ORM)
- class-validator/class-transformer (DTO validation)
- @nestjs/swagger (API documentation)
- @nestjs/jwt (authentication - already implemented)

**Storage**: PostgreSQL 15 (existing database, schema extension required)
**Testing**: Jest (unit, integration, e2e tests) - existing test infrastructure
**Target Platform**: Linux/macOS server, containerized with Docker
**Project Type**: Web application (backend API only, frontend out of scope for V1)

**Performance Goals**:
- Page load time: < 2 seconds
- Score calculation: < 100ms
- Support 500 concurrent users during review period
- Handle 2,500 peer feedback submissions per cycle

**Constraints**:
- Must integrate with existing Keycloak OAuth authentication (Feature 001)
- 3-year data retention policy (soft delete old cycles)
- Annual review cycles only (no mid-year for V1)
- Peer feedback must be anonymized to reviewees
- Post-calibration score changes require approval workflow

**Scale/Scope**:
- 500+ engineers across 50+ teams
- ~2,500 peer feedback records per cycle
- 5 review phases over 6-week period
- 9 new database tables, ~100 new source files

---

## Constitution Check

*GATE: Verify compliance with `/specs/constitution.md` (Version 1.0.0)*

### ✅ SOLID Principles
- **Single Responsibility**: Each use case handles one business flow
- **Open/Closed**: Domain entities extensible via composition
- **Liskov Substitution**: Repository interfaces allow swappable implementations
- **Interface Segregation**: Separate repositories per aggregate
- **Dependency Inversion**: Application depends on domain interfaces, not infrastructure

### ✅ Clean Architecture
- **4 Layers**: Domain → Application → Infrastructure → Presentation
- **Dependency Flow**: Outer layers depend inward only
- **Domain Independence**: No framework dependencies in domain layer
- **Port/Adapter Pattern**: Repositories and services as interfaces

### ✅ Test-Driven Development
- Write tests first for all domain logic
- Minimum 80% coverage for critical paths (score calculation, authorization)
- Unit tests for entities/value objects
- Integration tests for repositories
- E2E tests for review workflows

### ✅ TypeScript Type Safety
- Strict mode enabled
- No `any` types (use unknown with type guards)
- Value objects for all domain primitives
- Discriminated unions for status enums

### ✅ NestJS Best Practices
- Feature-based module organization
- Constructor injection for dependencies
- Guards for authorization (ReviewAuthorizationGuard)
- DTOs with class-validator at boundaries
- Exception filters for consistent error handling
- Swagger annotations for all endpoints

**Verdict**: ✅ **PASSES** - No violations. Design fully compliant with constitution.

---

## Project Structure

### Documentation (this feature)

```text
specs/002-performance-evaluation-system/
├── spec.md              # Feature specification (COMPLETED)
├── plan.md              # This file - implementation plan (IN PROGRESS)
├── research.md          # Codebase research findings (COMPLETED)
├── data-model.md        # Database schema and domain model (COMPLETED)
├── contract.md          # API contracts (COMPLETED)
└── tasks.md             # Task breakdown (PENDING - created separately)
```

### Source Code (repository root)

```text
src/
├── auth/                               # Existing - will be extended
│   └── domain/entities/user.entity.ts  # Extend with level, department, managerId
│
├── performance-reviews/                # NEW MODULE
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── review-cycle.entity.ts
│   │   │   ├── self-review.entity.ts
│   │   │   ├── peer-nomination.entity.ts
│   │   │   ├── peer-feedback.entity.ts
│   │   │   ├── manager-evaluation.entity.ts
│   │   │   ├── calibration-session.entity.ts
│   │   │   ├── calibration-adjustment.entity.ts
│   │   │   ├── score-adjustment-request.entity.ts
│   │   │   └── final-score.entity.ts
│   │   ├── value-objects/
│   │   │   ├── review-cycle-id.vo.ts
│   │   │   ├── engineer-level.vo.ts
│   │   │   ├── pillar-score.vo.ts
│   │   │   ├── pillar-scores.vo.ts
│   │   │   ├── weighted-score.vo.ts
│   │   │   ├── bonus-tier.vo.ts
│   │   │   ├── review-status.vo.ts
│   │   │   ├── narrative.vo.ts
│   │   │   └── cycle-deadlines.vo.ts
│   │   ├── repositories/
│   │   │   ├── review-cycle.repository.interface.ts
│   │   │   ├── self-review.repository.interface.ts
│   │   │   ├── peer-nomination.repository.interface.ts
│   │   │   ├── peer-feedback.repository.interface.ts
│   │   │   ├── manager-evaluation.repository.interface.ts
│   │   │   ├── calibration-session.repository.interface.ts
│   │   │   ├── score-adjustment-request.repository.interface.ts
│   │   │   └── final-score.repository.interface.ts
│   │   ├── services/
│   │   │   ├── score-calculation.service.ts
│   │   │   ├── peer-feedback-aggregation.service.ts
│   │   │   └── review-authorization.service.ts
│   │   └── exceptions/
│   │       ├── invalid-pillar-score.exception.ts
│   │       ├── narrative-exceeds-word-limit.exception.ts
│   │       ├── review-not-found.exception.ts
│   │       └── (10+ more exceptions)
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── review-cycles/
│   │   │   │   ├── create-review-cycle.use-case.ts
│   │   │   │   ├── start-review-cycle.use-case.ts
│   │   │   │   └── get-active-cycle.use-case.ts
│   │   │   ├── self-reviews/
│   │   │   │   ├── get-my-self-review.use-case.ts
│   │   │   │   ├── update-self-review.use-case.ts
│   │   │   │   └── submit-self-review.use-case.ts
│   │   │   ├── peer-feedback/
│   │   │   │   ├── nominate-peers.use-case.ts
│   │   │   │   ├── submit-peer-feedback.use-case.ts
│   │   │   │   └── get-peer-feedback.use-case.ts
│   │   │   ├── manager-evaluations/
│   │   │   │   ├── get-team-reviews.use-case.ts
│   │   │   │   ├── get-employee-review.use-case.ts
│   │   │   │   └── submit-manager-evaluation.use-case.ts
│   │   │   ├── calibration/
│   │   │   │   ├── get-calibration-dashboard.use-case.ts
│   │   │   │   ├── create-calibration-session.use-case.ts
│   │   │   │   ├── apply-calibration-adjustment.use-case.ts
│   │   │   │   └── lock-final-scores.use-case.ts
│   │   │   ├── score-adjustments/
│   │   │   │   ├── request-score-adjustment.use-case.ts
│   │   │   │   └── review-score-adjustment.use-case.ts
│   │   │   └── final-scores/
│   │   │       ├── get-my-final-score.use-case.ts
│   │   │       ├── get-team-final-scores.use-case.ts
│   │   │       └── mark-feedback-delivered.use-case.ts
│   │   ├── dto/
│   │   │   ├── review-cycle.dto.ts
│   │   │   ├── self-review.dto.ts
│   │   │   ├── peer-feedback.dto.ts
│   │   │   ├── manager-evaluation.dto.ts
│   │   │   └── final-score.dto.ts
│   │   └── ports/
│   │       └── notification.service.interface.ts
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── repositories/
│   │   │   │   ├── prisma-review-cycle.repository.ts
│   │   │   │   ├── prisma-self-review.repository.ts
│   │   │   │   ├── prisma-peer-nomination.repository.ts
│   │   │   │   ├── prisma-peer-feedback.repository.ts
│   │   │   │   ├── prisma-manager-evaluation.repository.ts
│   │   │   │   ├── prisma-calibration-session.repository.ts
│   │   │   │   ├── prisma-score-adjustment-request.repository.ts
│   │   │   │   └── prisma-final-score.repository.ts
│   │   │   └── mappers/
│   │   │       ├── review-cycle.mapper.ts
│   │   │       ├── self-review.mapper.ts
│   │   │       ├── peer-feedback.mapper.ts
│   │   │       ├── manager-evaluation.mapper.ts
│   │   │       └── final-score.mapper.ts
│   │   └── adapters/
│   │       └── notification/
│   │           └── email-notification.adapter.ts (FUTURE)
│   │
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── review-cycles.controller.ts
│   │   │   ├── self-reviews.controller.ts
│   │   │   ├── peer-feedback.controller.ts
│   │   │   ├── manager-evaluations.controller.ts
│   │   │   ├── calibration.controller.ts
│   │   │   ├── score-adjustments.controller.ts
│   │   │   └── final-scores.controller.ts
│   │   ├── dto/
│   │   │   ├── requests/
│   │   │   │   ├── create-review-cycle.dto.ts
│   │   │   │   ├── update-self-review.dto.ts
│   │   │   │   ├── nominate-peers.dto.ts
│   │   │   │   ├── submit-peer-feedback.dto.ts
│   │   │   │   ├── submit-manager-evaluation.dto.ts
│   │   │   │   ├── apply-calibration-adjustment.dto.ts
│   │   │   │   └── request-score-adjustment.dto.ts
│   │   │   └── responses/
│   │   │       ├── review-cycle.response.dto.ts
│   │   │       ├── self-review.response.dto.ts
│   │   │       ├── peer-feedback.response.dto.ts
│   │   │       ├── manager-evaluation.response.dto.ts
│   │   │       ├── calibration-dashboard.response.dto.ts
│   │   │       └── final-score.response.dto.ts
│   │   ├── guards/
│   │   │   └── review-authorization.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-review-cycle.decorator.ts
│   │   │   └── requires-review-role.decorator.ts
│   │   ├── filters/
│   │   │   └── review-exception.filter.ts
│   │   └── validators/
│   │       └── max-words.validator.ts
│   │
│   └── performance-reviews.module.ts
│
├── common/
│   └── decorators/
│       └── current-user.decorator.ts (already exists)
│
└── prisma/
    ├── schema.prisma (EXTENDED - add 9 new models)
    └── migrations/ (new migrations)

tests/
├── unit/
│   └── performance-reviews/
│       ├── domain/entities/
│       ├── domain/value-objects/
│       └── domain/services/
├── integration/
│   └── performance-reviews/
│       └── repositories/
└── e2e/
    └── performance-reviews/
        └── review-cycle.e2e-spec.ts
```

**Structure Decision**: Single backend module following Clean Architecture. This feature is a single bounded context with high cohesion. All entities work together in review workflows, making a unified module the most maintainable approach. Can refactor to multiple modules later if needed.

---

## Implementation Phases

### Phase 0: Database Foundation (Week 1)

**Goal**: Extend User schema and create all review tables

**Tasks**:
1. Update Prisma schema with User extensions (level, department, managerId)
2. Create 9 new Prisma models (ReviewCycle, SelfReview, PeerNomination, PeerFeedback, ManagerEvaluation, CalibrationSession, CalibrationAdjustment, ScoreAdjustmentRequest, FinalScore)
3. Generate and run Prisma migration
4. Seed database with sample data (levels, manager hierarchy, test cycle)
5. Verify database structure with manual queries

**Deliverables**:
- `prisma/schema.prisma` (updated)
- `prisma/migrations/xxx_add_performance_reviews/migration.sql`
- `prisma/seed.ts` (updated)

**Testing**: Manual database queries to verify schema

---

### Phase 1: Domain Layer (Week 2)

**Goal**: Implement pure domain logic (entities, value objects, services)

**Tasks**:
1. Create value objects (11 VOs):
   - ReviewCycleId, EngineerLevel, PillarScore, PillarScores, WeightedScore, BonusTier, ReviewStatus, Narrative, CycleDeadlines
2. Create domain entities (9 entities):
   - ReviewCycle, SelfReview, PeerNomination, PeerFeedback, ManagerEvaluation, CalibrationSession, CalibrationAdjustment, ScoreAdjustmentRequest, FinalScore
3. Create domain services (3 services):
   - ScoreCalculationService (weighted score logic)
   - PeerFeedbackAggregationService (anonymization, averaging)
   - ReviewAuthorizationService (permission logic)
4. Create repository interfaces (8 interfaces)
5. Create domain exceptions (15+ exceptions)
6. Write unit tests for all domain logic (TDD - tests first!)

**Deliverables**:
- `src/performance-reviews/domain/` (complete)
- ~50 domain unit tests

**Testing**: Unit tests with mocked dependencies, 100% coverage for domain logic

---

### Phase 2: Infrastructure Layer (Week 3)

**Goal**: Implement persistence and external adapters

**Tasks**:
1. Create Prisma repositories (8 repositories implementing domain interfaces)
2. Create mappers for entity<->Prisma conversion (5 mappers)
3. Write repository integration tests (test against real database)
4. Implement transaction support for calibration adjustments
5. Add database indexes for performance
6. Implement soft delete logic for old cycles

**Deliverables**:
- `src/performance-reviews/infrastructure/` (complete)
- ~40 integration tests

**Testing**: Integration tests with test database, verify queries perform well

---

### Phase 3: Application Layer (Week 4-5)

**Goal**: Implement use cases (business workflows)

**Tasks**:
1. Create use case classes (~25 use cases across 6 categories)
2. Create application DTOs (internal data transfer objects)
3. Write use case tests with mocked repositories
4. Implement complex workflows:
   - Submit self-review → check deadline → validate narrative
   - Nominate peers → validate min/max → prevent self/manager
   - Submit manager eval → check peer feedback collected
   - Apply calibration → transaction → recalculate final score
   - Request score adjustment → approval workflow
5. Add business rule validation

**Deliverables**:
- `src/performance-reviews/application/` (complete)
- ~60 use case tests

**Testing**: Unit tests with mocked repositories, verify business rules enforced

---

### Phase 4: Presentation Layer (Week 6-7)

**Goal**: Implement REST API (controllers, DTOs, guards)

**Tasks**:
1. Create controllers (7 controllers for ~30 endpoints)
2. Create request/response DTOs with validation
3. Create custom validators (@MaxWords decorator)
4. Implement ReviewAuthorizationGuard (role-based access)
5. Add Swagger annotations for all endpoints
6. Create exception filter for consistent error responses
7. Write controller unit tests
8. Write E2E tests for critical flows

**Deliverables**:
- `src/performance-reviews/presentation/` (complete)
- ~50 controller/E2E tests

**Testing**: Controller unit tests + E2E tests for full review cycle

---

### Phase 5: Module Integration (Week 8)

**Goal**: Wire everything together in PerformanceReviewsModule

**Tasks**:
1. Create PerformanceReviewsModule with all providers
2. Bind repository implementations to interfaces (DI)
3. Export shared services for other modules
4. Update AppModule to import PerformanceReviewsModule
5. Configure global guards, filters, interceptors
6. Run full test suite (unit + integration + E2E)
7. Test manually via Swagger UI
8. Fix any integration issues

**Deliverables**:
- `src/performance-reviews/performance-reviews.module.ts`
- `src/app.module.ts` (updated)
- All tests passing

**Testing**: Full test suite + manual testing via Swagger

---

### Phase 6: Admin Features & Reports (Week 9)

**Goal**: Implement admin-only features (cycle management, reports)

**Tasks**:
1. Create review cycle CRUD endpoints
2. Implement start/complete cycle workflows
3. Create calibration dashboard endpoint
4. Implement statistics endpoint (score distribution, completion rates)
5. Add CSV export endpoint
6. Create data archival job (soft delete old cycles)
7. Add audit logging for sensitive operations
8. Test admin workflows end-to-end

**Deliverables**:
- Admin endpoints complete
- Reports functional
- Archival job scheduled

**Testing**: Admin E2E tests, verify reports accurate

---

### Phase 7: Polish & Documentation (Week 10)

**Goal**: Finalize documentation, performance tuning, deployment prep

**Tasks**:
1. Complete API documentation in Swagger
2. Write user guide for each role (Engineer, Manager, Calibrator, Admin)
3. Performance testing (500 concurrent users)
4. Database query optimization (add missing indexes)
5. Security audit (authorization checks, input validation)
6. Code review and refactoring
7. Update README with setup instructions
8. Create deployment guide
9. Final testing before production

**Deliverables**:
- Complete documentation
- Performance benchmarks
- Deployment guide
- Production-ready code

**Testing**: Load testing, security testing, final QA

---

## Complexity Tracking

> **No violations detected - all implementation follows constitution**

This section intentionally left empty as the design fully complies with the constitution requirements. No complexity justifications needed.

---

## Dependencies

### Existing Dependencies (No Changes)
- `@nestjs/common`, `@nestjs/core` - Core framework
- `@nestjs/config` - Environment configuration
- `@nestjs/jwt` - Authentication (from Feature 001)
- `@prisma/client` - Database ORM
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation
- `@nestjs/swagger` - API documentation

### New Dependencies (Optional)
- `@nestjs/schedule` - For automated cycle phase transitions (FUTURE)
- `@nestjs/bull` - For async job processing (FUTURE)

---

## Testing Strategy

### Unit Tests (~160 tests total)
- **Domain Entities**: State transitions, validation, factory methods
- **Value Objects**: Immutability, equality, edge cases
- **Domain Services**: Score calculation, aggregation, authorization
- **Use Cases**: Business flows with mocked dependencies
- **Controllers**: Endpoint behavior with mocked use cases

**Target Coverage**: 80% minimum, 100% for domain logic

### Integration Tests (~40 tests)
- **Repositories**: CRUD operations with test database
- **Complex Queries**: Aggregations, joins, transactions
- **Database Constraints**: Unique constraints, foreign keys

**Test Database**: Separate PostgreSQL instance for testing

### E2E Tests (~20 tests)
- **Complete Review Cycle**: Self-review → Peer feedback → Manager eval → Calibration → Delivery
- **Authorization Scenarios**: User can only access own reviews, manager can access team reviews
- **Deadline Enforcement**: Cannot submit after deadline
- **Score Calculation**: Weighted scores calculated correctly
- **Calibration Workflow**: Adjustments applied atomically

**Test Environment**: Docker-compose with separate database

---

## Risk Mitigation

### Technical Risks

**Risk**: Complex aggregation queries may be slow with 500+ users
- **Mitigation**: Add database indexes, use Prisma's `include` selectively, implement caching
- **Fallback**: Create database views for common aggregations

**Risk**: Concurrent calibration adjustments may cause race conditions
- **Mitigation**: Use Prisma transactions, implement optimistic locking
- **Fallback**: Add version field to ManagerEvaluation, detect conflicts

**Risk**: Anonymized peer feedback may leak reviewer identity
- **Mitigation**: Implement aggregation service carefully, never expose individual peer data to reviewees
- **Fallback**: Add automated tests to verify anonymization

### Business Risks

**Risk**: Managers may game the system by inflating scores
- **Mitigation**: Calibration process normalizes scores across teams, score adjustments require HR approval
- **Fallback**: Add anomaly detection for outlier score distributions

**Risk**: Engineers may not complete reviews on time
- **Mitigation**: Email notifications (future), manager dashboard shows completion status
- **Fallback**: Allow late submissions with manager approval

---

## Performance Benchmarks

**Target Metrics**:
- Self-review submission: < 500ms p95
- Peer feedback aggregation: < 200ms p95
- Manager evaluation view (with all data): < 1s p95
- Calibration dashboard (50 evaluations): < 2s p95
- Final score calculation: < 100ms p95
- Export CSV (500 employees): < 5s

**Load Testing**:
- 500 concurrent users submitting reviews
- Sustained throughput: 100 req/s
- No database connection pool exhaustion

---

## Deployment Plan

### Prerequisites
- PostgreSQL 15 with performance-review tables
- Node.js 20 LTS
- Keycloak configured with review roles

### Steps
1. Run database migration: `npx prisma migrate deploy`
2. Seed initial data: `npm run seed` (assign levels, managers)
3. Start application: `npm run start:prod`
4. Verify health: `curl http://localhost:3000/api/v1/health`
5. Access Swagger docs: http://localhost:3000/api/docs

### Monitoring
- Log all review submissions (audit trail)
- Monitor database query performance
- Track API endpoint response times
- Alert on failed score calculations

---

## Success Criteria

### Functional
- ✅ All 30 API endpoints working
- ✅ Complete review cycle can be executed end-to-end
- ✅ Peer feedback is anonymized correctly
- ✅ Weighted scores calculated accurately per level
- ✅ Calibration adjustments apply atomically
- ✅ Score adjustment approval workflow functions
- ✅ 3-year data retention enforced

### Non-Functional
- ✅ 80%+ test coverage
- ✅ All tests passing (unit, integration, E2E)
- ✅ Performance benchmarks met
- ✅ API fully documented in Swagger
- ✅ Security audit passed (authorization, validation)
- ✅ Clean Architecture verified (dependency flow)

### Business
- ✅ HR admin can create and manage cycles
- ✅ Engineers can complete self-reviews within 1000 words
- ✅ Managers can see team status and submit evaluations
- ✅ Calibrators can normalize scores across teams
- ✅ Final scores exported for bonus processing

---

## Next Steps

1. **Review this plan** with team for feedback
2. **Create detailed task breakdown** in `tasks.md`
3. **Set up project board** with milestones for each phase
4. **Begin Phase 0** (Database Foundation) following TDD
5. **Weekly demos** to stakeholders showing progress
6. **Iterate based on feedback** while maintaining constitution compliance

---

**Estimated Timeline**: 10 weeks (2.5 months)
**Team Size**: 1-2 developers
**Start Date**: TBD
**Target Completion**: Q4 2026 (before annual review cycle)

---

**Plan Version**: 1.0
**Last Updated**: 2025-12-12
**Status**: READY FOR REVIEW
