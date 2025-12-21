import { Test, TestingModule } from '@nestjs/testing'
import { UpdateSelfReviewUseCase } from '../../../../../../src/performance-reviews/application/use-cases/self-reviews/update-self-review.use-case'
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
import { NarrativeExceedsWordLimitException } from '../../../../../../src/performance-reviews/domain/exceptions/narrative-exceeds-word-limit.exception'
import { InvalidPillarScoreException } from '../../../../../../src/performance-reviews/domain/exceptions/invalid-pillar-score.exception'

describe('UpdateSelfReviewUseCase', () => {
  let useCase: UpdateSelfReviewUseCase
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
        UpdateSelfReviewUseCase,
        { provide: 'ISelfReviewRepository', useValue: mockSelfReviewRepo },
        { provide: 'IReviewCycleRepository', useValue: mockCycleRepo },
      ],
    }).compile()

    useCase = module.get<UpdateSelfReviewUseCase>(UpdateSelfReviewUseCase)
    selfReviewRepo = module.get('ISelfReviewRepository')
    cycleRepo = module.get('IReviewCycleRepository')
  })

  describe('execute', () => {
    it('should update self-review successfully', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-12-31'), // Future deadline
        peerFeedback: new Date('2026-01-15'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-12-01'),
      })

      const review = SelfReview.create({
        userId,
        cycleId,
        scores: PillarScores.create({
          projectImpact: 2,
          direction: 2,
          engineeringExcellence: 2,
          operationalOwnership: 2,
          peopleImpact: 2,
        }),
        narrative: Narrative.fromText('Old narrative'),
      })

      const input = {
        userId,
        cycleId,
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'Updated narrative text',
      }

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(review)
      selfReviewRepo.save.mockResolvedValue(review)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.scores.projectImpact).toBe(3)
      expect(result.scores.engineeringExcellence).toBe(4)
      expect(result.narrative).toBe('Updated narrative text')
      expect(selfReviewRepo.save).toHaveBeenCalledWith(review)
    })

    it('should throw error if cycle not found', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const input = {
        userId,
        cycleId,
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'Updated narrative',
      }

      cycleRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      expect(selfReviewRepo.save).not.toHaveBeenCalled()
    })

    it('should throw error if deadline passed', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2024-02-28'), // Past deadline
        peerFeedback: new Date('2024-03-15'),
        managerEvaluation: new Date('2024-03-31'),
        calibration: new Date('2024-04-15'),
        feedbackDelivery: new Date('2024-04-30'),
      })

      const cycle = ReviewCycle.create({
        name: '2024 Annual Review',
        year: 2024,
        deadlines,
        startDate: new Date('2024-02-01'),
      })

      const input = {
        userId,
        cycleId,
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'Updated narrative',
      }

      cycleRepo.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Self-review deadline has passed')
      expect(selfReviewRepo.save).not.toHaveBeenCalled()
    })

    it('should throw error if review not found', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-12-31'),
        peerFeedback: new Date('2026-01-15'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-12-01'),
      })

      const input = {
        userId,
        cycleId,
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'Updated narrative',
      }

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      expect(selfReviewRepo.save).not.toHaveBeenCalled()
    })

    it('should throw error if score is invalid', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-12-31'),
        peerFeedback: new Date('2026-01-15'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-12-01'),
      })

      const input = {
        userId,
        cycleId,
        scores: {
          projectImpact: 5, // Invalid - max is 4
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'Updated narrative',
      }

      cycleRepo.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InvalidPillarScoreException)
    })

    it('should throw error if narrative exceeds word limit', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-12-31'),
        peerFeedback: new Date('2026-01-15'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-12-01'),
      })

      // Create a narrative with more than 1000 words
      const longNarrative = Array(1001).fill('word').join(' ')

      const input = {
        userId,
        cycleId,
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: longNarrative,
      }

      cycleRepo.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NarrativeExceedsWordLimitException)
    })

    it('should update narrative and maintain word count', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-12-31'),
        peerFeedback: new Date('2026-01-15'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-12-01'),
      })

      const review = SelfReview.create({
        userId,
        cycleId,
        scores: PillarScores.create({
          projectImpact: 2,
          direction: 2,
          engineeringExcellence: 2,
          operationalOwnership: 2,
          peopleImpact: 2,
        }),
        narrative: Narrative.fromText('Old narrative'),
      })

      const newNarrativeText = 'This is my updated self-review narrative with exactly ten words'
      const input = {
        userId,
        cycleId,
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: newNarrativeText,
      }

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(review)
      selfReviewRepo.save.mockResolvedValue(review)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.narrative).toBe(newNarrativeText)
      expect(result.wordCount).toBe(10)
    })
  })
})
