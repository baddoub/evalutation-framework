# Tasks: Performance Evaluation System

**Feature**: 002-performance-evaluation-system
**Branch**: `feature/002-performance-evaluation-system`
**Status**: Ready for Implementation

---

## Phase 0: Database Foundation

**Goal**: Extend User schema and create all review tables

### Tasks

- [X] 0.1 Update Prisma schema - User extensions
  - Add `level`, `department`, `jobTitle`, `managerId` fields to User model
  - Add self-referential relation for manager hierarchy
  - File: `prisma/schema.prisma`

- [X] 0.2 Create ReviewCycle model
  - Define ReviewCycle with all fields from data-model.md
  - File: `prisma/schema.prisma`

- [X] 0.3 Create SelfReview model
  - Define SelfReview with pillar scores and narrative
  - File: `prisma/schema.prisma`

- [X] 0.4 Create PeerNomination model
  - Define PeerNomination with status tracking
  - File: `prisma/schema.prisma`

- [X] 0.5 Create PeerFeedback model
  - Define PeerFeedback with scores and comments
  - File: `prisma/schema.prisma`

- [X] 0.6 Create ManagerEvaluation model
  - Define ManagerEvaluation with scores and narrative
  - File: `prisma/schema.prisma`

- [X] 0.7 Create CalibrationSession model
  - Define CalibrationSession with participants
  - File: `prisma/schema.prisma`

- [X] 0.8 Create CalibrationAdjustment model
  - Define CalibrationAdjustment with justification
  - File: `prisma/schema.prisma`

- [X] 0.9 Create ScoreAdjustmentRequest model
  - Define ScoreAdjustmentRequest with approval workflow
  - File: `prisma/schema.prisma`

- [X] 0.10 Create FinalScore model
  - Define FinalScore with calculated scores
  - File: `prisma/schema.prisma`

- [X] 0.11 Generate Prisma migration
  - Run: `npx prisma migrate dev --name add_performance_reviews`

- [X] 0.12 Update seed file
  - Add sample levels, departments, manager hierarchy
  - Create test review cycle
  - File: `prisma/seed.ts`

- [X] 0.13 Run seed
  - Execute: `npm run prisma:seed`

- [X] 0.14 Verify database structure
  - Database successfully seeded with users, manager hierarchy, review cycle, and sample self-reviews

---

## Phase 1: Domain Layer

**Goal**: Implement pure domain logic (entities, value objects, services)

### Value Objects [P]

- [X] 1.1 Create ReviewCycleId value object
  - Implement UUID-based identifier
  - File: `src/performance-reviews/domain/value-objects/review-cycle-id.vo.ts`

- [X] 1.2 Create EngineerLevel value object
  - Enum: Junior, Mid, Senior, Lead, Manager
  - File: `src/performance-reviews/domain/value-objects/engineer-level.vo.ts`

- [X] 1.3 Create PillarScore value object
  - Validate 0-4 range
  - File: `src/performance-reviews/domain/value-objects/pillar-score.vo.ts`

- [X] 1.4 Create PillarScores value object
  - Container for 5 pillar scores
  - File: `src/performance-reviews/domain/value-objects/pillar-scores.vo.ts`

- [X] 1.5 Create WeightedScore value object
  - Calculate percentage and bonus tier
  - File: `src/performance-reviews/domain/value-objects/weighted-score.vo.ts`

- [X] 1.6 Create BonusTier value object
  - Enum: Exceeds, Meets, Below
  - File: `src/performance-reviews/domain/value-objects/bonus-tier.vo.ts`

- [X] 1.7 Create ReviewStatus value object
  - Enum: Draft, Submitted, Calibrated
  - File: `src/performance-reviews/domain/value-objects/review-status.vo.ts`

- [X] 1.8 Create Narrative value object
  - Validate 1000 word limit
  - File: `src/performance-reviews/domain/value-objects/narrative.vo.ts`

- [X] 1.9 Create CycleDeadlines value object
  - Container for 5 phase deadlines
  - File: `src/performance-reviews/domain/value-objects/cycle-deadlines.vo.ts`

### Value Object Tests [P]

- [X] 1.10 Test ReviewCycleId [P]
  - File: `tests/unit/performance-reviews/domain/value-objects/review-cycle-id.vo.spec.ts`

- [X] 1.11 Test EngineerLevel [P]
  - File: `tests/unit/performance-reviews/domain/value-objects/engineer-level.vo.spec.ts`

- [X] 1.12 Test PillarScore [P]
  - File: `tests/unit/performance-reviews/domain/value-objects/pillar-score.vo.spec.ts`

- [X] 1.13 Test PillarScores [P]
  - File: `tests/unit/performance-reviews/domain/value-objects/pillar-scores.vo.spec.ts`

- [X] 1.14 Test WeightedScore [P]
  - File: `tests/unit/performance-reviews/domain/value-objects/weighted-score.vo.spec.ts`

- [X] 1.15 Test BonusTier [P]
  - File: `tests/unit/performance-reviews/domain/value-objects/bonus-tier.vo.spec.ts`

- [X] 1.16 Test Narrative [P]
  - File: `tests/unit/performance-reviews/domain/value-objects/narrative.vo.spec.ts`

### Domain Entities

- [X] 1.17 Create ReviewCycle entity
  - Implement state transitions (start, enterCalibration, complete)
  - File: `src/performance-reviews/domain/entities/review-cycle.entity.ts`

- [X] 1.18 Create SelfReview entity
  - Implement submit workflow
  - File: `src/performance-reviews/domain/entities/self-review.entity.ts`

- [X] 1.19 Create PeerFeedback entity
  - Implement anonymization logic
  - File: `src/performance-reviews/domain/entities/peer-feedback.entity.ts`

- [X] 1.20 Create ManagerEvaluation entity
  - Implement calibration workflow
  - File: `src/performance-reviews/domain/entities/manager-evaluation.entity.ts`

- [X] 1.21 Create FinalScore entity
  - Implement score calculation
  - File: `src/performance-reviews/domain/entities/final-score.entity.ts`

### Entity Tests [P]

- [X] 1.22 Test ReviewCycle entity [P]
  - File: `tests/unit/performance-reviews/domain/entities/review-cycle.entity.spec.ts`

- [X] 1.23 Test SelfReview entity [P]
  - File: `tests/unit/performance-reviews/domain/entities/self-review.entity.spec.ts`

- [X] 1.24 Test PeerFeedback entity [P]
  - File: `tests/unit/performance-reviews/domain/entities/peer-feedback.entity.spec.ts`

- [X] 1.25 Test ManagerEvaluation entity [P]
  - File: `tests/unit/performance-reviews/domain/entities/manager-evaluation.entity.spec.ts`

- [X] 1.26 Test FinalScore entity [P]
  - File: `tests/unit/performance-reviews/domain/entities/final-score.entity.spec.ts`

### Domain Services

- [X] 1.27 Create ScoreCalculationService
  - Implement weighted score calculation with level-specific weights
  - File: `src/performance-reviews/domain/services/score-calculation.service.ts`

- [X] 1.28 Create PeerFeedbackAggregationService
  - Implement anonymization and averaging logic
  - File: `src/performance-reviews/domain/services/peer-feedback-aggregation.service.ts`

- [X] 1.29 Create ReviewAuthorizationService
  - Implement permission logic (canViewReview, canSubmitPeerFeedback, etc.)
  - File: `src/performance-reviews/domain/services/review-authorization.service.ts`

### Service Tests [P]

- [X] 1.30 Test ScoreCalculationService [P]
  - File: `tests/unit/performance-reviews/domain/services/score-calculation.service.spec.ts`

- [X] 1.31 Test PeerFeedbackAggregationService [P]
  - File: `tests/unit/performance-reviews/domain/services/peer-feedback-aggregation.service.spec.ts`

- [X] 1.32 Test ReviewAuthorizationService [P]
  - File: `tests/unit/performance-reviews/domain/services/review-authorization.service.spec.ts`

### Repository Interfaces [P]

- [X] 1.33 Create IReviewCycleRepository interface [P]
  - File: `src/performance-reviews/domain/repositories/review-cycle.repository.interface.ts`

- [X] 1.34 Create ISelfReviewRepository interface [P]
  - File: `src/performance-reviews/domain/repositories/self-review.repository.interface.ts`

- [X] 1.35 Create IPeerNominationRepository interface [P]
  - File: `src/performance-reviews/domain/repositories/peer-nomination.repository.interface.ts`

- [X] 1.36 Create IPeerFeedbackRepository interface [P]
  - File: `src/performance-reviews/domain/repositories/peer-feedback.repository.interface.ts`

- [X] 1.37 Create IManagerEvaluationRepository interface [P]
  - File: `src/performance-reviews/domain/repositories/manager-evaluation.repository.interface.ts`

- [X] 1.38 Create ICalibrationSessionRepository interface [P]
  - File: `src/performance-reviews/domain/repositories/calibration-session.repository.interface.ts`

- [X] 1.39 Create IScoreAdjustmentRequestRepository interface [P]
  - File: `src/performance-reviews/domain/repositories/score-adjustment-request.repository.interface.ts`

- [X] 1.40 Create IFinalScoreRepository interface [P]
  - File: `src/performance-reviews/domain/repositories/final-score.repository.interface.ts`

### Domain Exceptions [P]

- [X] 1.41 Create domain exception hierarchy [P]
  - InvalidPillarScoreException, NarrativeExceedsWordLimitException, ReviewNotFoundException, etc.
  - File: `src/performance-reviews/domain/exceptions/`

---

## Phase 2: Infrastructure Layer

**Goal**: Implement persistence and external adapters

### Mappers [P]

- [X] 2.1 Create ReviewCycle mapper [P]
  - File: `src/performance-reviews/infrastructure/persistence/mappers/review-cycle.mapper.ts`

- [X] 2.2 Create SelfReview mapper [P]
  - File: `src/performance-reviews/infrastructure/persistence/mappers/self-review.mapper.ts`

- [X] 2.3 Create PeerFeedback mapper [P]
  - File: `src/performance-reviews/infrastructure/persistence/mappers/peer-feedback.mapper.ts`

- [X] 2.4 Create ManagerEvaluation mapper [P]
  - File: `src/performance-reviews/infrastructure/persistence/mappers/manager-evaluation.mapper.ts`

- [X] 2.5 Create FinalScore mapper [P]
  - File: `src/performance-reviews/infrastructure/persistence/mappers/final-score.mapper.ts`

### Repositories

- [X] 2.6 Create PrismaReviewCycleRepository
  - Implement all IReviewCycleRepository methods
  - File: `src/performance-reviews/infrastructure/persistence/repositories/prisma-review-cycle.repository.ts`

- [X] 2.7 Create PrismaSelfReviewRepository
  - Implement all ISelfReviewRepository methods
  - File: `src/performance-reviews/infrastructure/persistence/repositories/prisma-self-review.repository.ts`

- [X] 2.8 Create PrismaPeerNominationRepository
  - Implement all IPeerNominationRepository methods
  - File: `src/performance-reviews/infrastructure/persistence/repositories/prisma-peer-nomination.repository.ts`

- [X] 2.9 Create PrismaPeerFeedbackRepository
  - Implement all IPeerFeedbackRepository methods
  - File: `src/performance-reviews/infrastructure/persistence/repositories/prisma-peer-feedback.repository.ts`

- [X] 2.10 Create PrismaManagerEvaluationRepository
  - Implement all IManagerEvaluationRepository methods
  - File: `src/performance-reviews/infrastructure/persistence/repositories/prisma-manager-evaluation.repository.ts`

- [X] 2.11 Create PrismaCalibrationSessionRepository
  - Implement all ICalibrationSessionRepository methods
  - File: `src/performance-reviews/infrastructure/persistence/repositories/prisma-calibration-session.repository.ts`

- [X] 2.12 Create PrismaScoreAdjustmentRequestRepository
  - Implement all IScoreAdjustmentRequestRepository methods
  - File: `src/performance-reviews/infrastructure/persistence/repositories/prisma-score-adjustment-request.repository.ts`

- [X] 2.13 Create PrismaFinalScoreRepository
  - Implement all IFinalScoreRepository methods
  - File: `src/performance-reviews/infrastructure/persistence/repositories/prisma-final-score.repository.ts`

### Repository Tests [P]

- [X] 2.14 Test PrismaReviewCycleRepository [P]
  - File: `tests/integration/performance-reviews/repositories/prisma-review-cycle.repository.spec.ts`

- [X] 2.15 Test PrismaSelfReviewRepository [P]
  - File: `tests/integration/performance-reviews/repositories/prisma-self-review.repository.spec.ts`

- [X] 2.16 Test PrismaPeerFeedbackRepository [P]
  - File: `tests/integration/performance-reviews/repositories/prisma-peer-feedback.repository.spec.ts`

- [X] 2.17 Test PrismaManagerEvaluationRepository [P]
  - File: `tests/integration/performance-reviews/repositories/prisma-manager-evaluation.repository.spec.ts`

- [X] 2.18 Test PrismaFinalScoreRepository [P]
  - File: `tests/integration/performance-reviews/repositories/prisma-final-score.repository.spec.ts`

---

## Phase 3: Application Layer

**Goal**: Implement use cases (business workflows)

### Application DTOs [P]

- [X] 3.1 Create application DTOs [P]
  - ReviewCycleDto, SelfReviewDto, PeerFeedbackDto, ManagerEvaluationDto, FinalScoreDto
  - File: `src/performance-reviews/application/dto/`

### Review Cycle Use Cases

- [X] 3.2 Create CreateReviewCycleUseCase
  - File: `src/performance-reviews/application/use-cases/review-cycles/create-review-cycle.use-case.ts`

- [X] 3.3 Create StartReviewCycleUseCase
  - File: `src/performance-reviews/application/use-cases/review-cycles/start-review-cycle.use-case.ts`

- [X] 3.4 Create GetActiveCycleUseCase
  - File: `src/performance-reviews/application/use-cases/review-cycles/get-active-cycle.use-case.ts`

### Self-Review Use Cases

- [X] 3.5 Create GetMySelfReviewUseCase
  - File: `src/performance-reviews/application/use-cases/self-reviews/get-my-self-review.use-case.ts`

- [X] 3.6 Create UpdateSelfReviewUseCase
  - File: `src/performance-reviews/application/use-cases/self-reviews/update-self-review.use-case.ts`

- [X] 3.7 Create SubmitSelfReviewUseCase
  - File: `src/performance-reviews/application/use-cases/self-reviews/submit-self-review.use-case.ts`

### Peer Feedback Use Cases

- [X] 3.8 Create NominatePeersUseCase
  - File: `src/performance-reviews/application/use-cases/peer-feedback/nominate-peers.use-case.ts`

- [X] 3.9 Create SubmitPeerFeedbackUseCase
  - File: `src/performance-reviews/application/use-cases/peer-feedback/submit-peer-feedback.use-case.ts`

- [X] 3.10 Create GetPeerFeedbackUseCase
  - File: `src/performance-reviews/application/use-cases/peer-feedback/get-peer-feedback.use-case.ts`

### Manager Evaluation Use Cases

- [X] 3.11 Create GetTeamReviewsUseCase
  - File: `src/performance-reviews/application/use-cases/manager-evaluations/get-team-reviews.use-case.ts`

- [X] 3.12 Create GetEmployeeReviewUseCase
  - File: `src/performance-reviews/application/use-cases/manager-evaluations/get-employee-review.use-case.ts`

- [X] 3.13 Create SubmitManagerEvaluationUseCase
  - File: `src/performance-reviews/application/use-cases/manager-evaluations/submit-manager-evaluation.use-case.ts`

### Calibration Use Cases

- [X] 3.14 Create GetCalibrationDashboardUseCase
  - File: `src/performance-reviews/application/use-cases/calibration/get-calibration-dashboard.use-case.ts`

- [X] 3.15 Create CreateCalibrationSessionUseCase
  - File: `src/performance-reviews/application/use-cases/calibration/create-calibration-session.use-case.ts`

- [X] 3.16 Create ApplyCalibrationAdjustmentUseCase
  - File: `src/performance-reviews/application/use-cases/calibration/apply-calibration-adjustment.use-case.ts`

- [X] 3.17 Create LockFinalScoresUseCase
  - File: `src/performance-reviews/application/use-cases/calibration/lock-final-scores.use-case.ts`

### Score Adjustment Use Cases

- [X] 3.18 Create RequestScoreAdjustmentUseCase
  - File: `src/performance-reviews/application/use-cases/score-adjustments/request-score-adjustment.use-case.ts`

- [X] 3.19 Create ReviewScoreAdjustmentUseCase
  - File: `src/performance-reviews/application/use-cases/score-adjustments/review-score-adjustment.use-case.ts`

### Final Score Use Cases

- [X] 3.20 Create GetMyFinalScoreUseCase
  - File: `src/performance-reviews/application/use-cases/final-scores/get-my-final-score.use-case.ts`

- [X] 3.21 Create GetTeamFinalScoresUseCase
  - File: `src/performance-reviews/application/use-cases/final-scores/get-team-final-scores.use-case.ts`

- [X] 3.22 Create MarkFeedbackDeliveredUseCase
  - File: `src/performance-reviews/application/use-cases/final-scores/mark-feedback-delivered.use-case.ts`

### Use Case Tests [P]

- [X] 3.23 Test review cycle use cases [P]
  - Files: `tests/unit/performance-reviews/application/use-cases/review-cycles/*.spec.ts`

- [X] 3.24 Test self-review use cases [P]
  - Files: `tests/unit/performance-reviews/application/use-cases/self-reviews/*.spec.ts`

- [X] 3.25 Test peer feedback use cases [P]
  - Files: `tests/unit/performance-reviews/application/use-cases/peer-feedback/*.spec.ts`

- [X] 3.26 Test manager evaluation use cases [P]
  - Files: `tests/unit/performance-reviews/application/use-cases/manager-evaluations/*.spec.ts`

- [X] 3.27 Test calibration use cases [P]
  - Files: `tests/unit/performance-reviews/application/use-cases/calibration/*.spec.ts`

- [X] 3.28 Test final score use cases [P]
  - Files: `tests/unit/performance-reviews/application/use-cases/final-scores/*.spec.ts`

---

## Phase 4: Presentation Layer

**Goal**: Implement REST API (controllers, DTOs, guards)

### Request/Response DTOs [P]

- [ ] 4.1 Create request DTOs [P]
  - CreateReviewCycleDto, UpdateSelfReviewDto, NominatePeersDto, etc.
  - Files: `src/performance-reviews/presentation/dto/requests/`

- [ ] 4.2 Create response DTOs [P]
  - ReviewCycleResponseDto, SelfReviewResponseDto, etc.
  - Files: `src/performance-reviews/presentation/dto/responses/`

### Custom Validators [P]

- [ ] 4.3 Create MaxWords validator [P]
  - File: `src/performance-reviews/presentation/validators/max-words.validator.ts`

### Guards and Decorators [P]

- [ ] 4.4 Create ReviewAuthorizationGuard [P]
  - File: `src/performance-reviews/presentation/guards/review-authorization.guard.ts`

- [ ] 4.5 Create custom decorators [P]
  - CurrentReviewCycle, RequiresReviewRole
  - Files: `src/performance-reviews/presentation/decorators/`

### Exception Filter [P]

- [ ] 4.6 Create ReviewExceptionFilter [P]
  - File: `src/performance-reviews/presentation/filters/review-exception.filter.ts`

### Controllers

- [ ] 4.7 Create ReviewCyclesController
  - Endpoints: list, get active, create, start
  - File: `src/performance-reviews/presentation/controllers/review-cycles.controller.ts`

- [ ] 4.8 Create SelfReviewsController
  - Endpoints: get my review, update, submit
  - File: `src/performance-reviews/presentation/controllers/self-reviews.controller.ts`

- [ ] 4.9 Create PeerFeedbackController
  - Endpoints: nominate, submit feedback, get feedback
  - File: `src/performance-reviews/presentation/controllers/peer-feedback.controller.ts`

- [ ] 4.10 Create ManagerEvaluationsController
  - Endpoints: get team reviews, get employee review, submit evaluation
  - File: `src/performance-reviews/presentation/controllers/manager-evaluations.controller.ts`

- [ ] 4.11 Create CalibrationController
  - Endpoints: dashboard, create session, apply adjustment, lock scores
  - File: `src/performance-reviews/presentation/controllers/calibration.controller.ts`

- [ ] 4.12 Create ScoreAdjustmentsController
  - Endpoints: request adjustment, review adjustment
  - File: `src/performance-reviews/presentation/controllers/score-adjustments.controller.ts`

- [ ] 4.13 Create FinalScoresController
  - Endpoints: get my score, get team scores, mark delivered
  - File: `src/performance-reviews/presentation/controllers/final-scores.controller.ts`

### Controller Tests [P]

- [ ] 4.14 Test ReviewCyclesController [P]
  - File: `tests/unit/performance-reviews/presentation/controllers/review-cycles.controller.spec.ts`

- [ ] 4.15 Test SelfReviewsController [P]
  - File: `tests/unit/performance-reviews/presentation/controllers/self-reviews.controller.spec.ts`

- [ ] 4.16 Test other controllers [P]
  - Files: `tests/unit/performance-reviews/presentation/controllers/*.spec.ts`

---

## Phase 5: Module Integration

**Goal**: Wire everything together in PerformanceReviewsModule

### Module Setup

- [ ] 5.1 Create PerformanceReviewsModule
  - Configure all providers with DI bindings
  - File: `src/performance-reviews/performance-reviews.module.ts`

- [ ] 5.2 Update AppModule
  - Import PerformanceReviewsModule
  - File: `src/app.module.ts`

### Testing

- [ ] 5.3 Run full test suite
  - Execute: `npm test`

- [ ] 5.4 Manual testing via Swagger
  - Start app and test endpoints at http://localhost:3000/api/docs

- [ ] 5.5 Fix integration issues
  - Debug and resolve any dependency injection or routing issues

---

## Phase 6: E2E Tests

**Goal**: Implement end-to-end tests for critical workflows

### E2E Test Suites

- [ ] 6.1 Create review cycle E2E test
  - Test full workflow: create cycle, start, complete phases
  - File: `tests/e2e/performance-reviews/review-cycle.e2e-spec.ts`

- [ ] 6.2 Create self-review E2E test
  - Test: create, update, submit self-review
  - File: `tests/e2e/performance-reviews/self-review.e2e-spec.ts`

- [ ] 6.3 Create peer feedback E2E test
  - Test: nominate peers, submit feedback, view aggregated
  - File: `tests/e2e/performance-reviews/peer-feedback.e2e-spec.ts`

- [ ] 6.4 Create calibration E2E test
  - Test: calibration dashboard, apply adjustments, lock scores
  - File: `tests/e2e/performance-reviews/calibration.e2e-spec.ts`

- [ ] 6.5 Create authorization E2E test
  - Test: role-based access control, permission checks
  - File: `tests/e2e/performance-reviews/authorization.e2e-spec.ts`

- [ ] 6.6 Run E2E tests
  - Execute: `npm run test:e2e`

---

## Phase 7: Polish & Documentation

**Goal**: Finalize documentation, performance tuning, deployment prep

### Documentation

- [ ] 7.1 Complete Swagger annotations
  - Ensure all endpoints have proper @ApiOperation, @ApiResponse

- [ ] 7.2 Update README
  - Add setup instructions for performance reviews feature
  - File: `README.md`

### Performance & Security

- [ ] 7.3 Performance testing
  - Test with 500 concurrent users
  - Verify response times meet benchmarks

- [ ] 7.4 Security audit
  - Review authorization checks
  - Validate input validation on all endpoints

- [ ] 7.5 Code review and refactoring
  - Review code for consistency with existing patterns
  - Refactor as needed

### Final Validation

- [ ] 7.6 Run all tests
  - Execute: `npm test && npm run test:e2e`
  - Verify 80%+ coverage

- [ ] 7.7 Final manual testing
  - Test complete review cycle end-to-end via Swagger
  - Verify all success criteria met

---

## Execution Notes

**Parallel Execution**: Tasks marked with [P] can be executed in parallel within their phase.

**Dependencies**: All tasks within a phase must complete before moving to the next phase.

**TDD Approach**: Test tasks should be executed before their corresponding implementation tasks where applicable.

**File-Based Coordination**: Tasks affecting the same files must run sequentially.

---

**Total Tasks**: 153
**Estimated Timeline**: 10 weeks
**Current Status**: Ready to start Phase 0
