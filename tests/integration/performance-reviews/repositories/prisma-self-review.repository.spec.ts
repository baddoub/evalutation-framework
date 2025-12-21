import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from '../../../../src/auth/infrastructure/persistence/prisma/prisma.service'
import { PrismaSelfReviewRepository } from '../../../../src/performance-reviews/infrastructure/persistence/repositories/prisma-self-review.repository'
import { SelfReview } from '../../../../src/performance-reviews/domain/entities/self-review.entity'
import { ReviewCycleId } from '../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../src/auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../../src/performance-reviews/domain/value-objects/pillar-scores.vo'
import { Narrative } from '../../../../src/performance-reviews/domain/value-objects/narrative.vo'

describe('PrismaSelfReviewRepository (Integration)', () => {
  let repository: PrismaSelfReviewRepository
  let prisma: PrismaService
  let testCycleId: ReviewCycleId
  let testUserId: UserId

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [PrismaService, PrismaSelfReviewRepository],
    }).compile()

    repository = module.get<PrismaSelfReviewRepository>(PrismaSelfReviewRepository)
    prisma = module.get<PrismaService>(PrismaService)
    await prisma.$connect()

    // Setup test data
    testCycleId = ReviewCycleId.generate()
    testUserId = UserId.generate()

    // Create test cycle (minimal data)
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

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId.value,
        email: 'test@example.com',
        name: 'Test User',
        keycloakId: 'test-keycloak-id',
        level: 'Senior',
        department: 'Engineering',
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.selfReview.deleteMany({})
    await prisma.reviewCycle.deleteMany({})
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean self reviews before each test
    await prisma.selfReview.deleteMany({})
  })

  describe('save and findById', () => {
    it('should save and retrieve a self review', async () => {
      // Arrange
      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      const narrative = Narrative.fromString('This is my self review narrative.')

      const selfReview = SelfReview.create({
        cycleId: testCycleId,
        userId: testUserId,
        scores,
        narrative,
      })

      // Act
      const saved = await repository.save(selfReview)
      const found = await repository.findById(saved.id)

      // Assert
      expect(found).toBeDefined()
      expect(found?.id.value).toBe(selfReview.id.value)
      expect(found?.scores.projectImpact.value).toBe(3)
      expect(found?.narrative.value).toBe('This is my self review narrative.')
      expect(found?.status.value).toBe('DRAFT')
    })
  })

  describe('findByUserAndCycle', () => {
    it('should find self review by user and cycle', async () => {
      // Arrange
      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      const narrative = Narrative.fromString('Test narrative')

      const selfReview = SelfReview.create({
        cycleId: testCycleId,
        userId: testUserId,
        scores,
        narrative,
      })

      await repository.save(selfReview)

      // Act
      const found = await repository.findByUserAndCycle(testUserId, testCycleId)

      // Assert
      expect(found).toBeDefined()
      expect(found?.userId.value).toBe(testUserId.value)
      expect(found?.cycleId.value).toBe(testCycleId.value)
    })

    it('should return null when no review exists for user and cycle', async () => {
      // Act
      const found = await repository.findByUserAndCycle(UserId.generate(), testCycleId)

      // Assert
      expect(found).toBeNull()
    })
  })

  describe('findByCycle', () => {
    it('should find all self reviews for a cycle', async () => {
      // Arrange
      const user2Id = UserId.generate()
      await prisma.user.create({
        data: {
          id: user2Id.value,
          email: 'test2@example.com',
          name: 'Test User 2',
          keycloakId: 'test-keycloak-id-2',
        },
      })

      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      const narrative = Narrative.fromString('Test narrative')

      const review1 = SelfReview.create({ cycleId: testCycleId, userId: testUserId, scores, narrative })
      const review2 = SelfReview.create({ cycleId: testCycleId, userId: user2Id, scores, narrative })

      await repository.save(review1)
      await repository.save(review2)

      // Act
      const reviews = await repository.findByCycle(testCycleId)

      // Assert
      expect(reviews).toHaveLength(2)
      expect(reviews.map((r) => r.userId.value)).toContain(testUserId.value)
      expect(reviews.map((r) => r.userId.value)).toContain(user2Id.value)

      // Cleanup
      await prisma.user.delete({ where: { id: user2Id.value } })
    })
  })

  describe('update', () => {
    it('should update scores and narrative', async () => {
      // Arrange
      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      const narrative = Narrative.fromString('Original narrative')

      const selfReview = SelfReview.create({
        cycleId: testCycleId,
        userId: testUserId,
        scores,
        narrative,
      })

      await repository.save(selfReview)

      // Act - update scores and narrative
      const newScores = PillarScores.create({
        projectImpact: 4,
        direction: 3,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 3,
      })

      const newNarrative = Narrative.fromString('Updated narrative')

      selfReview.updateScores(newScores)
      selfReview.updateNarrative(newNarrative)

      const updated = await repository.save(selfReview)

      // Assert
      const found = await repository.findById(selfReview.id)
      expect(found?.scores.projectImpact.value).toBe(4)
      expect(found?.narrative.value).toBe('Updated narrative')
    })
  })

  describe('submit', () => {
    it('should persist submission status', async () => {
      // Arrange
      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      const narrative = Narrative.fromString('Test narrative')

      const selfReview = SelfReview.create({
        cycleId: testCycleId,
        userId: testUserId,
        scores,
        narrative,
      })

      await repository.save(selfReview)

      // Act
      selfReview.submit()
      await repository.save(selfReview)

      // Assert
      const found = await repository.findById(selfReview.id)
      expect(found?.status.value).toBe('SUBMITTED')
      expect(found?.submittedAt).toBeDefined()
    })
  })

  describe('delete', () => {
    it('should soft delete a self review', async () => {
      // Arrange
      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      const narrative = Narrative.fromString('Test narrative')

      const selfReview = SelfReview.create({
        cycleId: testCycleId,
        userId: testUserId,
        scores,
        narrative,
      })

      await repository.save(selfReview)

      // Act
      await repository.delete(selfReview.id)

      // Assert
      const found = await repository.findById(selfReview.id)
      expect(found).toBeNull()

      // Verify soft delete
      const rawRecord = await prisma.selfReview.findUnique({
        where: { id: selfReview.id.value },
      })
      expect(rawRecord).toBeDefined()
      expect(rawRecord?.deletedAt).toBeDefined()
    })
  })
})
