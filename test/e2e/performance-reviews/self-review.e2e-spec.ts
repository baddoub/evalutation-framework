import { INestApplication, HttpStatus } from '@nestjs/common'
import { PrismaService } from '../../../src/auth/infrastructure/persistence/prisma/prisma.service'
import {
  createTestApp,
  cleanDatabase,
  createTestUser,
  authenticateTestUser,
  createTestReviewCycle,
  TestUser,
  TestReviewCycle,
} from '../test-helpers'
import request from 'supertest'

describe('Self Review E2E', () => {
  let app: INestApplication
  let prisma: PrismaService
  let employee: TestUser
  let employeeToken: string
  let otherEmployee: TestUser
  let activeCycle: TestReviewCycle

  beforeAll(async () => {
    app = await createTestApp()
    prisma = app.get(PrismaService)

    // Clean database
    await cleanDatabase(prisma)

    // Create test users
    employee = await createTestUser(prisma, {
      email: 'employee@example.com',
      name: 'Test Employee',
      roles: ['user'],
      department: 'Engineering',
      level: 'MID',
    })

    otherEmployee = await createTestUser(prisma, {
      email: 'other-employee@example.com',
      name: 'Other Employee',
      roles: ['user'],
      department: 'Engineering',
      level: 'SENIOR',
    })

    // Authenticate users
    employeeToken = await authenticateTestUser(app, employee)
    await authenticateTestUser(app, otherEmployee)

    // Create an active review cycle
    activeCycle = await createTestReviewCycle(prisma, {
      name: '2025 Annual Review',
      year: 2025,
      status: 'ACTIVE',
    })
  })

  afterAll(async () => {
    await cleanDatabase(prisma)
    await app.close()
  })

  afterEach(async () => {
    // Clean up self-reviews after each test
    await prisma.selfReview.deleteMany({})
  })

  describe('GET /performance-reviews/cycles/:cycleId/self-review', () => {
    it('should get my self-review', async () => {
      // Create a self-review
      const selfReview = await prisma.selfReview.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 4,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          narrative: 'This is my self-review narrative.',
          status: 'DRAFT',
        },
      })

      const response = await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.OK)

      expect(response.body).toMatchObject({
        id: selfReview.id,
        cycleId: activeCycle.id,
        status: 'DRAFT',
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'This is my self-review narrative.',
      })
      expect(response.body.wordCount).toBeDefined()
    })

    it('should return 404 when self-review does not exist', async () => {
      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.NOT_FOUND)
    })

    it('should not access other user self-review', async () => {
      // Create a self-review for other employee
      await prisma.selfReview.create({
        data: {
          cycleId: activeCycle.id,
          userId: otherEmployee.id,
          projectImpactScore: 4,
          directionScore: 4,
          engineeringExcellenceScore: 4,
          operationalOwnershipScore: 4,
          peopleImpactScore: 4,
          narrative: 'Other employee self-review.',
          status: 'DRAFT',
        },
      })

      // Current user tries to access it - should get 404 (not their review)
      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.NOT_FOUND)
    })
  })

  describe('PUT /performance-reviews/cycles/:cycleId/self-review', () => {
    it('should create a new self-review', async () => {
      const updateDto = {
        scores: {
          projectImpact: 3,
          direction: 4,
          engineeringExcellence: 3,
          operationalOwnership: 4,
          peopleImpact: 3,
        },
        narrative: 'This year I focused on improving our team processes and delivery.',
      }

      const response = await request(app.getHttpServer())
        .put(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .send(updateDto)
        .expect(HttpStatus.OK)

      expect(response.body.status).toBe('DRAFT')
      expect(response.body.scores).toMatchObject(updateDto.scores)
      expect(response.body.narrative).toBe(updateDto.narrative)

      // Verify in database
      const selfReview = await prisma.selfReview.findUnique({
        where: {
          cycleId_userId: {
            cycleId: activeCycle.id,
            userId: employee.id,
          },
        },
      })
      expect(selfReview).toBeDefined()
      expect(selfReview?.status).toBe('DRAFT')
    })

    it('should update existing self-review', async () => {
      // Create initial self-review
      await prisma.selfReview.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee.id,
          projectImpactScore: 2,
          directionScore: 2,
          engineeringExcellenceScore: 2,
          operationalOwnershipScore: 2,
          peopleImpactScore: 2,
          narrative: 'Initial narrative.',
          status: 'DRAFT',
        },
      })

      const updateDto = {
        scores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        narrative: 'Updated narrative with more details.',
      }

      const response = await request(app.getHttpServer())
        .put(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .send(updateDto)
        .expect(HttpStatus.OK)

      expect(response.body.scores).toMatchObject(updateDto.scores)
      expect(response.body.narrative).toBe(updateDto.narrative)

      // Verify in database
      const selfReview = await prisma.selfReview.findUnique({
        where: {
          cycleId_userId: {
            cycleId: activeCycle.id,
            userId: employee.id,
          },
        },
      })
      expect(selfReview?.projectImpactScore).toBe(4)
      expect(selfReview?.narrative).toBe(updateDto.narrative)
    })

    it('should validate score ranges (0-4)', async () => {
      const invalidDto = {
        scores: {
          projectImpact: 5, // Invalid: > 4
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'Test narrative.',
      }

      await request(app.getHttpServer())
        .put(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('should validate narrative word count (max 1000 words)', async () => {
      // Generate a narrative with > 1000 words
      const longNarrative = 'word '.repeat(1001).trim()

      const invalidDto = {
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: longNarrative,
      }

      await request(app.getHttpServer())
        .put(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('should allow partial updates (scores only)', async () => {
      // Create initial self-review
      await prisma.selfReview.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee.id,
          projectImpactScore: 2,
          directionScore: 2,
          engineeringExcellenceScore: 2,
          operationalOwnershipScore: 2,
          peopleImpactScore: 2,
          narrative: 'Initial narrative.',
          status: 'DRAFT',
        },
      })

      const updateDto = {
        scores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
      }

      const response = await request(app.getHttpServer())
        .put(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .send(updateDto)
        .expect(HttpStatus.OK)

      expect(response.body.scores.projectImpact).toBe(4)
      expect(response.body.narrative).toBe('Initial narrative.')
    })

    it('should allow partial updates (narrative only)', async () => {
      // Create initial self-review
      await prisma.selfReview.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 3,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          narrative: 'Initial narrative.',
          status: 'DRAFT',
        },
      })

      const updateDto = {
        narrative: 'Updated narrative with more context.',
      }

      const response = await request(app.getHttpServer())
        .put(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .send(updateDto)
        .expect(HttpStatus.OK)

      expect(response.body.scores.projectImpact).toBe(3)
      expect(response.body.narrative).toBe(updateDto.narrative)
    })
  })

  describe('POST /performance-reviews/cycles/:cycleId/self-review/submit', () => {
    it('should submit complete self-review', async () => {
      // Create a complete self-review
      await prisma.selfReview.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee.id,
          projectImpactScore: 3,
          directionScore: 4,
          engineeringExcellenceScore: 3,
          operationalOwnershipScore: 4,
          peopleImpactScore: 3,
          narrative: 'Complete self-review narrative with sufficient detail.',
          status: 'DRAFT',
        },
      })

      const response = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/self-review/submit`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.OK)

      expect(response.body.status).toBe('SUBMITTED')
      expect(response.body.submittedAt).toBeDefined()

      // Verify in database
      const selfReview = await prisma.selfReview.findUnique({
        where: {
          cycleId_userId: {
            cycleId: activeCycle.id,
            userId: employee.id,
          },
        },
      })
      expect(selfReview?.status).toBe('SUBMITTED')
      expect(selfReview?.submittedAt).toBeDefined()
    })

    it('should reject submitting non-existent self-review', async () => {
      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/self-review/submit`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.NOT_FOUND)
    })

    it('should reject submitting incomplete self-review', async () => {
      // Create incomplete self-review (empty narrative)
      await prisma.selfReview.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 3,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          narrative: '', // Empty
          status: 'DRAFT',
        },
      })

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/self-review/submit`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('should reject resubmitting already submitted self-review', async () => {
      // Create already submitted self-review
      await prisma.selfReview.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 3,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          narrative: 'Complete narrative.',
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      })

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/self-review/submit`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('Complete Self Review Workflow', () => {
    it('should complete full self-review workflow', async () => {
      // Step 1: Create self-review (partial)
      const createResponse = await request(app.getHttpServer())
        .put(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .send({
          scores: {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          },
        })
        .expect(HttpStatus.OK)

      expect(createResponse.body.status).toBe('DRAFT')

      // Step 2: Update narrative
      const updateResponse = await request(app.getHttpServer())
        .put(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .send({
          narrative: 'Complete narrative describing my achievements and growth areas.',
        })
        .expect(HttpStatus.OK)

      expect(updateResponse.body.narrative).toBeDefined()

      // Step 3: Update scores
      const updateScoresResponse = await request(app.getHttpServer())
        .put(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .send({
          scores: {
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 4,
          },
        })
        .expect(HttpStatus.OK)

      expect(updateScoresResponse.body.scores.projectImpact).toBe(4)

      // Step 4: Get self-review to verify
      const getResponse = await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.OK)

      expect(getResponse.body.status).toBe('DRAFT')
      expect(getResponse.body.scores.projectImpact).toBe(4)

      // Step 5: Submit self-review
      const submitResponse = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/self-review/submit`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.OK)

      expect(submitResponse.body.status).toBe('SUBMITTED')
      expect(submitResponse.body.submittedAt).toBeDefined()

      // Step 6: Verify cannot update after submission
      await request(app.getHttpServer())
        .put(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .send({
          scores: {
            projectImpact: 2,
          },
        })
        .expect(HttpStatus.BAD_REQUEST)

      // Step 7: Verify database state
      const selfReview = await prisma.selfReview.findUnique({
        where: {
          cycleId_userId: {
            cycleId: activeCycle.id,
            userId: employee.id,
          },
        },
      })

      expect(selfReview).toBeDefined()
      expect(selfReview?.status).toBe('SUBMITTED')
      expect(selfReview?.submittedAt).toBeDefined()
      expect(selfReview?.projectImpactScore).toBe(4)
    })
  })
})
