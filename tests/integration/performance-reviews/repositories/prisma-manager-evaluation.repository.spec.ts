import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from '../../../../src/auth/infrastructure/persistence/prisma/prisma.service'
import { PrismaManagerEvaluationRepository } from '../../../../src/performance-reviews/infrastructure/persistence/repositories/prisma-manager-evaluation.repository'
import { ManagerEvaluation } from '../../../../src/performance-reviews/domain/entities/manager-evaluation.entity'
import { ReviewCycleId } from '../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../src/auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../../src/performance-reviews/domain/value-objects/pillar-scores.vo'

describe('PrismaManagerEvaluationRepository (Integration)', () => {
  let repository: PrismaManagerEvaluationRepository
  let prisma: PrismaService
  let testCycleId: ReviewCycleId
  let employeeId: UserId
  let managerId: UserId

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [PrismaService, PrismaManagerEvaluationRepository],
    }).compile()

    repository = module.get<PrismaManagerEvaluationRepository>(PrismaManagerEvaluationRepository)
    prisma = module.get<PrismaService>(PrismaService)
    await prisma.$connect()

    // Setup test data
    testCycleId = ReviewCycleId.generate()
    employeeId = UserId.generate()
    managerId = UserId.generate()

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

    await prisma.user.createMany({
      data: [
        {
          id: employeeId.value,
          email: 'employee@example.com',
          name: 'Employee',
          keycloakId: 'employee-keycloak-id',
        },
        {
          id: managerId.value,
          email: 'manager@example.com',
          name: 'Manager',
          keycloakId: 'manager-keycloak-id',
        },
      ],
    })
  })

  afterAll(async () => {
    await prisma.managerEvaluation.deleteMany({})
    await prisma.reviewCycle.deleteMany({})
    await prisma.user.deleteMany({ where: { email: { in: ['employee@example.com', 'manager@example.com'] } } })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await prisma.managerEvaluation.deleteMany({})
  })

  it('should save and retrieve manager evaluation', async () => {
    const scores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const evaluation = ManagerEvaluation.create({
      cycleId: testCycleId,
      employeeId,
      managerId,
      scores,
      narrative: 'Overall assessment',
      strengths: 'Strong technical skills',
      growthAreas: 'Leadership development',
      developmentPlan: '1-on-1 coaching sessions',
    })

    const saved = await repository.save(evaluation)
    const found = await repository.findById(saved.id)

    expect(found).toBeDefined()
    expect(found?.employeeId.value).toBe(employeeId.value)
    expect(found?.managerId.value).toBe(managerId.value)
    expect(found?.narrative).toBe('Overall assessment')
  })

  it('should find evaluation by employee and cycle', async () => {
    const scores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const evaluation = ManagerEvaluation.create({
      cycleId: testCycleId,
      employeeId,
      managerId,
      scores,
      narrative: 'Test',
      strengths: 'Test',
      growthAreas: 'Test',
      developmentPlan: 'Test',
    })

    await repository.save(evaluation)

    const found = await repository.findByEmployeeAndCycle(employeeId, testCycleId)

    expect(found).toBeDefined()
    expect(found?.employeeId.value).toBe(employeeId.value)
  })

  it('should find evaluations by manager and cycle', async () => {
    const scores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const evaluation = ManagerEvaluation.create({
      cycleId: testCycleId,
      employeeId,
      managerId,
      scores,
      narrative: 'Test',
      strengths: 'Test',
      growthAreas: 'Test',
      developmentPlan: 'Test',
    })

    await repository.save(evaluation)

    const evaluations = await repository.findByManagerAndCycle(managerId, testCycleId)

    expect(evaluations).toHaveLength(1)
    expect(evaluations[0].managerId.value).toBe(managerId.value)
  })

  it('should persist submission and calibration status', async () => {
    const scores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const evaluation = ManagerEvaluation.create({
      cycleId: testCycleId,
      employeeId,
      managerId,
      scores,
      narrative: 'Test',
      strengths: 'Test',
      growthAreas: 'Test',
      developmentPlan: 'Test',
    })

    await repository.save(evaluation)

    evaluation.submit()
    await repository.save(evaluation)

    evaluation.calibrate()
    await repository.save(evaluation)

    const found = await repository.findById(evaluation.id)
    expect(found?.status.value).toBe('CALIBRATED')
    expect(found?.submittedAt).toBeDefined()
    expect(found?.calibratedAt).toBeDefined()
  })

  it('should soft delete manager evaluation', async () => {
    const scores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const evaluation = ManagerEvaluation.create({
      cycleId: testCycleId,
      employeeId,
      managerId,
      scores,
      narrative: 'Test',
      strengths: 'Test',
      growthAreas: 'Test',
      developmentPlan: 'Test',
    })

    await repository.save(evaluation)
    await repository.delete(evaluation.id)

    const found = await repository.findById(evaluation.id)
    expect(found).toBeNull()

    const rawRecord = await prisma.managerEvaluation.findUnique({
      where: { id: evaluation.id.value },
    })
    expect(rawRecord?.deletedAt).toBeDefined()
  })
})
