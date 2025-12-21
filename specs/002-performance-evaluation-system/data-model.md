# Data Model: Performance Evaluation System

**Feature ID**: 002
**Date**: 2025-12-12
**Status**: Design

---

## Key Design Decisions

Based on user clarifications:

1. **Peer Feedback Privacy**: Fully anonymized - reviewees see only aggregated scores and anonymized comments
2. **Score Adjustments**: Managers can request score changes after calibration with justification (approval workflow needed)
3. **Data Retention**: 3 years of detailed history, then soft-delete old cycles
4. **Review Cadence**: Annual only for V1 (no mid-year check-ins)

---

## 1. Prisma Schema

### User Extensions

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
  jobTitle     String?
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
  selfReviews              SelfReview[]
  peerNominationsGiven     PeerNomination[] @relation("NominatorNominations")
  peerNominationsReceived  PeerNomination[] @relation("NomineeNominations")
  peerFeedbackGiven        PeerFeedback[] @relation("ReviewerFeedback")
  peerFeedbackReceived     PeerFeedback[] @relation("RevieweeFeedback")
  managerEvaluations       ManagerEvaluation[] @relation("ManagerEvaluations")
  employeeEvaluations      ManagerEvaluation[] @relation("EmployeeEvaluations")
  calibrationSessionsFacilitated CalibrationSession[] @relation("FacilitatorSessions")
  calibrationSessionsParticipated CalibrationSession[] @relation("ParticipantSessions")
  calibrationAdjustmentsMade CalibrationAdjustment[] @relation("AdjusterAdjustments")
  scoreAdjustmentRequests  ScoreAdjustmentRequest[] @relation("RequesterAdjustments")
  scoreAdjustmentApprovals ScoreAdjustmentRequest[] @relation("ApproverAdjustments")
  finalScores              FinalScore[]

  @@index([managerId])
  @@index([department])
  @@index([level])
}
```

### Review Cycle

```prisma
model ReviewCycle {
  id          String   @id @default(uuid())
  name        String   // e.g., "2025 Annual Review"
  year        Int      // 2025
  status      String   // DRAFT, ACTIVE, CALIBRATION, COMPLETED

  // Phase deadlines
  selfReviewDeadline    DateTime
  peerFeedbackDeadline  DateTime
  managerEvalDeadline   DateTime
  calibrationDeadline   DateTime
  feedbackDeliveryDeadline DateTime

  startDate   DateTime
  endDate     DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  // Relations
  selfReviews           SelfReview[]
  peerNominations       PeerNomination[]
  peerFeedback          PeerFeedback[]
  managerEvaluations    ManagerEvaluation[]
  calibrationSessions   CalibrationSession[]
  finalScores           FinalScore[]

  @@unique([year, name])
  @@index([status])
  @@index([year])
}
```

### Self Review

```prisma
model SelfReview {
  id        String   @id @default(uuid())
  cycleId   String
  userId    String

  // Pillar scores (0-4)
  projectImpactScore          Int  // 0-4
  directionScore              Int  // 0-4
  engineeringExcellenceScore  Int  // 0-4
  operationalOwnershipScore   Int  // 0-4
  peopleImpactScore           Int  // 0-4

  // Narrative (max 1000 words)
  narrative String  @db.Text

  status    String   // DRAFT, SUBMITTED

  submittedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  // Relations
  cycle     ReviewCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([cycleId, userId])
  @@index([userId])
  @@index([status])
}
```

### Peer Nomination

```prisma
model PeerNomination {
  id             String   @id @default(uuid())
  cycleId        String
  nominatorId    String   // Employee being reviewed
  nomineeId      String   // Peer nominated to provide feedback

  status         String   // PENDING, ACCEPTED, DECLINED, OVERRIDDEN_BY_MANAGER
  declineReason  String?  @db.Text

  nominatedAt    DateTime @default(now())
  respondedAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  cycle          ReviewCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  nominator      User        @relation("NominatorNominations", fields: [nominatorId], references: [id])
  nominee        User        @relation("NomineeNominations", fields: [nomineeId], references: [id])

  @@unique([cycleId, nominatorId, nomineeId])
  @@index([nominatorId])
  @@index([nomineeId])
  @@index([status])
}
```

### Peer Feedback

```prisma
model PeerFeedback {
  id          String   @id @default(uuid())
  cycleId     String
  revieweeId  String   // Employee being reviewed
  reviewerId  String   // Peer providing feedback

  // Pillar scores (0-4)
  projectImpactScore          Int  // 0-4
  directionScore              Int  // 0-4
  engineeringExcellenceScore  Int  // 0-4
  operationalOwnershipScore   Int  // 0-4
  peopleImpactScore           Int  // 0-4

  // Comments (anonymized to reviewee)
  strengths     String?  @db.Text
  growthAreas   String?  @db.Text
  generalComments String? @db.Text

  submittedAt DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  // Relations
  cycle       ReviewCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  reviewee    User        @relation("RevieweeFeedback", fields: [revieweeId], references: [id])
  reviewer    User        @relation("ReviewerFeedback", fields: [reviewerId], references: [id])

  @@unique([cycleId, revieweeId, reviewerId])
  @@index([revieweeId])
  @@index([reviewerId])
}
```

### Manager Evaluation

```prisma
model ManagerEvaluation {
  id          String   @id @default(uuid())
  cycleId     String
  employeeId  String   // Employee being evaluated
  managerId   String   // Manager providing evaluation

  // Final pillar scores (0-4) after reviewing self + peer feedback
  projectImpactScore          Int  // 0-4
  directionScore              Int  // 0-4
  engineeringExcellenceScore  Int  // 0-4
  operationalOwnershipScore   Int  // 0-4
  peopleImpactScore           Int  // 0-4

  // Manager's assessment
  narrative         String  @db.Text
  strengths         String  @db.Text
  growthAreas       String  @db.Text
  developmentPlan   String  @db.Text

  status          String   // DRAFT, SUBMITTED, CALIBRATED

  submittedAt     DateTime?
  calibratedAt    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  // Relations
  cycle           ReviewCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  employee        User        @relation("EmployeeEvaluations", fields: [employeeId], references: [id])
  manager         User        @relation("ManagerEvaluations", fields: [managerId], references: [id])

  calibrationAdjustments CalibrationAdjustment[]

  @@unique([cycleId, employeeId])
  @@index([employeeId])
  @@index([managerId])
  @@index([status])
}
```

### Calibration Session

```prisma
model CalibrationSession {
  id            String   @id @default(uuid())
  cycleId       String
  name          String   // e.g., "Engineering Org Calibration"
  department    String?  // Optional: calibrate by department
  facilitatorId String

  scheduledAt   DateTime
  completedAt   DateTime?
  status        String   // SCHEDULED, IN_PROGRESS, COMPLETED

  // Participants (manager IDs)
  participantIds String[] // Array of user IDs

  notes         String?  @db.Text

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  cycle         ReviewCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  facilitator   User        @relation("FacilitatorSessions", fields: [facilitatorId], references: [id])
  participants  User[]      @relation("ParticipantSessions")

  adjustments   CalibrationAdjustment[]

  @@index([cycleId])
  @@index([department])
  @@index([status])
}
```

### Calibration Adjustment

```prisma
model CalibrationAdjustment {
  id              String   @id @default(uuid())
  sessionId       String
  evaluationId    String   // ManagerEvaluation being adjusted
  adjustedBy      String   // User who made the adjustment

  // Original scores
  originalProjectImpact         Int
  originalDirection             Int
  originalEngineeringExcellence Int
  originalOperationalOwnership  Int
  originalPeopleImpact          Int

  // Adjusted scores
  adjustedProjectImpact         Int
  adjustedDirection             Int
  adjustedEngineeringExcellence Int
  adjustedOperationalOwnership  Int
  adjustedPeopleImpact          Int

  justification String  @db.Text

  adjustedAt    DateTime @default(now())
  createdAt     DateTime @default(now())

  // Relations
  session       CalibrationSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  evaluation    ManagerEvaluation   @relation(fields: [evaluationId], references: [id])
  adjuster      User                @relation("AdjusterAdjustments", fields: [adjustedBy], references: [id])

  @@index([sessionId])
  @@index([evaluationId])
}
```

### Score Adjustment Request

**NEW**: For post-calibration score changes

```prisma
model ScoreAdjustmentRequest {
  id              String   @id @default(uuid())
  cycleId         String
  employeeId      String
  requesterId     String   // Manager requesting change
  approverId      String?  // HR admin who approved/rejected

  reason          String   @db.Text
  status          String   // PENDING, APPROVED, REJECTED

  // Proposed new scores
  proposedProjectImpact         Int
  proposedDirection             Int
  proposedEngineeringExcellence Int
  proposedOperationalOwnership  Int
  proposedPeopleImpact          Int

  requestedAt     DateTime @default(now())
  reviewedAt      DateTime?
  rejectionReason String?  @db.Text

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  requester       User     @relation("RequesterAdjustments", fields: [requesterId], references: [id])
  approver        User?    @relation("ApproverAdjustments", fields: [approverId], references: [id])

  @@index([employeeId])
  @@index([status])
}
```

### Final Score

```prisma
model FinalScore {
  id          String   @id @default(uuid())
  cycleId     String
  userId      String

  // Pillar scores (copied from manager evaluation after calibration)
  projectImpactScore          Int  // 0-4
  directionScore              Int  // 0-4
  engineeringExcellenceScore  Int  // 0-4
  operationalOwnershipScore   Int  // 0-4
  peopleImpactScore           Int  // 0-4

  // Calculated scores
  weightedScore    Float    // 0.00 - 4.00
  percentageScore  Float    // 0.00 - 100.00
  bonusTier        String   // EXCEEDS, MEETS, BELOW

  // Peer feedback aggregation (for reference)
  peerAvgProjectImpact         Float?
  peerAvgDirection             Float?
  peerAvgEngineeringExcellence Float?
  peerAvgOperationalOwnership  Float?
  peerAvgPeopleImpact          Float?
  peerFeedbackCount            Int?

  locked          Boolean  @default(false)
  lockedAt        DateTime?

  feedbackDelivered Boolean  @default(false)
  feedbackDeliveredAt DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  // Relations
  cycle           ReviewCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  user            User        @relation(fields: [userId], references: [id])

  @@unique([cycleId, userId])
  @@index([userId])
  @@index([bonusTier])
  @@index([locked])
}
```

---

## 2. Domain Entities

### Value Objects

```typescript
// performance-reviews/domain/value-objects/

export class ReviewCycleId {
  private constructor(private readonly _value: string) {}
  static generate(): ReviewCycleId
  static fromString(id: string): ReviewCycleId
  get value(): string
  equals(other: ReviewCycleId): boolean
}

export class EngineerLevel {
  private constructor(private readonly _value: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER') {}
  static JUNIOR = new EngineerLevel('JUNIOR')
  static MID = new EngineerLevel('MID')
  static SENIOR = new EngineerLevel('SENIOR')
  static LEAD = new EngineerLevel('LEAD')
  static MANAGER = new EngineerLevel('MANAGER')
  static fromString(value: string): EngineerLevel
  get value(): string
}

export class PillarScore {
  private constructor(private readonly _value: number) {
    if (_value < 0 || _value > 4 || !Number.isInteger(_value)) {
      throw new InvalidPillarScoreException()
    }
  }
  static fromValue(value: number): PillarScore
  get value(): number
  equals(other: PillarScore): boolean
}

export class PillarScores {
  private constructor(
    public readonly projectImpact: PillarScore,
    public readonly direction: PillarScore,
    public readonly engineeringExcellence: PillarScore,
    public readonly operationalOwnership: PillarScore,
    public readonly peopleImpact: PillarScore,
  ) {}

  static create(scores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }): PillarScores

  toObject(): Record<string, number>
  equals(other: PillarScores): boolean
}

export class WeightedScore {
  private constructor(private readonly _value: number) {
    if (_value < 0 || _value > 4) {
      throw new InvalidWeightedScoreException()
    }
  }
  static fromValue(value: number): WeightedScore
  get value(): number
  get percentage(): number // (value / 4.0) * 100
  get bonusTier(): BonusTier
}

export class BonusTier {
  private constructor(private readonly _value: 'EXCEEDS' | 'MEETS' | 'BELOW') {}
  static EXCEEDS = new BonusTier('EXCEEDS')  // >= 85%
  static MEETS = new BonusTier('MEETS')      // 50-84%
  static BELOW = new BonusTier('BELOW')      // < 50%

  static fromPercentage(percentage: number): BonusTier
  get value(): string
}

export class ReviewStatus {
  private constructor(private readonly _value: string) {}
  static DRAFT = new ReviewStatus('DRAFT')
  static SUBMITTED = new ReviewStatus('SUBMITTED')
  static CALIBRATED = new ReviewStatus('CALIBRATED')
  get value(): string
}

export class Narrative {
  private constructor(private readonly _text: string) {
    const wordCount = _text.trim().split(/\s+/).length
    if (wordCount > 1000) {
      throw new NarrativeExceedsWordLimitException(wordCount)
    }
  }
  static fromText(text: string): Narrative
  get text(): string
  get wordCount(): number
}
```

### Entities

```typescript
// performance-reviews/domain/entities/

export class ReviewCycle {
  private constructor(
    private readonly _id: ReviewCycleId,
    private _name: string,
    private _year: number,
    private _status: CycleStatus,
    private _deadlines: CycleDeadlines,
    private _startDate: Date,
    private _endDate?: Date,
  ) {}

  static create(props: CreateReviewCycleProps): ReviewCycle

  start(): void
  enterCalibration(): void
  complete(): void

  get id(): ReviewCycleId
  get name(): string
  get year(): number
  get status(): CycleStatus
  get deadlines(): CycleDeadlines

  isPhaseActive(phase: ReviewPhase): boolean
  isDeadlinePassed(phase: ReviewPhase): boolean
}

export class SelfReview {
  private constructor(
    private readonly _id: SelfReviewId,
    private readonly _cycleId: ReviewCycleId,
    private readonly _userId: UserId,
    private _scores: PillarScores,
    private _narrative: Narrative,
    private _status: ReviewStatus,
  ) {}

  static create(props: CreateSelfReviewProps): SelfReview

  updateScores(scores: PillarScores): void
  updateNarrative(narrative: Narrative): void
  submit(): void

  get id(): SelfReviewId
  get scores(): PillarScores
  get narrative(): Narrative
  get isSubmitted(): boolean
}

export class PeerFeedback {
  private constructor(
    private readonly _id: PeerFeedbackId,
    private readonly _cycleId: ReviewCycleId,
    private readonly _revieweeId: UserId,
    private readonly _reviewerId: UserId,
    private _scores: PillarScores,
    private _strengths?: string,
    private _growthAreas?: string,
    private _generalComments?: string,
  ) {}

  static create(props: CreatePeerFeedbackProps): PeerFeedback

  get id(): PeerFeedbackId
  get scores(): PillarScores
  get isAnonymized(): boolean // Always true for reviewee view
}

export class ManagerEvaluation {
  private constructor(
    private readonly _id: ManagerEvaluationId,
    private readonly _cycleId: ReviewCycleId,
    private readonly _employeeId: UserId,
    private readonly _managerId: UserId,
    private _scores: PillarScores,
    private _narrative: string,
    private _developmentPlan: string,
    private _status: ReviewStatus,
  ) {}

  static create(props: CreateManagerEvaluationProps): ManagerEvaluation

  updateScores(scores: PillarScores): void
  submit(): void
  calibrate(): void

  applyCalibrationAdjustment(newScores: PillarScores, justification: string): void

  get scores(): PillarScores
  get isCalibrated(): boolean
}

export class FinalScore {
  private constructor(
    private readonly _id: FinalScoreId,
    private readonly _cycleId: ReviewCycleId,
    private readonly _userId: UserId,
    private _pillarScores: PillarScores,
    private _peerAverageScores: PillarScores | null,
    private _peerFeedbackCount: number,
    private _locked: boolean,
  ) {}

  static create(props: CreateFinalScoreProps): FinalScore
  static calculate(
    managerEvaluation: ManagerEvaluation,
    peerFeedback: PeerFeedback[],
    userLevel: EngineerLevel
  ): FinalScore

  get weightedScore(): WeightedScore
  get percentageScore(): number
  get bonusTier(): BonusTier

  lock(): void
  unlock(): void // Admin only

  get isLocked(): boolean
}
```

### Domain Services

```typescript
// performance-reviews/domain/services/

export class ScoreCalculationService {
  calculateWeightedScore(
    pillarScores: PillarScores,
    level: EngineerLevel
  ): WeightedScore {
    const weights = this.getWeightsForLevel(level)
    const weighted =
      pillarScores.projectImpact.value * weights.projectImpact +
      pillarScores.direction.value * weights.direction +
      pillarScores.engineeringExcellence.value * weights.engineeringExcellence +
      pillarScores.operationalOwnership.value * weights.operationalOwnership +
      pillarScores.peopleImpact.value * weights.peopleImpact

    return WeightedScore.fromValue(weighted)
  }

  private getWeightsForLevel(level: EngineerLevel): PillarWeights {
    // Returns level-specific weights
  }
}

export class PeerFeedbackAggregationService {
  aggregatePeerScores(feedbacks: PeerFeedback[]): PillarScores {
    if (feedbacks.length === 0) {
      throw new NoPeerFeedbackException()
    }

    // Calculate average for each pillar
    const sums = { projectImpact: 0, direction: 0, ... }
    feedbacks.forEach(fb => {
      sums.projectImpact += fb.scores.projectImpact.value
      // ... other pillars
    })

    return PillarScores.create({
      projectImpact: Math.round(sums.projectImpact / feedbacks.length),
      direction: Math.round(sums.direction / feedbacks.length),
      // ... other pillars
    })
  }

  anonymizeFeedback(feedbacks: PeerFeedback[]): AnonymizedPeerFeedback {
    // Strip reviewer identity, return aggregated data
  }
}

export class ReviewAuthorizationService {
  canViewReview(user: User, review: EmployeeReview): boolean {
    // Employee can view own review
    if (review.employeeId.equals(user.id)) return true

    // Manager can view reports' reviews
    if (user.isManagerOf(review.employee)) return true

    // HR admin can view all
    if (user.hasRole(Role.HR_ADMIN)) return true

    // Calibrators can view in their department
    if (user.hasRole(Role.CALIBRATOR) &&
        user.department === review.employee.department) return true

    return false
  }

  canSubmitPeerFeedback(reviewer: User, reviewee: User): boolean {
    // Cannot review self
    if (reviewee.id.equals(reviewer.id)) return false

    // Cannot review manager
    if (reviewer.isManagerOf(reviewee)) return false

    return true
  }

  canCalibrateScores(user: User, evaluation: ManagerEvaluation): boolean {
    return user.hasAnyRole([Role.CALIBRATOR, Role.HR_ADMIN])
  }

  canRequestScoreAdjustment(user: User, employee: User): boolean {
    return user.isManagerOf(employee)
  }

  canApproveScoreAdjustment(user: User): boolean {
    return user.hasRole(Role.HR_ADMIN)
  }
}
```

---

## 3. Repository Interfaces

```typescript
// performance-reviews/domain/repositories/

export interface IReviewCycleRepository {
  findById(id: ReviewCycleId): Promise<ReviewCycle | null>
  findByYear(year: number): Promise<ReviewCycle[]>
  findActive(): Promise<ReviewCycle | null>
  save(cycle: ReviewCycle): Promise<ReviewCycle>
  delete(id: ReviewCycleId): Promise<void>
}

export interface ISelfReviewRepository {
  findById(id: SelfReviewId): Promise<SelfReview | null>
  findByUserAndCycle(userId: UserId, cycleId: ReviewCycleId): Promise<SelfReview | null>
  save(review: SelfReview): Promise<SelfReview>
  delete(id: SelfReviewId): Promise<void>
}

export interface IPeerFeedbackRepository {
  findById(id: PeerFeedbackId): Promise<PeerFeedback | null>
  findByRevieweeAndCycle(revieweeId: UserId, cycleId: ReviewCycleId): Promise<PeerFeedback[]>
  findByReviewerAndCycle(reviewerId: UserId, cycleId: ReviewCycleId): Promise<PeerFeedback[]>
  save(feedback: PeerFeedback): Promise<PeerFeedback>
  delete(id: PeerFeedbackId): Promise<void>
}

export interface IManagerEvaluationRepository {
  findById(id: ManagerEvaluationId): Promise<ManagerEvaluation | null>
  findByEmployeeAndCycle(employeeId: UserId, cycleId: ReviewCycleId): Promise<ManagerEvaluation | null>
  findByManagerAndCycle(managerId: UserId, cycleId: ReviewCycleId): Promise<ManagerEvaluation[]>
  save(evaluation: ManagerEvaluation): Promise<ManagerEvaluation>
  delete(id: ManagerEvaluationId): Promise<void>
}

export interface IFinalScoreRepository {
  findById(id: FinalScoreId): Promise<FinalScore | null>
  findByUserAndCycle(userId: UserId, cycleId: ReviewCycleId): Promise<FinalScore | null>
  findByCycle(cycleId: ReviewCycleId): Promise<FinalScore[]>
  findByBonusTier(cycleId: ReviewCycleId, tier: BonusTier): Promise<FinalScore[]>
  save(score: FinalScore): Promise<FinalScore>
  delete(id: FinalScoreId): Promise<void>
}

export interface IScoreAdjustmentRequestRepository {
  findById(id: string): Promise<ScoreAdjustmentRequest | null>
  findPending(): Promise<ScoreAdjustmentRequest[]>
  save(request: ScoreAdjustmentRequest): Promise<ScoreAdjustmentRequest>
}
```

---

## 4. Key Relationships

```
User (extended)
├── manages → User[] (direct reports)
├── managed by → User (manager)
├── submits → SelfReview[]
├── nominates → PeerNomination[]
├── receives nominations → PeerNomination[]
├── provides → PeerFeedback[]
├── receives → PeerFeedback[]
├── evaluates → ManagerEvaluation[] (as manager)
├── evaluated by → ManagerEvaluation[] (as employee)
└── has → FinalScore[]

ReviewCycle
├── contains → SelfReview[]
├── contains → PeerNomination[]
├── contains → PeerFeedback[]
├── contains → ManagerEvaluation[]
├── contains → CalibrationSession[]
└── contains → FinalScore[]

EmployeeReview (aggregate)
├── has one → SelfReview
├── has many → PeerFeedback[] (3-5)
├── has one → ManagerEvaluation
└── has one → FinalScore
```

---

## 5. Data Migration Plan

### Phase 1: User Extensions
```sql
-- Add new columns to User table
ALTER TABLE "User" ADD COLUMN "level" TEXT;
ALTER TABLE "User" ADD COLUMN "department" TEXT;
ALTER TABLE "User" ADD COLUMN "jobTitle" TEXT;
ALTER TABLE "User" ADD COLUMN "managerId" TEXT;

-- Add indexes
CREATE INDEX "User_managerId_idx" ON "User"("managerId");
CREATE INDEX "User_department_idx" ON "User"("department");
CREATE INDEX "User_level_idx" ON "User"("level");

-- Add foreign key constraint
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "User"("id");
```

### Phase 2: Create Review Tables
```bash
# Generate Prisma migration
npx prisma migrate dev --name add-performance-reviews

# This will create all new tables: ReviewCycle, SelfReview, PeerNomination,
# PeerFeedback, ManagerEvaluation, CalibrationSession, CalibrationAdjustment,
# ScoreAdjustmentRequest, FinalScore
```

### Phase 3: Seed Initial Data
```typescript
// Assign levels and managers to existing users
// Create first ReviewCycle for testing
```

---

## 6. Data Retention Policy

Based on user decision (3 years retention):

```typescript
// Soft delete cycles older than 3 years
async archiveOldCycles() {
  const threeYearsAgo = new Date()
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)

  await prisma.reviewCycle.updateMany({
    where: {
      year: { lt: threeYearsAgo.getFullYear() },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  })
}

// This cascades to all related entities via onDelete: Cascade
```

---

## Summary

This data model supports:
- ✅ 5-pillar evaluation with level-scaled weights
- ✅ Full review cycle (self, peer, manager, calibration)
- ✅ Anonymized peer feedback
- ✅ Post-calibration score adjustments with approval workflow
- ✅ 3-year data retention
- ✅ Annual review cycles only
- ✅ Clean Architecture (domain entities separate from Prisma models)
- ✅ Audit trail (all entities have timestamps)
- ✅ Soft deletes for historical data
