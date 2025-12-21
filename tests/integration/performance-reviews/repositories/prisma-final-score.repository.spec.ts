import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from '../../../../src/auth/infrastructure/persistence/prisma/prisma.service'
import { PrismaFinalScoreRepository } from '../../../../src/performance-reviews/infrastructure/persistence/repositories/prisma-final-score.repository'
import { FinalScore } from '../../../../src/performance-reviews/domain/entities/final-score.entity'
import { ReviewCycleId } from '../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../src/auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../../src/performance-reviews/domain/value-objects/pillar-scores.vo'
import { WeightedScore } from '../../../../src/performance-reviews/domain/value-objects/weighted-score.vo'
import { BonusTier } from '../../../../src/performance-reviews/domain/value-objects/bonus-tier.vo'

describe('PrismaFinalScoreRepository (Integration)', () => {
  let repository: PrismaFinalScoreRepository
  let prisma: PrismaService
  let testCycleId: ReviewCycleId
  let testUserId: UserId

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [PrismaService, PrismaFinalScoreRepository],
    }).compile()

    repository = module.get<PrismaFinalScoreRepository>(PrismaFinalScoreRepository)
    prisma = module.get<PrismaService>(PrismaService)
    await prisma.$connect()

    // Setup test data
    testCycleId = ReviewCycleId.generate()
    testUserId = UserId.generate()

    await prisma.reviewCycle.create({
      data: {
        id: testCycleId.value,
        name: 'Test Cycle',
        year: 2025,
        status: 'ACTIVE',
        selfReviewDeadline: new Date('2025-02-28'),
        peerFeedbackDeadline: new Date('2025-03-15'),
        managerEvalDeadline: new Date('2025-03-31'),
        calibrationDeadline: new Date('2025-04-15'),
        feedbackDeliveryDeadline: new Date('2025-04-30'),
        startDate: new Date('2025-02-01'),
      },
    })

    await prisma.user.create({
      data: {
        id: testUserId.value,
        email: 'test@example.com',
        name: 'Test User',
        keycloakId: 'test-keycloak-id',
      },
    })
  })

  afterAll(async () => {
    await prisma.finalScore.deleteMany({})
    await prisma.reviewCycle.deleteMany({})
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await prisma.finalScore.deleteMany({})
  })

  it('should save and retrieve final score', async () => {
    const pillarScores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const weightedScore = WeightedScore.fromValue(2.8)

    const finalScore = FinalScore.create({
      cycleId: testCycleId,
      userId: testUserId,
      pillarScores,
      weightedScore,
      peerFeedbackCount: 5,
    })

    const saved = await repository.save(finalScore)
    const found = await repository.findById(saved.id)

    expect(found).toBeDefined()
    expect(found?.userId.value).toBe(testUserId.value)
    expect(found?.weightedScore.value).toBe(2.8)
    expect(found?.peerFeedbackCount).toBe(5)
  })

  it('should find final score by user and cycle', async () => {
    const pillarScores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const weightedScore = WeightedScore.fromValue(2.8)

    const finalScore = FinalScore.create({
      cycleId: testCycleId,
      userId: testUserId,
      pillarScores,
      weightedScore,
    })

    await repository.save(finalScore)

    const found = await repository.findByUserAndCycle(testUserId, testCycleId)

    expect(found).toBeDefined()
    expect(found?.userId.value).toBe(testUserId.value)
  })

  it('should find final scores by cycle', async () => {
    const pillarScores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const weightedScore = WeightedScore.fromValue(2.8)

    const finalScore = FinalScore.create({
      cycleId: testCycleId,
      userId: testUserId,
      pillarScores,
      weightedScore,
    })

    await repository.save(finalScore)

    const scores = await repository.findByCycle(testCycleId)

    expect(scores).toHaveLength(1)
    expect(scores[0].cycleId.value).toBe(testCycleId.value)
  })

  it('should find final scores by bonus tier', async () => {
    const pillarScores = PillarScores.create({
      projectImpact: 4,
      direction: 4,
      engineeringExcellence: 4,
      operationalOwnership: 4,
      peopleImpact: 4,
    })

    const weightedScore = WeightedScore.fromValue(3.5) // EXCEEDS tier

    const finalScore = FinalScore.create({
      cycleId: testCycleId,
      userId: testUserId,
      pillarScores,
      weightedScore,
    })

    await repository.save(finalScore)

    const exceedsScores = await repository.findByBonusTier(testCycleId, BonusTier.EXCEEDS)

    expect(exceedsScores).toHaveLength(1)
    expect(exceedsScores[0].bonusTier.value).toBe('EXCEEDS')
  })

  it('should persist locked status', async () => {
    const pillarScores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const weightedScore = WeightedScore.fromValue(2.8)

    const finalScore = FinalScore.create({
      cycleId: testCycleId,
      userId: testUserId,
      pillarScores,
      weightedScore,
    })

    await repository.save(finalScore)

    finalScore.lock()
    await repository.save(finalScore)

    const found = await repository.findById(finalScore.id)
    expect(found?.isLocked).toBe(true)
    expect(found?.lockedAt).toBeDefined()
  })

  it('should persist feedback delivered status', async () => {
    const pillarScores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const weightedScore = WeightedScore.fromValue(2.8)

    const finalScore = FinalScore.create({
      cycleId: testCycleId,
      userId: testUserId,
      pillarScores,
      weightedScore,
    })

    await repository.save(finalScore)

    finalScore.markFeedbackDelivered()
    await repository.save(finalScore)

    const found = await repository.findById(finalScore.id)
    expect(found?.feedbackDelivered).toBe(true)
    expect(found?.feedbackDeliveredAt).toBeDefined()
  })

  it('should save and retrieve peer average scores', async () => {
    const pillarScores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const peerAverageScores = PillarScores.create({
      projectImpact: 3,
      direction: 3,
      engineeringExcellence: 3,
      operationalOwnership: 3,
      peopleImpact: 3,
    })

    const weightedScore = WeightedScore.fromValue(2.8)

    const finalScore = FinalScore.create({
      cycleId: testCycleId,
      userId: testUserId,
      pillarScores,
      weightedScore,
      peerAverageScores,
      peerFeedbackCount: 5,
    })

    const saved = await repository.save(finalScore)
    const found = await repository.findById(saved.id)

    expect(found?.peerAverageScores).toBeDefined()
    expect(found?.peerAverageScores?.projectImpact.value).toBe(3)
  })

  it('should soft delete final score', async () => {
    const pillarScores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const weightedScore = WeightedScore.fromValue(2.8)

    const finalScore = FinalScore.create({
      cycleId: testCycleId,
      userId: testUserId,
      pillarScores,
      weightedScore,
    })

    await repository.save(finalScore)
    await repository.delete(finalScore.id)

    const found = await repository.findById(finalScore.id)
    expect(found).toBeNull()

    const rawRecord = await prisma.finalScore.findUnique({
      where: { id: finalScore.id.value },
    })
    expect(rawRecord?.deletedAt).toBeDefined()
  })
})
