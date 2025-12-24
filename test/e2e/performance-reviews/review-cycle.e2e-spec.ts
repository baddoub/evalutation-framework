import { INestApplication, HttpStatus } from '@nestjs/common'
import { PrismaService } from '../../../src/auth/infrastructure/persistence/prisma/prisma.service'
import {
  createTestApp,
  cleanDatabase,
  createTestUser,
  authenticateTestUser,
  TestUser,
} from '../test-helpers'
import request from 'supertest'

describe('Review Cycle E2E', () => {
  let app: INestApplication
  let prisma: PrismaService
  let hrAdmin: TestUser
  let hrAdminToken: string
  let regularUser: TestUser
  let regularUserToken: string

  beforeAll(async () => {
    app = await createTestApp()
    prisma = app.get(PrismaService)

    // Clean database
    await cleanDatabase(prisma)

    // Create test users
    hrAdmin = await createTestUser(prisma, {
      email: 'hr-admin@example.com',
      name: 'HR Admin',
      roles: ['user', 'HR_ADMIN'],
      department: 'HR',
    })

    regularUser = await createTestUser(prisma, {
      email: 'user@example.com',
      name: 'Regular User',
      roles: ['user'],
      department: 'Engineering',
      level: 'MID',
    })

    // Authenticate users
    hrAdminToken = await authenticateTestUser(app, hrAdmin)
    regularUserToken = await authenticateTestUser(app, regularUser)
  })

  afterAll(async () => {
    await cleanDatabase(prisma)
    await app.close()
  })

  afterEach(async () => {
    // Clean up review cycles after each test
    await prisma.reviewCycle.deleteMany({})
  })

  describe('POST /performance-reviews/cycles', () => {
    it('should create a review cycle as HR Admin', async () => {
      const createDto = {
        name: '2025 Annual Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-03-01').toISOString(),
          peerFeedback: new Date('2025-03-15').toISOString(),
          managerEval: new Date('2025-03-30').toISOString(),
          calibration: new Date('2025-04-15').toISOString(),
          feedbackDelivery: new Date('2025-04-30').toISOString(),
        },
      }

      const response = await request(app.getHttpServer())
        .post('/performance-reviews/cycles')
        .set('Authorization', hrAdminToken)
        .send(createDto)
        .expect(HttpStatus.CREATED)

      expect(response.body).toMatchObject({
        name: createDto.name,
        year: createDto.year,
        status: 'DRAFT',
      })
      expect(response.body.id).toBeDefined()
      expect(response.body.deadlines).toBeDefined()

      // Verify in database
      const cycle = await prisma.reviewCycle.findUnique({
        where: { id: response.body.id },
      })
      expect(cycle).toBeDefined()
      expect(cycle?.status).toBe('DRAFT')
    })

    it('should reject creation by non-HR Admin', async () => {
      const createDto = {
        name: '2025 Annual Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-03-01').toISOString(),
          peerFeedback: new Date('2025-03-15').toISOString(),
          managerEval: new Date('2025-03-30').toISOString(),
          calibration: new Date('2025-04-15').toISOString(),
          feedbackDelivery: new Date('2025-04-30').toISOString(),
        },
      }

      await request(app.getHttpServer())
        .post('/performance-reviews/cycles')
        .set('Authorization', regularUserToken)
        .send(createDto)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('should validate required fields', async () => {
      const invalidDto = {
        name: '2025 Annual Review',
        // Missing year and deadlines
      }

      await request(app.getHttpServer())
        .post('/performance-reviews/cycles')
        .set('Authorization', hrAdminToken)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('should reject duplicate cycle name for same year', async () => {
      const createDto = {
        name: '2025 Annual Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-03-01').toISOString(),
          peerFeedback: new Date('2025-03-15').toISOString(),
          managerEval: new Date('2025-03-30').toISOString(),
          calibration: new Date('2025-04-15').toISOString(),
          feedbackDelivery: new Date('2025-04-30').toISOString(),
        },
      }

      // Create first cycle
      await request(app.getHttpServer())
        .post('/performance-reviews/cycles')
        .set('Authorization', hrAdminToken)
        .send(createDto)
        .expect(HttpStatus.CREATED)

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/performance-reviews/cycles')
        .set('Authorization', hrAdminToken)
        .send(createDto)
        .expect(HttpStatus.CONFLICT)
    })
  })

  describe('POST /performance-reviews/cycles/:cycleId/start', () => {
    it('should start a review cycle as HR Admin', async () => {
      // Create a draft cycle
      const cycle = await prisma.reviewCycle.create({
        data: {
          name: '2025 Annual Review',
          year: 2025,
          status: 'DRAFT',
          selfReviewDeadline: new Date('2025-03-01'),
          peerFeedbackDeadline: new Date('2025-03-15'),
          managerEvalDeadline: new Date('2025-03-30'),
          calibrationDeadline: new Date('2025-04-15'),
          feedbackDeliveryDeadline: new Date('2025-04-30'),
          startDate: new Date(),
        },
      })

      const response = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${cycle.id}/start`)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.OK)

      expect(response.body.status).toBe('ACTIVE')
      expect(response.body.startedAt).toBeDefined()

      // Verify in database
      const updatedCycle = await prisma.reviewCycle.findUnique({
        where: { id: cycle.id },
      })
      expect(updatedCycle?.status).toBe('ACTIVE')
    })

    it('should reject starting by non-HR Admin', async () => {
      const cycle = await prisma.reviewCycle.create({
        data: {
          name: '2025 Annual Review',
          year: 2025,
          status: 'DRAFT',
          selfReviewDeadline: new Date('2025-03-01'),
          peerFeedbackDeadline: new Date('2025-03-15'),
          managerEvalDeadline: new Date('2025-03-30'),
          calibrationDeadline: new Date('2025-04-15'),
          feedbackDeliveryDeadline: new Date('2025-04-30'),
          startDate: new Date(),
        },
      })

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${cycle.id}/start`)
        .set('Authorization', regularUserToken)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('should reject starting non-existent cycle', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${fakeId}/start`)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.NOT_FOUND)
    })

    it('should reject starting already active cycle', async () => {
      const cycle = await prisma.reviewCycle.create({
        data: {
          name: '2025 Annual Review',
          year: 2025,
          status: 'ACTIVE',
          selfReviewDeadline: new Date('2025-03-01'),
          peerFeedbackDeadline: new Date('2025-03-15'),
          managerEvalDeadline: new Date('2025-03-30'),
          calibrationDeadline: new Date('2025-04-15'),
          feedbackDeliveryDeadline: new Date('2025-04-30'),
          startDate: new Date(),
        },
      })

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${cycle.id}/start`)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('GET /performance-reviews/cycles/active', () => {
    it('should get active review cycle', async () => {
      // Create an active cycle
      const cycle = await prisma.reviewCycle.create({
        data: {
          name: '2025 Annual Review',
          year: 2025,
          status: 'ACTIVE',
          selfReviewDeadline: new Date('2025-03-01'),
          peerFeedbackDeadline: new Date('2025-03-15'),
          managerEvalDeadline: new Date('2025-03-30'),
          calibrationDeadline: new Date('2025-04-15'),
          feedbackDeliveryDeadline: new Date('2025-04-30'),
          startDate: new Date(),
        },
      })

      const response = await request(app.getHttpServer())
        .get('/performance-reviews/cycles/active')
        .set('Authorization', regularUserToken)
        .expect(HttpStatus.OK)

      expect(response.body).toMatchObject({
        id: cycle.id,
        name: cycle.name,
        year: cycle.year,
        status: 'ACTIVE',
      })
      expect(response.body.deadlines).toBeDefined()
    })

    it('should return 404 when no active cycle exists', async () => {
      // Create only a draft cycle
      await prisma.reviewCycle.create({
        data: {
          name: '2025 Annual Review',
          year: 2025,
          status: 'DRAFT',
          selfReviewDeadline: new Date('2025-03-01'),
          peerFeedbackDeadline: new Date('2025-03-15'),
          managerEvalDeadline: new Date('2025-03-30'),
          calibrationDeadline: new Date('2025-04-15'),
          feedbackDeliveryDeadline: new Date('2025-04-30'),
          startDate: new Date(),
        },
      })

      await request(app.getHttpServer())
        .get('/performance-reviews/cycles/active')
        .set('Authorization', regularUserToken)
        .expect(HttpStatus.NOT_FOUND)
    })
  })

  describe('GET /performance-reviews/cycles', () => {
    it('should list review cycles', async () => {
      // Create multiple cycles
      await prisma.reviewCycle.createMany({
        data: [
          {
            name: '2024 Annual Review',
            year: 2024,
            status: 'COMPLETED',
            selfReviewDeadline: new Date('2024-03-01'),
            peerFeedbackDeadline: new Date('2024-03-15'),
            managerEvalDeadline: new Date('2024-03-30'),
            calibrationDeadline: new Date('2024-04-15'),
            feedbackDeliveryDeadline: new Date('2024-04-30'),
            startDate: new Date('2024-01-01'),
          },
          {
            name: '2025 Annual Review',
            year: 2025,
            status: 'ACTIVE',
            selfReviewDeadline: new Date('2025-03-01'),
            peerFeedbackDeadline: new Date('2025-03-15'),
            managerEvalDeadline: new Date('2025-03-30'),
            calibrationDeadline: new Date('2025-04-15'),
            feedbackDeliveryDeadline: new Date('2025-04-30'),
            startDate: new Date(),
          },
        ],
      })

      const response = await request(app.getHttpServer())
        .get('/performance-reviews/cycles')
        .set('Authorization', regularUserToken)
        .expect(HttpStatus.OK)

      expect(response.body.cycles).toBeInstanceOf(Array)
      expect(response.body.total).toBeDefined()
      expect(response.body.limit).toBeDefined()
      expect(response.body.offset).toBeDefined()
    })

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/performance-reviews/cycles?limit=10&offset=0')
        .set('Authorization', regularUserToken)
        .expect(HttpStatus.OK)

      expect(response.body.limit).toBe(10)
      expect(response.body.offset).toBe(0)
    })
  })

  describe('Complete Review Cycle Workflow', () => {
    it('should complete full review cycle workflow', async () => {
      // Step 1: Create review cycle
      const createDto = {
        name: '2025 Q1 Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-03-01').toISOString(),
          peerFeedback: new Date('2025-03-15').toISOString(),
          managerEval: new Date('2025-03-30').toISOString(),
          calibration: new Date('2025-04-15').toISOString(),
          feedbackDelivery: new Date('2025-04-30').toISOString(),
        },
      }

      const createResponse = await request(app.getHttpServer())
        .post('/performance-reviews/cycles')
        .set('Authorization', hrAdminToken)
        .send(createDto)
        .expect(HttpStatus.CREATED)

      const cycleId = createResponse.body.id
      expect(createResponse.body.status).toBe('DRAFT')

      // Step 2: Start review cycle
      const startResponse = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${cycleId}/start`)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.OK)

      expect(startResponse.body.status).toBe('ACTIVE')

      // Step 3: Verify active cycle can be retrieved
      const activeResponse = await request(app.getHttpServer())
        .get('/performance-reviews/cycles/active')
        .set('Authorization', regularUserToken)
        .expect(HttpStatus.OK)

      expect(activeResponse.body.id).toBe(cycleId)
      expect(activeResponse.body.status).toBe('ACTIVE')

      // Step 4: Verify cycle appears in list
      const listResponse = await request(app.getHttpServer())
        .get('/performance-reviews/cycles')
        .set('Authorization', regularUserToken)
        .expect(HttpStatus.OK)

      expect(listResponse.body.cycles).toBeInstanceOf(Array)

      // Step 5: Verify database state
      const cycle = await prisma.reviewCycle.findUnique({
        where: { id: cycleId },
      })

      expect(cycle).toBeDefined()
      expect(cycle?.status).toBe('ACTIVE')
      expect(cycle?.startDate).toBeDefined()
    })
  })
})
