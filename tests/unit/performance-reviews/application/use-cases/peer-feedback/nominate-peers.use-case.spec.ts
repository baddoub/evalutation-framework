import { Test, TestingModule } from '@nestjs/testing'
import { NominatePeersUseCase } from '../../../../../../src/performance-reviews/application/use-cases/peer-feedback/nominate-peers.use-case'
import { IPeerNominationRepository } from '../../../../../../src/performance-reviews/domain/repositories/peer-nomination.repository.interface'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../../../src/auth/domain/repositories/user.repository.interface'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../../../src/auth/domain/value-objects/user-id.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { User } from '../../../../../../src/auth/domain/entities/user.entity'
import { Email } from '../../../../../../src/auth/domain/value-objects/email.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('NominatePeersUseCase', () => {
  let useCase: NominatePeersUseCase
  let peerNominationRepo: jest.Mocked<IPeerNominationRepository>
  let cycleRepo: jest.Mocked<IReviewCycleRepository>
  let userRepo: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    const mockPeerNominationRepo = {
      findByNominatorAndCycle: jest.fn(),
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

    const mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByKeycloakId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NominatePeersUseCase,
        { provide: 'IPeerNominationRepository', useValue: mockPeerNominationRepo },
        { provide: 'IReviewCycleRepository', useValue: mockCycleRepo },
        { provide: 'IUserRepository', useValue: mockUserRepo },
      ],
    }).compile()

    useCase = module.get<NominatePeersUseCase>(NominatePeersUseCase)
    peerNominationRepo = module.get('IPeerNominationRepository')
    cycleRepo = module.get('IReviewCycleRepository')
    userRepo = module.get('IUserRepository')
  })

  describe('execute', () => {
    it('should nominate peers successfully with 3 nominees', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const managerId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

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

      const nominator = User.register({
        email: Email.fromString('nominator@example.com'),
        keycloakId: 'keycloak-id-1',
        name: 'Nominator User',
        level: 'Senior',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        managerId,
      })

      const nominees = nomineeIds.map((id, index) =>
        User.register({
          email: Email.fromString(`nominee${index}@example.com`),
          keycloakId: `keycloak-id-${index}`,
          name: `Nominee ${index}`,
          level: 'Senior',
          department: 'Engineering',
          jobTitle: 'Software Engineer',
          managerId,
        }),
      )

      cycleRepo.findById.mockResolvedValue(cycle)
      userRepo.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        const index = nomineeIds.findIndex((nId) => nId.equals(id))
        return index >= 0 ? nominees[index] : null
      })
      peerNominationRepo.findByNominatorAndCycle.mockResolvedValue([])
      peerNominationRepo.save.mockImplementation(async (nomination) => nomination)

      // Act
      const result = await useCase.execute({ nominatorId, cycleId, nomineeIds })

      // Assert
      expect(result).toBeDefined()
      expect(result.nominations).toHaveLength(3)
      expect(peerNominationRepo.save).toHaveBeenCalledTimes(3)
      expect(cycleRepo.findById).toHaveBeenCalledWith(cycleId)
      expect(userRepo.findById).toHaveBeenCalledWith(nominatorId)
      expect(peerNominationRepo.findByNominatorAndCycle).toHaveBeenCalledWith(
        nominatorId,
        cycleId,
      )
      result.nominations.forEach((nom, index) => {
        expect(nom.nomineeId).toBe(nomineeIds[index].value)
        expect(nom.nomineeName).toBe(`Nominee ${index}`)
        expect(nom.status).toBe('PENDING')
        expect(nom.nominatedAt).toBeInstanceOf(Date)
      })
    })

    it('should nominate peers successfully with 5 nominees (maximum)', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const managerId = UserId.generate()
      const nomineeIds = [
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
      ]

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

      const nominator = User.register({
        email: Email.fromString('nominator@example.com'),
        keycloakId: 'keycloak-id-1',
        name: 'Nominator User',
        level: 'Senior',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        managerId,
      })

      const nominees = nomineeIds.map((id, index) =>
        User.register({
          email: Email.fromString(`nominee${index}@example.com`),
          keycloakId: `keycloak-id-${index}`,
          name: `Nominee ${index}`,
          level: 'Senior',
          department: 'Engineering',
          jobTitle: 'Software Engineer',
          managerId,
        }),
      )

      cycleRepo.findById.mockResolvedValue(cycle)
      userRepo.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        const index = nomineeIds.findIndex((nId) => nId.equals(id))
        return index >= 0 ? nominees[index] : null
      })
      peerNominationRepo.findByNominatorAndCycle.mockResolvedValue([])
      peerNominationRepo.save.mockImplementation(async (nomination) => nomination)

      // Act
      const result = await useCase.execute({ nominatorId, cycleId, nomineeIds })

      // Assert
      expect(result).toBeDefined()
      expect(result.nominations).toHaveLength(5)
      expect(peerNominationRepo.save).toHaveBeenCalledTimes(5)
      result.nominations.forEach((nom, index) => {
        expect(nom.nomineeId).toBe(nomineeIds[index].value)
        expect(nom.status).toBe('PENDING')
      })
    })

    it('should throw error if cycle not found', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      cycleRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute({ nominatorId, cycleId, nomineeIds })).rejects.toThrow(
        ReviewNotFoundException,
      )
      expect(cycleRepo.findById).toHaveBeenCalledWith(cycleId)
    })

    it('should throw error if less than 3 nominees', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate()] // Only 2

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

      cycleRepo.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute({ nominatorId, cycleId, nomineeIds })).rejects.toThrow(
        'Must nominate between 3 and 5 peers',
      )
    })

    it('should throw error if more than 5 nominees', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const nomineeIds = Array(6)
        .fill(null)
        .map(() => UserId.generate()) // 6 nominees

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

      cycleRepo.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute({ nominatorId, cycleId, nomineeIds })).rejects.toThrow(
        'Must nominate between 3 and 5 peers',
      )
    })

    it('should throw error if nominating self', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), nominatorId] // Self-nomination

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

      const nominator = User.register({
        email: Email.fromString('nominator@example.com'),
        keycloakId: 'keycloak-id-1',
        name: 'Nominator User',
        level: 'Senior',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        managerId: UserId.generate(),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      userRepo.findById.mockResolvedValue(nominator)

      // Act & Assert
      await expect(useCase.execute({ nominatorId, cycleId, nomineeIds })).rejects.toThrow(
        'Cannot nominate yourself for peer feedback',
      )
    })

    it('should throw error if nominating manager', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const managerId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), managerId] // Manager nomination

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

      const nominator = User.register({
        email: Email.fromString('nominator@example.com'),
        keycloakId: 'keycloak-id-1',
        name: 'Nominator User',
        level: 'Senior',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        managerId,
      })

      const manager = User.register({
        email: Email.fromString('manager@example.com'),
        keycloakId: 'keycloak-id-manager',
        name: 'Manager User',
        level: 'Manager',
        department: 'Engineering',
        jobTitle: 'Engineering Manager',
        managerId: UserId.generate(),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      userRepo.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        if (id.equals(managerId)) return manager
        return null
      })
      peerNominationRepo.findByNominatorAndCycle.mockResolvedValue([])

      // Act & Assert
      await expect(useCase.execute({ nominatorId, cycleId, nomineeIds })).rejects.toThrow(
        'Cannot nominate your manager for peer feedback',
      )
    })

    it('should throw error if peer already nominated in previous request', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const managerId = UserId.generate()
      const alreadyNominatedId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), alreadyNominatedId]

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

      const nominator = User.register({
        email: Email.fromString('nominator@example.com'),
        keycloakId: 'keycloak-id-1',
        name: 'Nominator User',
        level: 'Senior',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        managerId,
      })

      const nominee = User.register({
        email: Email.fromString('nominee@example.com'),
        keycloakId: 'keycloak-id-nominee',
        name: 'Nominee User',
        level: 'Senior',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        managerId,
      })

      const existingNomination = {
        id: 'existing-nomination-id',
        cycleId,
        nominatorId,
        nomineeId: alreadyNominatedId,
        status: 'PENDING' as const,
        nominatedAt: new Date(),
      }

      cycleRepo.findById.mockResolvedValue(cycle)
      userRepo.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        return nominee
      })
      peerNominationRepo.findByNominatorAndCycle.mockResolvedValue([existingNomination])

      // Act & Assert
      await expect(useCase.execute({ nominatorId, cycleId, nomineeIds })).rejects.toThrow(
        `Already nominated peer with ID ${alreadyNominatedId.value}`,
      )
    })

    it('should throw error if nominee not found', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const managerId = UserId.generate()
      const invalidNomineeId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), invalidNomineeId]

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

      const nominator = User.register({
        email: Email.fromString('nominator@example.com'),
        keycloakId: 'keycloak-id-1',
        name: 'Nominator User',
        level: 'Senior',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        managerId,
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      userRepo.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        if (id.equals(invalidNomineeId)) return null
        return User.register({
          email: Email.fromString('valid@example.com'),
          keycloakId: 'keycloak-valid',
          name: 'Valid User',
          level: 'Senior',
          department: 'Engineering',
          jobTitle: 'Software Engineer',
          managerId,
        })
      })
      peerNominationRepo.findByNominatorAndCycle.mockResolvedValue([])

      // Act & Assert
      await expect(useCase.execute({ nominatorId, cycleId, nomineeIds })).rejects.toThrow(
        `Nominee with ID ${invalidNomineeId.value} not found`,
      )
    })

    it('should throw error if nominator not found', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

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

      cycleRepo.findById.mockResolvedValue(cycle)
      userRepo.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return null
        return User.register({
          email: Email.fromString('nominee@example.com'),
          keycloakId: 'keycloak-nominee',
          name: 'Nominee User',
          level: 'Senior',
          department: 'Engineering',
          jobTitle: 'Software Engineer',
          managerId: UserId.generate(),
        })
      })

      // Act & Assert
      await expect(useCase.execute({ nominatorId, cycleId, nomineeIds })).rejects.toThrow(
        'Nominator user not found',
      )
      expect(userRepo.findById).toHaveBeenCalledWith(nominatorId)
    })

    it('should persist all nominations with correct data', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const managerId = UserId.generate()
      const nomineeIds = [
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
      ]

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

      const nominator = User.register({
        email: Email.fromString('nominator@example.com'),
        keycloakId: 'keycloak-id-1',
        name: 'Nominator User',
        level: 'Senior',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        managerId,
      })

      const nominees = nomineeIds.map((id, index) =>
        User.register({
          email: Email.fromString(`nominee${index}@example.com`),
          keycloakId: `keycloak-id-${index}`,
          name: `Nominee ${index}`,
          level: 'Senior',
          department: 'Engineering',
          jobTitle: 'Software Engineer',
          managerId,
        }),
      )

      cycleRepo.findById.mockResolvedValue(cycle)
      userRepo.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        const index = nomineeIds.findIndex((nId) => nId.equals(id))
        return index >= 0 ? nominees[index] : null
      })
      peerNominationRepo.findByNominatorAndCycle.mockResolvedValue([])
      peerNominationRepo.save.mockImplementation(async (nomination) => nomination)

      // Act
      await useCase.execute({ nominatorId, cycleId, nomineeIds })

      // Assert
      expect(peerNominationRepo.save).toHaveBeenCalledTimes(4)

      const saveCalls = peerNominationRepo.save.mock.calls
      saveCalls.forEach((call, index) => {
        const nomination = call[0]
        expect(nomination.cycleId).toBe(cycleId)
        expect(nomination.nominatorId).toBe(nominatorId)
        expect(nomination.nomineeId).toBe(nomineeIds[index])
        expect(nomination.status).toBe('PENDING')
        expect(nomination.nominatedAt).toBeInstanceOf(Date)
        expect(nomination.id).toBeDefined()
      })
    })

    it('should return correct DTO structure with all nomination details', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const managerId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

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

      const nominator = User.register({
        email: Email.fromString('nominator@example.com'),
        keycloakId: 'keycloak-id-1',
        name: 'Nominator User',
        level: 'Senior',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        managerId,
      })

      const nominees = nomineeIds.map((id, index) =>
        User.register({
          email: Email.fromString(`nominee${index}@example.com`),
          keycloakId: `keycloak-id-${index}`,
          name: `Nominee ${index}`,
          level: 'Senior',
          department: 'Engineering',
          jobTitle: 'Software Engineer',
          managerId,
        }),
      )

      cycleRepo.findById.mockResolvedValue(cycle)
      userRepo.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        const index = nomineeIds.findIndex((nId) => nId.equals(id))
        return index >= 0 ? nominees[index] : null
      })
      peerNominationRepo.findByNominatorAndCycle.mockResolvedValue([])
      peerNominationRepo.save.mockImplementation(async (nomination) => nomination)

      // Act
      const result = await useCase.execute({ nominatorId, cycleId, nomineeIds })

      // Assert
      expect(result).toBeDefined()
      expect(result.nominations).toHaveLength(3)

      result.nominations.forEach((nomination, index) => {
        expect(nomination).toMatchObject({
          id: expect.any(String),
          nomineeId: nomineeIds[index].value,
          nomineeName: `Nominee ${index}`,
          status: 'PENDING',
          nominatedAt: expect.any(Date),
        })
      })
    })

    it('should verify all nominations were fetched from repository for DTO creation', async () => {
      // Arrange
      const nominatorId = UserId.generate()
      const cycleId = ReviewCycleId.generate()
      const managerId = UserId.generate()
      const nomineeIds = [UserId.generate(), UserId.generate(), UserId.generate()]

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

      const nominator = User.register({
        email: Email.fromString('nominator@example.com'),
        keycloakId: 'keycloak-id-1',
        name: 'Nominator User',
        level: 'Senior',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        managerId,
      })

      const nominees = nomineeIds.map((id, index) =>
        User.register({
          email: Email.fromString(`nominee${index}@example.com`),
          keycloakId: `keycloak-id-${index}`,
          name: `Nominee ${index}`,
          level: 'Senior',
          department: 'Engineering',
          jobTitle: 'Software Engineer',
          managerId,
        }),
      )

      cycleRepo.findById.mockResolvedValue(cycle)
      userRepo.findById.mockImplementation(async (id: UserId) => {
        if (id.equals(nominatorId)) return nominator
        const index = nomineeIds.findIndex((nId) => nId.equals(id))
        return index >= 0 ? nominees[index] : null
      })
      peerNominationRepo.findByNominatorAndCycle.mockResolvedValue([])
      peerNominationRepo.save.mockImplementation(async (nomination) => nomination)

      // Act
      await useCase.execute({ nominatorId, cycleId, nomineeIds })

      // Assert - userRepo.findById should be called for nominator + each nominee during validation + each nominee during DTO creation
      // Total: 1 (nominator) + 3 (validation) + 3 (DTO creation) = 7 calls
      expect(userRepo.findById).toHaveBeenCalledTimes(7)
    })
  })
})
