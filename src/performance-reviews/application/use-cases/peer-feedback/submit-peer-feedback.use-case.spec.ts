import { SubmitPeerFeedbackUseCase } from './submit-peer-feedback.use-case'
import type { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface'
import type {
  IPeerNominationRepository,
  PeerNomination,
} from '../../../domain/repositories/peer-nomination.repository.interface'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { PeerFeedback } from '../../../domain/entities/peer-feedback.entity'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import type { PeerFeedbackId } from '../../../domain/value-objects/peer-feedback-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import type { SubmitPeerFeedbackInput, SubmitPeerFeedbackOutput } from '../../dto/peer-feedback.dto'

describe('SubmitPeerFeedbackUseCase', () => {
  let useCase: SubmitPeerFeedbackUseCase
  let mockPeerFeedbackRepository: jest.Mocked<IPeerFeedbackRepository>
  let mockPeerNominationRepository: jest.Mocked<IPeerNominationRepository>
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

  const createValidPeerNomination = (
    overrides?: Partial<{
      id: string
      cycleId: ReviewCycleId
      nominatorId: UserId
      nomineeId: UserId
      status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'OVERRIDDEN_BY_MANAGER'
    }>,
  ): PeerNomination => {
    return {
      id: overrides?.id || 'nomination-id',
      cycleId: overrides?.cycleId || ReviewCycleId.generate(),
      nominatorId: overrides?.nominatorId || UserId.generate(),
      nomineeId: overrides?.nomineeId || UserId.generate(),
      status: overrides?.status || 'ACCEPTED',
      nominatedAt: new Date(),
    }
  }

  const createValidPeerFeedback = (
    overrides?: Partial<{
      id: PeerFeedbackId
      cycleId: ReviewCycleId
      revieweeId: UserId
      reviewerId: UserId
      scores: PillarScores
    }>,
  ): PeerFeedback => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const revieweeId = overrides?.revieweeId || UserId.generate()
    const reviewerId = overrides?.reviewerId || UserId.generate()

    return PeerFeedback.create({
      id: overrides?.id,
      cycleId,
      revieweeId,
      reviewerId,
      scores:
        overrides?.scores ||
        PillarScores.create({
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        }),
      strengths: 'Great team player',
      growthAreas: 'Could improve time management',
      generalComments: 'Overall solid performance',
    })
  }

  beforeEach(() => {
    mockPeerFeedbackRepository = {
      findById: jest.fn(),
      findByReviewerAndCycle: jest.fn(),
      findByRevieweeAndCycle: jest.fn(),
      findByEmployeeAndCycle: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    mockPeerNominationRepository = {
      findById: jest.fn(),
      findByNominatorAndCycle: jest.fn(),
      findByNomineeAndCycle: jest.fn(),
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

    useCase = new SubmitPeerFeedbackUseCase(
      mockPeerFeedbackRepository,
      mockPeerNominationRepository,
      mockCycleRepository,
    )
  })

  describe('CRITICAL: happy path - successfully submits peer feedback', () => {
    it('should submit peer feedback successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        strengths: 'Excellent problem solver',
        growthAreas: 'Could improve communication',
        generalComments: 'Strong performer',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(savedFeedback.id.value)
      expect(result.revieweeId).toBe(savedFeedback.revieweeId.value)
      expect(result.submittedAt).toBeInstanceOf(Date)
      expect(result.isAnonymized).toBe(true)
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalled()
    })

    it('should create PeerFeedback entity with all fields', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        strengths: 'Excellent problem solver',
        growthAreas: 'Could improve communication',
        generalComments: 'Strong performer',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('revieweeId')
      expect(result).toHaveProperty('submittedAt')
      expect(result).toHaveProperty('isAnonymized')
      expect(typeof result.id).toBe('string')
      expect(typeof result.revieweeId).toBe('string')
      expect(result.submittedAt).toBeInstanceOf(Date)
      expect(typeof result.isAnonymized).toBe('boolean')
    })

    it('should set submittedAt timestamp', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        strengths: 'Excellent problem solver',
        growthAreas: 'Could improve communication',
        generalComments: 'Strong performer',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const beforeSubmit = new Date()
      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)
      const afterSubmit = new Date()

      // Assert
      expect(result.submittedAt).toBeDefined()
      expect(result.submittedAt.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime())
      expect(result.submittedAt.getTime()).toBeLessThanOrEqual(afterSubmit.getTime())
    })

    it('should persist feedback to repository', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        strengths: 'Excellent problem solver',
        growthAreas: 'Could improve communication',
        generalComments: 'Strong performer',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalledTimes(1)
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cycleId,
          revieweeId,
          reviewerId,
        }),
      )
    })

    it('should return correct DTO with isAnonymized as true', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        strengths: 'Excellent problem solver',
        growthAreas: 'Could improve communication',
        generalComments: 'Strong performer',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toEqual<SubmitPeerFeedbackOutput>({
        id: savedFeedback.id.value,
        revieweeId: savedFeedback.revieweeId.value,
        submittedAt: savedFeedback.submittedAt!,
        isAnonymized: true,
      })
    })
  })

  describe('CRITICAL: cycle not found error handling', () => {
    it('should throw ReviewNotFoundException if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow(
        `Review cycle with ID ${cycleId.value} not found`,
      )
    })

    it('should not proceed to check deadline if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockPeerNominationRepository.findByNominatorAndCycle).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: deadline passed validation', () => {
    it('should throw Error if peer feedback deadline has passed', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true)

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Peer feedback deadline has passed')
    })

    it('should check deadline using cycle.hasDeadlinePassed method with peerFeedback parameter', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()

      const hasDeadlinePassedSpy = jest.spyOn(cycle, 'hasDeadlinePassed')
      hasDeadlinePassedSpy.mockReturnValue(true)

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(hasDeadlinePassedSpy).toHaveBeenCalledWith('peerFeedback')
    })

    it('should not proceed to validate nomination if deadline has passed', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true)

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockPeerNominationRepository.findByNominatorAndCycle).not.toHaveBeenCalled()
    })

    it('should allow submission when deadline has not passed', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockPeerNominationRepository.findByNominatorAndCycle).toHaveBeenCalled()
    })
  })

  describe('CRITICAL: nomination validation (exists and is active)', () => {
    it('should throw Error if nomination does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'No peer nomination found for this reviewer and reviewee',
      )
    })

    it('should throw Error if nomination exists but for different reviewer', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const differentReviewerId = UserId.generate()
      const cycle = createValidReviewCycle()

      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: differentReviewerId, // Different reviewer
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'No peer nomination found for this reviewer and reviewee',
      )
    })

    it('should accept nomination with PENDING status', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'PENDING',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalled()
    })

    it('should accept nomination with ACCEPTED status', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalled()
    })
  })

  describe('CRITICAL: duplicate feedback prevention', () => {
    it('should throw Error if feedback already submitted for this reviewee', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const existingFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([existingFeedback])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Peer feedback already submitted for this reviewee',
      )
    })

    it('should not save when feedback already exists', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const existingFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([existingFeedback])

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockPeerFeedbackRepository.save).not.toHaveBeenCalled()
    })

    it('should allow submission if existing feedback is for different reviewee', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const differentRevieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const existingFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId: differentRevieweeId, // Different reviewee
        reviewerId,
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([existingFeedback])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalled()
    })
  })

  describe('IMPORTANT: inactive nomination rejection', () => {
    it('should throw Error if nomination status is DECLINED', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'DECLINED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Peer nomination is not active')
    })

    it('should throw Error if nomination status is OVERRIDDEN_BY_MANAGER', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'OVERRIDDEN_BY_MANAGER',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Peer nomination is not active')
    })

    it('should not save feedback when nomination is inactive', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'DECLINED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockPeerFeedbackRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('EDGE: missing optional comments', () => {
    it('should allow submission without strengths comment', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        // No strengths provided
        growthAreas: 'Could improve communication',
        generalComments: 'Strong performer',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalled()
    })

    it('should allow submission without growthAreas comment', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        strengths: 'Excellent problem solver',
        // No growthAreas provided
        generalComments: 'Strong performer',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalled()
    })

    it('should allow submission without generalComments', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        strengths: 'Excellent problem solver',
        growthAreas: 'Could improve communication',
        // No generalComments provided
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalled()
    })

    it('should allow submission with only scores (no comments)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        // No comments provided at all
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalled()
    })
  })

  describe('error precedence', () => {
    it('should validate cycle before checking deadline', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      expect(mockPeerNominationRepository.findByNominatorAndCycle).not.toHaveBeenCalled()
    })

    it('should check deadline before validating nomination', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true)

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Peer feedback deadline has passed')
      expect(mockPeerNominationRepository.findByNominatorAndCycle).not.toHaveBeenCalled()
    })

    it('should validate nomination before checking for duplicates', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'No peer nomination found for this reviewer and reviewee',
      )
      expect(mockPeerFeedbackRepository.findByReviewerAndCycle).not.toHaveBeenCalled()
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full submission workflow successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        strengths: 'Excellent problem solver',
        growthAreas: 'Could improve communication',
        generalComments: 'Strong performer',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([nomination])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(mockPeerNominationRepository.findByNominatorAndCycle).toHaveBeenCalledWith(
        revieweeId,
        cycleId,
      )
      expect(mockPeerFeedbackRepository.findByReviewerAndCycle).toHaveBeenCalledWith(
        reviewerId,
        cycleId,
      )
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalledTimes(1)
      expect(result.id).toBe(savedFeedback.id.value)
      expect(result.revieweeId).toBe(savedFeedback.revieweeId.value)
      expect(result.submittedAt).toBeDefined()
      expect(result.isAnonymized).toBe(true)
    })

    it('should handle multiple nominations and find correct one', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const otherReviewerId = UserId.generate()
      const cycle = createValidReviewCycle()

      const nomination1 = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: otherReviewerId,
        status: 'ACCEPTED',
      })

      const nomination2 = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([
        nomination1,
        nomination2,
      ])
      mockPeerFeedbackRepository.findByReviewerAndCycle.mockResolvedValue([])

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockResolvedValue(savedFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(savedFeedback.id.value)
      expect(mockPeerFeedbackRepository.save).toHaveBeenCalled()
    })

    it('should verify all validation steps are executed in correct order', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const revieweeId = UserId.generate()
      const reviewerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const nomination = createValidPeerNomination({
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'ACCEPTED',
      })

      const input: SubmitPeerFeedbackInput = {
        reviewerId,
        revieweeId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      }

      const callOrder: string[] = []

      mockCycleRepository.findById.mockImplementation(async () => {
        callOrder.push('findCycle')
        return cycle
      })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockImplementation(() => {
        callOrder.push('checkDeadline')
        return false
      })

      mockPeerNominationRepository.findByNominatorAndCycle.mockImplementation(async () => {
        callOrder.push('findNomination')
        return [nomination]
      })

      mockPeerFeedbackRepository.findByReviewerAndCycle.mockImplementation(async () => {
        callOrder.push('checkDuplicate')
        return []
      })

      const savedFeedback = createValidPeerFeedback({
        cycleId,
        revieweeId,
        reviewerId,
      })
      mockPeerFeedbackRepository.save.mockImplementation(async () => {
        callOrder.push('save')
        return savedFeedback
      })

      // Act
      await useCase.execute(input)

      // Assert
      expect(callOrder).toEqual([
        'findCycle',
        'checkDeadline',
        'findNomination',
        'checkDuplicate',
        'save',
      ])
    })
  })
})
