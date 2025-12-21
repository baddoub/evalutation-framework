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
    it('should nominate peers successfully', async () => {
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
  })
})
