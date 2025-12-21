import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from '../../../../src/auth/infrastructure/persistence/prisma/prisma.service'
import { PrismaReviewCycleRepository } from '../../../../src/performance-reviews/infrastructure/persistence/repositories/prisma-review-cycle.repository'
import { ReviewCycle } from '../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { CycleDeadlines } from '../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'

describe('PrismaReviewCycleRepository (Integration)', () => {
  let repository: PrismaReviewCycleRepository
  let prisma: PrismaService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [PrismaService, PrismaReviewCycleRepository],
    }).compile()

    repository = module.get<PrismaReviewCycleRepository>(PrismaReviewCycleRepository)
    prisma = module.get<PrismaService>(PrismaService)
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean test data
    await prisma.reviewCycle.deleteMany({})
  })

  describe('save and findById', () => {
    it('should save and retrieve a review cycle', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      // Act
      const saved = await repository.save(cycle)
      const found = await repository.findById(saved.id)

      // Assert
      expect(found).toBeDefined()
      expect(found?.id.value).toBe(cycle.id.value)
      expect(found?.name).toBe('2025 Annual Review')
      expect(found?.year).toBe(2025)
      expect(found?.status.value).toBe('DRAFT')
    })

    it('should return null for non-existent ID', async () => {
      // Act
      const found = await repository.findById(ReviewCycleId.generate())

      // Assert
      expect(found).toBeNull()
    })
  })

  describe('findByYear', () => {
    it('should find all review cycles for a specific year', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycle1 = ReviewCycle.create({ name: 'Q1 2025', year: 2025, deadlines })
      const cycle2 = ReviewCycle.create({ name: 'Q2 2025', year: 2025, deadlines })
      const cycle3 = ReviewCycle.create({ name: 'Q1 2024', year: 2024, deadlines })

      await repository.save(cycle1)
      await repository.save(cycle2)
      await repository.save(cycle3)

      // Act
      const cycles = await repository.findByYear(2025)

      // Assert
      expect(cycles).toHaveLength(2)
      expect(cycles.map((c) => c.name)).toContain('Q1 2025')
      expect(cycles.map((c) => c.name)).toContain('Q2 2025')
    })

    it('should return empty array for year with no cycles', async () => {
      // Act
      const cycles = await repository.findByYear(2099)

      // Assert
      expect(cycles).toEqual([])
    })
  })

  describe('findActive', () => {
    it('should find the active review cycle', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const draftCycle = ReviewCycle.create({ name: 'Draft Cycle', year: 2025, deadlines })
      const activeCycle = ReviewCycle.create({ name: 'Active Cycle', year: 2025, deadlines })
      activeCycle.start()

      await repository.save(draftCycle)
      await repository.save(activeCycle)

      // Act
      const found = await repository.findActive()

      // Assert
      expect(found).toBeDefined()
      expect(found?.name).toBe('Active Cycle')
      expect(found?.status.value).toBe('ACTIVE')
    })

    it('should return null when no active cycle exists', async () => {
      // Act
      const found = await repository.findActive()

      // Assert
      expect(found).toBeNull()
    })
  })

  describe('update', () => {
    it('should update an existing review cycle', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycle = ReviewCycle.create({ name: 'Original Name', year: 2025, deadlines })
      await repository.save(cycle)

      // Act - modify and save again
      const cycleToUpdate = cycle as any
      cycleToUpdate._name = 'Updated Name'
      const updated = await repository.save(cycleToUpdate)

      // Assert
      const found = await repository.findById(cycle.id)
      expect(found?.name).toBe('Updated Name')
    })
  })

  describe('delete', () => {
    it('should soft delete a review cycle', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycle = ReviewCycle.create({ name: 'To Delete', year: 2025, deadlines })
      await repository.save(cycle)

      // Act
      await repository.delete(cycle.id)

      // Assert
      const found = await repository.findById(cycle.id)
      expect(found).toBeNull()

      // Verify it's soft deleted (still in DB)
      const rawRecord = await prisma.reviewCycle.findUnique({
        where: { id: cycle.id.value },
      })
      expect(rawRecord).toBeDefined()
      expect(rawRecord?.deletedAt).toBeDefined()
    })
  })

  describe('state transitions', () => {
    it('should persist state changes', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycle = ReviewCycle.create({ name: 'State Test', year: 2025, deadlines })
      await repository.save(cycle)

      // Act - transition through states
      cycle.start()
      await repository.save(cycle)

      cycle.enterCalibration()
      await repository.save(cycle)

      cycle.complete()
      const completed = await repository.save(cycle)

      // Assert
      const found = await repository.findById(cycle.id)
      expect(found?.status.value).toBe('COMPLETED')
      expect(found?.endDate).toBeDefined()
    })
  })
})
