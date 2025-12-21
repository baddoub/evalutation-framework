import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from '../../../../src/auth/infrastructure/persistence/prisma/prisma.service'
import { PrismaPeerFeedbackRepository } from '../../../../src/performance-reviews/infrastructure/persistence/repositories/prisma-peer-feedback.repository'
import { PeerFeedback } from '../../../../src/performance-reviews/domain/entities/peer-feedback.entity'
import { ReviewCycleId } from '../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../src/auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../../src/performance-reviews/domain/value-objects/pillar-scores.vo'

describe('PrismaPeerFeedbackRepository (Integration)', () => {
  let repository: PrismaPeerFeedbackRepository
  let prisma: PrismaService
  let testCycleId: ReviewCycleId
  let revieweeId: UserId
  let reviewerId: UserId

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [PrismaService, PrismaPeerFeedbackRepository],
    }).compile()

    repository = module.get<PrismaPeerFeedbackRepository>(PrismaPeerFeedbackRepository)
    prisma = module.get<PrismaService>(PrismaService)
    await prisma.$connect()

    // Setup test data
    testCycleId = ReviewCycleId.generate()
    revieweeId = UserId.generate()
    reviewerId = UserId.generate()

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
          id: revieweeId.value,
          email: 'reviewee@example.com',
          name: 'Reviewee',
          keycloakId: 'reviewee-keycloak-id',
        },
        {
          id: reviewerId.value,
          email: 'reviewer@example.com',
          name: 'Reviewer',
          keycloakId: 'reviewer-keycloak-id',
        },
      ],
    })
  })

  afterAll(async () => {
    await prisma.peerFeedback.deleteMany({})
    await prisma.reviewCycle.deleteMany({})
    await prisma.user.deleteMany({ where: { email: { in: ['reviewee@example.com', 'reviewer@example.com'] } } })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await prisma.peerFeedback.deleteMany({})
  })

  it('should save and retrieve peer feedback', async () => {
    const scores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const feedback = PeerFeedback.create({
      cycleId: testCycleId,
      revieweeId,
      reviewerId,
      scores,
      strengths: 'Great technical skills',
      growthAreas: 'Could improve communication',
      generalComments: 'Overall good performance',
    })

    const saved = await repository.save(feedback)
    const found = await repository.findById(saved.id)

    expect(found).toBeDefined()
    expect(found?.revieweeId.value).toBe(revieweeId.value)
    expect(found?.reviewerId.value).toBe(reviewerId.value)
    expect(found?.strengths).toBe('Great technical skills')
  })

  it('should find feedback by reviewee and cycle', async () => {
    const scores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const feedback = PeerFeedback.create({
      cycleId: testCycleId,
      revieweeId,
      reviewerId,
      scores,
    })

    await repository.save(feedback)

    const feedbacks = await repository.findByRevieweeAndCycle(revieweeId, testCycleId)

    expect(feedbacks).toHaveLength(1)
    expect(feedbacks[0].revieweeId.value).toBe(revieweeId.value)
  })

  it('should find feedback by reviewer and cycle', async () => {
    const scores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const feedback = PeerFeedback.create({
      cycleId: testCycleId,
      revieweeId,
      reviewerId,
      scores,
    })

    await repository.save(feedback)

    const feedbacks = await repository.findByReviewerAndCycle(reviewerId, testCycleId)

    expect(feedbacks).toHaveLength(1)
    expect(feedbacks[0].reviewerId.value).toBe(reviewerId.value)
  })

  it('should soft delete peer feedback', async () => {
    const scores = PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    })

    const feedback = PeerFeedback.create({
      cycleId: testCycleId,
      revieweeId,
      reviewerId,
      scores,
    })

    await repository.save(feedback)
    await repository.delete(feedback.id)

    const found = await repository.findById(feedback.id)
    expect(found).toBeNull()

    const rawRecord = await prisma.peerFeedback.findUnique({
      where: { id: feedback.id.value },
    })
    expect(rawRecord?.deletedAt).toBeDefined()
  })
})
