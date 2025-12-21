import { Test, TestingModule } from '@nestjs/testing'
import { GetMySelfReviewUseCase } from '../../../../../../src/performance-reviews/application/use-cases/self-reviews/get-my-self-review.use-case'
import { ISelfReviewRepository } from '../../../../../../src/performance-reviews/domain/repositories/self-review.repository.interface'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { SelfReview } from '../../../../../../src/performance-reviews/domain/entities/self-review.entity'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../../../src/auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../../../../src/performance-reviews/domain/value-objects/pillar-scores.vo'
import { Narrative } from '../../../../../../src/performance-reviews/domain/value-objects/narrative.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('GetMySelfReviewUseCase', () => {
  let useCase: GetMySelfReviewUseCase
  let selfReviewRepo: jest.Mocked<ISelfReviewRepository>
  let cycleRepo: jest.Mocked<IReviewCycleRepository>

  beforeEach(async () => {
    const mockSelfReviewRepo = {
      findByUserAndCycle: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByCycle: jest.fn(),
      delete: jest.fn(),
    }

    const mockCycleRepo = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMySelfReviewUseCase,
        { provide: 'ISelfReviewRepository', useValue: mockSelfReviewRepo },
        { provide: 'IReviewCycleRepository', useValue: mockCycleRepo },
      ],
    }).compile()

    useCase = module.get<GetMySelfReviewUseCase>(GetMySelfReviewUseCase)
    selfReviewRepo = module.get('ISelfReviewRepository')
    cycleRepo = module.get('IReviewCycleRepository')
  })

  describe('execute', () => {
    it('should return existing self-review', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

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

      const review = SelfReview.create({
        userId,
        cycleId,
        scores: PillarScores.create({
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        }),
        narrative: Narrative.fromText('My self-review narrative'),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(review)

      // Act
      const result = await useCase.execute({ userId, cycleId })

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(review.id.value)
      expect(result.status).toBe('DRAFT')
      expect(result.scores.projectImpact).toBe(3)
      expect(result.narrative).toBe('My self-review narrative')
      expect(selfReviewRepo.save).not.toHaveBeenCalled()
    })

    it('should create new draft review if none exists', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

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

      const newReview = SelfReview.create({
        userId,
        cycleId,
        scores: PillarScores.create({
          projectImpact: 0,
          direction: 0,
          engineeringExcellence: 0,
          operationalOwnership: 0,
          peopleImpact: 0,
        }),
        narrative: Narrative.fromText(''),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(null)
      selfReviewRepo.save.mockResolvedValue(newReview)

      // Act
      const result = await useCase.execute({ userId, cycleId })

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('DRAFT')
      expect(result.scores.projectImpact).toBe(0)
      expect(result.narrative).toBe('')
      expect(selfReviewRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        cycleId,
      }))
    })

    it('should throw error if cycle not found', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      cycleRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute({ userId, cycleId })).rejects.toThrow(ReviewNotFoundException)
      expect(selfReviewRepo.findByUserAndCycle).not.toHaveBeenCalled()
    })

    it('should return review with correct word count', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

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

      const narrativeText = 'This is my self-review narrative with multiple words'
      const review = SelfReview.create({
        userId,
        cycleId,
        scores: PillarScores.create({
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        }),
        narrative: Narrative.fromText(narrativeText),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(review)

      // Act
      const result = await useCase.execute({ userId, cycleId })

      // Assert
      expect(result.narrative).toBe(narrativeText)
      expect(result.wordCount).toBe(9) // 9 words in the narrative
    })

    it('should create review with all pillar scores at 0', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

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

      const newReview = SelfReview.create({
        userId,
        cycleId,
        scores: PillarScores.create({
          projectImpact: 0,
          direction: 0,
          engineeringExcellence: 0,
          operationalOwnership: 0,
          peopleImpact: 0,
        }),
        narrative: Narrative.fromText(''),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(null)
      selfReviewRepo.save.mockResolvedValue(newReview)

      // Act
      const result = await useCase.execute({ userId, cycleId })

      // Assert
      expect(result.scores.projectImpact).toBe(0)
      expect(result.scores.direction).toBe(0)
      expect(result.scores.engineeringExcellence).toBe(0)
      expect(result.scores.operationalOwnership).toBe(0)
      expect(result.scores.peopleImpact).toBe(0)
    })
  })
})
