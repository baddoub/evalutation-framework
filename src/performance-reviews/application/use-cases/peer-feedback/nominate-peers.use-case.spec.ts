import { NominatePeersUseCase } from './nominate-peers.use-case'
import type {
  IPeerNominationRepository,
  PeerNomination,
} from '../../../domain/repositories/peer-nomination.repository.interface'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import type { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import type { NominatePeersInput } from '../../dto/peer-feedback.dto'
import { User } from '../../../../auth/domain/entities/user.entity'
import { Email } from '../../../../auth/domain/value-objects/email.vo'
import { Role } from '../../../../auth/domain/value-objects/role.vo'

describe('NominatePeersUseCase', () => {
  let useCase: NominatePeersUseCase
  let mockPeerNominationRepository: jest.Mocked<IPeerNominationRepository>
  let mockCycleRepository: jest.Mocked<IReviewCycleRepository>
  let mockUserRepository: jest.Mocked<IUserRepository>

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

  const createValidUser = (
    overrides?: Partial<{
      id: UserId
      email: string
      name: string
      managerId: string
    }>,
  ): User => {
    return User.create({
      id: overrides?.id || UserId.generate(),
      email: Email.create(overrides?.email || 'user@example.com'),
      name: overrides?.name || 'Test User',
      keycloakId: 'keycloak-123',
      roles: [Role.create('user')],
      isActive: true,
      managerId: overrides?.managerId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
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
      status: overrides?.status || 'PENDING',
      nominatedAt: new Date(),
    }
  }

  beforeEach(() => {
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

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByKeycloakId: jest.fn(),
      existsByEmail: jest.fn(),
      findByRole: jest.fn(),
      findByManagerId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    useCase = new NominatePeersUseCase(
      mockPeerNominationRepository,
      mockCycleRepository,
      mockUserRepository,
    )
  })

  describe('CRITICAL: happy path - successfully nominates peers', () => {
    it('should nominate 3 peers successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nominee1Id = UserId.generate()
      const nominee2Id = UserId.generate()
      const nominee3Id = UserId.generate()

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId, name: 'Nominator' })
      const nominee1 = createValidUser({ id: nominee1Id, name: 'Nominee 1' })
      const nominee2 = createValidUser({ id: nominee2Id, name: 'Nominee 2' })
      const nominee3 = createValidUser({ id: nominee3Id, name: 'Nominee 3' })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds: [nominee1Id, nominee2Id, nominee3Id],
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        if (id.equals(nominee1Id)) return nominee1
        if (id.equals(nominee2Id)) return nominee2
        if (id.equals(nominee3Id)) return nominee3
        return null
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.nominations).toHaveLength(3)
      expect(result.nominations[0].nomineeName).toBe('Nominee 1')
      expect(result.nominations[1].nomineeName).toBe('Nominee 2')
      expect(result.nominations[2].nomineeName).toBe('Nominee 3')
      expect(mockPeerNominationRepository.save).toHaveBeenCalledTimes(3)
    })

    it('should nominate 5 peers successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
      ]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          return nominator
        }
        return createValidUser({ id, name: `Nominee ${id.value}` })
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.nominations).toHaveLength(5)
      expect(mockPeerNominationRepository.save).toHaveBeenCalledTimes(5)
    })

    it('should create nominations with PENDING status', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          return nominator
        }
        return createValidUser({ id })
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.nominations).toHaveLength(3)
      result.nominations.forEach((nomination) => {
        expect(nomination.status).toBe('PENDING')
      })
    })

    it('should set nominatedAt timestamp for all nominations', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          return nominator
        }
        return createValidUser({ id })
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      const beforeNomination = new Date()

      // Act
      const result = await useCase.execute(input)

      const afterNomination = new Date()

      // Assert
      result.nominations.forEach((nomination) => {
        expect(nomination.nominatedAt).toBeDefined()
        expect(nomination.nominatedAt.getTime()).toBeGreaterThanOrEqual(beforeNomination.getTime())
        expect(nomination.nominatedAt.getTime()).toBeLessThanOrEqual(afterNomination.getTime())
      })
    })

    it('should persist all nominations to repository', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
      ]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          return nominator
        }
        return createValidUser({ id })
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockPeerNominationRepository.save).toHaveBeenCalledTimes(4)
      expect(mockPeerNominationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cycleId,
          nominatorId,
          status: 'PENDING',
        }),
      )
    })

    it('should return correct DTO structure with all fields', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          return nominator
        }
        return createValidUser({ id, name: `User ${id.value}` })
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('nominations')
      result.nominations.forEach((nomination) => {
        expect(nomination).toHaveProperty('id')
        expect(nomination).toHaveProperty('nomineeId')
        expect(nomination).toHaveProperty('nomineeName')
        expect(nomination).toHaveProperty('status')
        expect(nomination).toHaveProperty('nominatedAt')
        expect(typeof nomination.id).toBe('string')
        expect(typeof nomination.nomineeId).toBe('string')
        expect(typeof nomination.nomineeName).toBe('string')
        expect(typeof nomination.status).toBe('string')
        expect(nomination.nominatedAt).toBeInstanceOf(Date)
      })
    })
  })

  describe('CRITICAL: cycle validation', () => {
    it('should throw ReviewNotFoundException if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow(
        `Review cycle with ID ${cycleId.value} not found`,
      )
    })

    it('should not proceed to validate nominations if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
      expect(mockPeerNominationRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: nomination count validation', () => {
    it('should throw Error if nominating less than 3 peers', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Must nominate between 3 and 5 peers')
    })

    it('should throw Error if nominating more than 5 peers', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
      ]

      const cycle = createValidReviewCycle()

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Must nominate between 3 and 5 peers')
    })

    it('should throw Error if nominating 0 peers', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds: UserId[] = []

      const cycle = createValidReviewCycle()

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Must nominate between 3 and 5 peers')
    })

    it('should throw Error if nominating 1 peer', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate()]

      const cycle = createValidReviewCycle()

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Must nominate between 3 and 5 peers')
    })

    it('should accept exactly 3 peers', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          return nominator
        }
        return createValidUser({ id })
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.nominations).toHaveLength(3)
    })

    it('should accept exactly 5 peers', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
      ]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          return nominator
        }
        return createValidUser({ id })
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.nominations).toHaveLength(5)
    })

    it('should not save any nominations when count is invalid', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockPeerNominationRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: nominator validation', () => {
    it('should throw Error if nominator user not found', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Nominator user not found')
    })

    it('should not save nominations when nominator not found', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockPeerNominationRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: self-nomination prevention', () => {
    it('should throw Error if nominating self', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nominee1Id = UserId.generate()
      const nominee2Id = UserId.generate()
      const nomineeIds = [nominee1Id, nominatorId, nominee2Id] // Including self

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })
      const nominee1 = createValidUser({ id: nominee1Id })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById
        .mockResolvedValueOnce(nominator)
        .mockResolvedValueOnce(nominee1)
        .mockResolvedValueOnce(nominee1)
        .mockResolvedValueOnce(nominator)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Cannot nominate yourself for peer feedback',
      )
    })

    it('should not save any nominations when self-nomination is detected', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nominee1Id = UserId.generate()
      const nominee2Id = UserId.generate()
      const nomineeIds = [nominee1Id, nominatorId, nominee2Id]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })
      const nominee1 = createValidUser({ id: nominee1Id })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById
        .mockResolvedValueOnce(nominator)
        .mockResolvedValueOnce(nominee1)
        .mockResolvedValueOnce(nominee1)
        .mockResolvedValueOnce(nominator)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockPeerNominationRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: nominee validation', () => {
    it('should throw Error if nominee user not found', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nominee1Id = UserId.generate()
      const nominee2Id = UserId.generate()
      const nominee3Id = UserId.generate()
      const nomineeIds = [nominee1Id, nominee2Id, nominee3Id]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })
      const nominee1 = createValidUser({ id: nominee1Id })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        if (id.equals(nominee1Id)) return nominee1
        if (id.equals(nominee2Id)) return null
        return null
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        `Nominee with ID ${nominee2Id.value} not found`,
      )
    })

    it('should not save any nominations when a nominee is not found', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nominee1Id = UserId.generate()
      const nominee2Id = UserId.generate()
      const nominee3Id = UserId.generate()
      const nomineeIds = [nominee1Id, nominee2Id, nominee3Id]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })
      const nominee1 = createValidUser({ id: nominee1Id })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        if (id.equals(nominee1Id)) return nominee1
        if (id.equals(nominee2Id)) return null
        return null
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockPeerNominationRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: manager nomination prevention', () => {
    it('should throw Error if nominating manager', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const managerId = UserId.generate()
      const nominee2Id = UserId.generate()
      const nominee3Id = UserId.generate()
      const nomineeIds = [managerId, nominee2Id, nominee3Id]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId, managerId: managerId.value })
      const manager = createValidUser({ id: managerId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById
        .mockResolvedValueOnce(nominator)
        .mockResolvedValueOnce(manager)
        .mockResolvedValueOnce(manager)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Cannot nominate your manager for peer feedback',
      )
    })

    it('should not save nominations when manager nomination is detected', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const managerId = UserId.generate()
      const nominee2Id = UserId.generate()
      const nominee3Id = UserId.generate()
      const nomineeIds = [managerId, nominee2Id, nominee3Id]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId, managerId: managerId.value })
      const manager = createValidUser({ id: managerId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById
        .mockResolvedValueOnce(nominator)
        .mockResolvedValueOnce(manager)
        .mockResolvedValueOnce(manager)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockPeerNominationRepository.save).not.toHaveBeenCalled()
    })

    it('should allow nomination when nominator has no manager', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          return nominator
        }
        return createValidUser({ id })
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.nominations).toHaveLength(3)
    })
  })

  describe('CRITICAL: duplicate nomination prevention', () => {
    it('should throw Error if peer already nominated in this cycle', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nominee1Id = UserId.generate()
      const nominee2Id = UserId.generate()
      const nominee3Id = UserId.generate()
      const nomineeIds = [nominee1Id, nominee2Id, nominee3Id]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })
      const nominee1 = createValidUser({ id: nominee1Id })
      const nominee2 = createValidUser({ id: nominee2Id })

      const existingNomination = createValidPeerNomination({
        cycleId,
        nominatorId,
        nomineeId: nominee2Id,
      })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById
        .mockResolvedValueOnce(nominator)
        .mockResolvedValueOnce(nominee1)
        .mockResolvedValueOnce(nominee1)
        .mockResolvedValueOnce(nominee2)
        .mockResolvedValueOnce(nominee2)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([existingNomination])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        `Already nominated peer with ID ${nominee2Id.value}`,
      )
    })

    it('should not save nominations when duplicate is detected', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nominee1Id = UserId.generate()
      const nominee2Id = UserId.generate()
      const nominee3Id = UserId.generate()
      const nomineeIds = [nominee1Id, nominee2Id, nominee3Id]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })
      const nominee1 = createValidUser({ id: nominee1Id })
      const nominee2 = createValidUser({ id: nominee2Id })

      const existingNomination = createValidPeerNomination({
        cycleId,
        nominatorId,
        nomineeId: nominee2Id,
      })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById
        .mockResolvedValueOnce(nominator)
        .mockResolvedValueOnce(nominee1)
        .mockResolvedValueOnce(nominee1)
        .mockResolvedValueOnce(nominee2)
        .mockResolvedValueOnce(nominee2)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([existingNomination])

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockPeerNominationRepository.save).not.toHaveBeenCalled()
    })

    it('should allow nomination if existing nominations are from different cycle', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          return nominator
        }
        return createValidUser({ id })
      })
      mockPeerNominationRepository.findByNominatorAndCycle
        .mockResolvedValueOnce([]) // For current cycle
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.nominations).toHaveLength(3)
    })
  })

  describe('EDGE: duplicate nominees in input', () => {
    it('should handle duplicate nominee IDs in input list', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nominee1Id = UserId.generate()
      const nominee2Id = UserId.generate()
      const nomineeIds = [nominee1Id, nominee2Id, nominee1Id] // Duplicate

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })
      const nominee1 = createValidUser({ id: nominee1Id })
      const nominee2 = createValidUser({ id: nominee2Id })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById
        .mockResolvedValueOnce(nominator)
        .mockResolvedValueOnce(nominee1)
        .mockResolvedValueOnce(nominee1)
        .mockResolvedValueOnce(nominee2)
        .mockResolvedValueOnce(nominee2)
        .mockResolvedValueOnce(nominee1)
        .mockResolvedValueOnce(nominee1)
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert - should create 3 nominations, including duplicate
      expect(result).toBeDefined()
      expect(result.nominations).toHaveLength(3)
    })
  })

  describe('error precedence', () => {
    it('should validate cycle before checking nomination count', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate()] // Invalid count

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
    })

    it('should check nomination count before checking nominator', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate()] // Invalid count

      const cycle = createValidReviewCycle()

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Must nominate between 3 and 5 peers')
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should check nominator before validating nominees', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Nominator user not found')
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full nomination workflow successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nominee1Id = UserId.generate()
      const nominee2Id = UserId.generate()
      const nominee3Id = UserId.generate()
      const nomineeIds = [nominee1Id, nominee2Id, nominee3Id]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId, name: 'Nominator' })
      const nominee1 = createValidUser({ id: nominee1Id, name: 'Nominee 1' })
      const nominee2 = createValidUser({ id: nominee2Id, name: 'Nominee 2' })
      const nominee3 = createValidUser({ id: nominee3Id, name: 'Nominee 3' })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        if (id.equals(nominee1Id)) return nominee1
        if (id.equals(nominee2Id)) return nominee2
        if (id.equals(nominee3Id)) return nominee3
        return null
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(mockUserRepository.findById).toHaveBeenCalledWith(nominatorId)
      expect(mockPeerNominationRepository.findByNominatorAndCycle).toHaveBeenCalledWith(
        nominatorId,
        cycleId,
      )
      expect(mockPeerNominationRepository.save).toHaveBeenCalledTimes(3)
      expect(result.nominations).toHaveLength(3)
      expect(result.nominations[0].nomineeName).toBe('Nominee 1')
      expect(result.nominations[1].nomineeName).toBe('Nominee 2')
      expect(result.nominations[2].nomineeName).toBe('Nominee 3')
    })

    it('should verify all validation steps are executed in correct order', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      const callOrder: string[] = []

      mockCycleRepository.findById.mockImplementation(async () => {
        callOrder.push('findCycle')
        return cycle
      })

      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          callOrder.push('findNominator')
          return nominator
        }
        callOrder.push('findNominee')
        return createValidUser({ id })
      })

      mockPeerNominationRepository.findByNominatorAndCycle.mockImplementation(async () => {
        callOrder.push('checkDuplicate')
        return []
      })

      mockPeerNominationRepository.save.mockImplementation(async (nom) => {
        callOrder.push('save')
        return nom
      })

      // Act
      await useCase.execute(input)

      // Assert
      expect(callOrder).toEqual([
        'findCycle',
        'findNominator',
        'findNominee',
        'checkDuplicate',
        'findNominee',
        'checkDuplicate',
        'findNominee',
        'checkDuplicate',
        'save',
        'save',
        'save',
        'findNominee',
        'findNominee',
        'findNominee',
      ])
    })

    it('should handle 4 peer nominations successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
      ]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          return nominator
        }
        return createValidUser({ id })
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.nominations).toHaveLength(4)
      expect(mockPeerNominationRepository.save).toHaveBeenCalledTimes(4)
    })

    it('should return nominations with unique IDs', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const nominatorId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const cycle = createValidReviewCycle()
      const nominator = createValidUser({ id: nominatorId })

      const input: NominatePeersInput = {
        nominatorId,
        cycleId,
        nomineeIds,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) {
          return nominator
        }
        return createValidUser({ id })
      })
      mockPeerNominationRepository.findByNominatorAndCycle.mockResolvedValue([])
      mockPeerNominationRepository.save.mockImplementation(async (nom) => nom)

      // Act
      const result = await useCase.execute(input)

      // Assert
      const nominationIds = result.nominations.map((n) => n.id)
      const uniqueIds = new Set(nominationIds)
      expect(uniqueIds.size).toBe(3)
    })
  })
})
