import { SubmitSelfReviewUseCase } from './submit-self-review.use-case'
import type { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { SelfReviewAlreadySubmittedException } from '../../../domain/exceptions/self-review-already-submitted.exception'
import { SelfReview } from '../../../domain/entities/self-review.entity'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import type { SelfReviewId } from '../../../domain/value-objects/self-review-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { Narrative } from '../../../domain/value-objects/narrative.vo'
import { ReviewStatus } from '../../../domain/value-objects/review-status.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import type { SubmitSelfReviewInput, SubmitSelfReviewOutput } from '../../dto/self-review.dto'

describe('SubmitSelfReviewUseCase', () => {
  let useCase: SubmitSelfReviewUseCase
  let mockSelfReviewRepository: jest.Mocked<ISelfReviewRepository>
  let mockCycleRepository: jest.Mocked<IReviewCycleRepository>

  const createValidReviewCycle = (): ReviewCycle => {
    const deadlines = CycleDeadlines.create({
      selfReview: new Date('2025-12-31'),
      peerFeedback: new Date('2026-01-15'),
      managerEvaluation: new Date('2026-01-31'),
      calibration: new Date('2026-02-28'),
      feedbackDelivery: new Date('2026-03-31'),
    })

    const cycle = ReviewCycle.create({
      name: 'Performance Review 2025',
      year: 2025,
      deadlines,
      startDate: new Date('2025-01-01'),
    })
    return cycle
  }

  const createValidSelfReview = (
    overrides?: Partial<{
      id: SelfReviewId
      cycleId: ReviewCycleId
      userId: UserId
      scores: PillarScores
      narrative: Narrative
    }>,
  ): SelfReview => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const userId = overrides?.userId || UserId.generate()

    return SelfReview.create({
      id: overrides?.id,
      cycleId,
      userId,
      scores:
        overrides?.scores ||
        PillarScores.create({
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        }),
      narrative: overrides?.narrative || Narrative.create('This is my self-review narrative'),
    })
  }

  beforeEach(() => {
    mockSelfReviewRepository = {
      findById: jest.fn(),
      findByUserAndCycle: jest.fn(),
      findByCycle: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    mockCycleRepository = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    useCase = new SubmitSelfReviewUseCase(mockSelfReviewRepository, mockCycleRepository)
  })

  describe('successful submission', () => {
    it('should submit draft review successfully (DRAFT → SUBMITTED)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
      })

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      const submittedReview = createValidSelfReview({
        id: review.id,
        cycleId,
        userId,
        scores: review.scores,
        narrative: review.narrative,
      })
      // Manually transition to SUBMITTED to simulate what save would return
      submittedReview.submit()
      mockSelfReviewRepository.save.mockResolvedValue(submittedReview)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toEqual<SubmitSelfReviewOutput>({
        id: submittedReview.id.value,
        status: ReviewStatus.SUBMITTED.value,
        submittedAt: submittedReview.submittedAt!,
      })
      expect(result.status).toBe('SUBMITTED')
      expect(result.submittedAt).toBeInstanceOf(Date)
    })

    it('should set submittedAt timestamp', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
      })

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      const beforeSubmit = new Date()
      const submittedReview = createValidSelfReview({
        id: review.id,
        cycleId,
        userId,
        scores: review.scores,
        narrative: review.narrative,
      })
      submittedReview.submit()
      mockSelfReviewRepository.save.mockResolvedValue(submittedReview)

      // Act
      const result = await useCase.execute(input)
      const afterSubmit = new Date()

      // Assert
      expect(result.submittedAt).toBeDefined()
      expect(result.submittedAt.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime())
      expect(result.submittedAt.getTime()).toBeLessThanOrEqual(afterSubmit.getTime())
    })

    it('should persist changes to repository', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
      })

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      const submittedReview = createValidSelfReview({
        id: review.id,
        cycleId,
        userId,
        scores: review.scores,
        narrative: review.narrative,
      })
      submittedReview.submit()
      mockSelfReviewRepository.save.mockResolvedValue(submittedReview)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockSelfReviewRepository.save).toHaveBeenCalledTimes(1)
      expect(mockSelfReviewRepository.save).toHaveBeenCalledWith(review)
    })

    it('should return correct DTO with status and submittedAt', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
      })

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      const submittedReview = createValidSelfReview({
        id: review.id,
        cycleId,
        userId,
        scores: review.scores,
        narrative: review.narrative,
      })
      submittedReview.submit()
      mockSelfReviewRepository.save.mockResolvedValue(submittedReview)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('submittedAt')
      expect(typeof result.id).toBe('string')
      expect(typeof result.status).toBe('string')
      expect(result.submittedAt).toBeInstanceOf(Date)
    })
  })

  describe('validation: cycle existence', () => {
    it('should throw ReviewNotFoundException if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow(
        `Review cycle with ID ${cycleId.value} not found`,
      )
    })

    it('should not proceed to find review if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockSelfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled()
    })
  })

  describe('validation: deadline check', () => {
    it('should throw Error if self-review deadline has passed', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()

      // Mock hasDeadlinePassed to return true
      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Self-review deadline has passed')
    })

    it('should not proceed to find review if deadline has passed', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockSelfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled()
    })

    it('should check deadline using cycle.hasDeadlinePassed method', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()

      const hasDeadlinePassedSpy = jest.spyOn(cycle, 'hasDeadlinePassed')
      hasDeadlinePassedSpy.mockReturnValue(true)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(hasDeadlinePassedSpy).toHaveBeenCalledWith('selfReview')
    })

    it('should allow submission when deadline has not passed', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
      })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      const submittedReview = createValidSelfReview({
        id: review.id,
        cycleId,
        userId,
        scores: review.scores,
        narrative: review.narrative,
      })
      submittedReview.submit()
      mockSelfReviewRepository.save.mockResolvedValue(submittedReview)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockSelfReviewRepository.findByUserAndCycle).toHaveBeenCalled()
    })
  })

  describe('validation: review existence', () => {
    it('should throw ReviewNotFoundException if self-review not found', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow(
        'Self-review not found for this user and cycle',
      )
    })

    it('should not proceed to submit if review is not found', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockSelfReviewRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('validation: narrative completeness', () => {
    it('should throw Error if narrative is empty', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
        narrative: Narrative.create(''),
      })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Cannot submit incomplete self-review. Narrative is required.',
      )
    })

    it('should throw Error if narrative is only whitespace', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
        narrative: Narrative.create('   \n\t  '),
      })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Cannot submit incomplete self-review. Narrative is required.',
      )
    })

    it('should not proceed to submit if narrative is empty', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
        narrative: Narrative.create(''),
      })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockSelfReviewRepository.save).not.toHaveBeenCalled()
    })

    it('should allow submission with valid non-empty narrative', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
        narrative: Narrative.create('This is a comprehensive self-review narrative'),
      })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      const submittedReview = createValidSelfReview({
        id: review.id,
        cycleId,
        userId,
        scores: review.scores,
        narrative: review.narrative,
      })
      submittedReview.submit()
      mockSelfReviewRepository.save.mockResolvedValue(submittedReview)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockSelfReviewRepository.save).toHaveBeenCalled()
    })
  })

  describe('edge cases: already submitted reviews', () => {
    it('should handle already submitted review (entity should throw SelfReviewAlreadySubmittedException)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
      })
      // Submit the review first
      review.submit()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(SelfReviewAlreadySubmittedException)
    })

    it('should not save when review is already submitted', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
      })
      review.submit()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockSelfReviewRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full submission workflow successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
        narrative: Narrative.create('Final comprehensive self-review narrative'),
      })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      const submittedReview = createValidSelfReview({
        id: review.id,
        cycleId,
        userId,
        scores: review.scores,
        narrative: review.narrative,
      })
      submittedReview.submit()
      mockSelfReviewRepository.save.mockResolvedValue(submittedReview)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(mockSelfReviewRepository.findByUserAndCycle).toHaveBeenCalledWith(userId, cycleId)
      expect(mockSelfReviewRepository.save).toHaveBeenCalledWith(review)
      expect(result.status).toBe('SUBMITTED')
      expect(result.submittedAt).toBeDefined()
    })

    it('should handle multiple submission attempts with proper error handling', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()
      const review = createValidSelfReview({
        cycleId,
        userId,
      })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review)

      const submittedReview = createValidSelfReview({
        id: review.id,
        cycleId,
        userId,
        scores: review.scores,
        narrative: review.narrative,
      })
      submittedReview.submit()
      mockSelfReviewRepository.save.mockResolvedValue(submittedReview)

      // Act - First submission should succeed
      const result1 = await useCase.execute(input)
      expect(result1.status).toBe('SUBMITTED')

      // Act - Second attempt with already submitted review should fail
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(submittedReview)

      // Assert
      await expect(useCase.execute(input)).rejects.toThrow(SelfReviewAlreadySubmittedException)
    })
  })

  describe('error precedence', () => {
    it('should validate cycle before checking review', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(null)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      expect(mockSelfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled()
    })

    it('should check deadline before retrieving review', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Self-review deadline has passed')
      expect(mockSelfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled()
    })

    it('should validate review existence before checking narrative', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const userId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitSelfReviewInput = {
        userId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      expect(mockSelfReviewRepository.save).not.toHaveBeenCalled()
    })
  })
})
