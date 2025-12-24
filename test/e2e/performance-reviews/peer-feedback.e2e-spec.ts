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

describe('Peer Feedback E2E', () => {
  let app: INestApplication
  let prisma: PrismaService
  let employee1: TestUser
  let employee1Token: string
  let employee2: TestUser
  let employee2Token: string
  let employee3: TestUser
  let employee3Token: string
  let activeCycle: TestReviewCycle

  beforeAll(async () => {
    app = await createTestApp()
    prisma = app.get(PrismaService)

    // Clean database
    await cleanDatabase(prisma)

    // Create test users
    employee1 = await createTestUser(prisma, {
      email: 'employee1@example.com',
      name: 'Employee One',
      roles: ['user'],
      department: 'Engineering',
      level: 'MID',
    })

    employee2 = await createTestUser(prisma, {
      email: 'employee2@example.com',
      name: 'Employee Two',
      roles: ['user'],
      department: 'Engineering',
      level: 'SENIOR',
    })

    employee3 = await createTestUser(prisma, {
      email: 'employee3@example.com',
      name: 'Employee Three',
      roles: ['user'],
      department: 'Engineering',
      level: 'SENIOR',
    })

    // Authenticate users
    employee1Token = await authenticateTestUser(app, employee1)
    employee2Token = await authenticateTestUser(app, employee2)
    employee3Token = await authenticateTestUser(app, employee3)

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
    // Clean up peer feedback data after each test
    await prisma.peerFeedback.deleteMany({})
    await prisma.peerNomination.deleteMany({})
  })

  describe('POST /performance-reviews/cycles/:cycleId/peer-nominations', () => {
    it('should nominate peers for feedback', async () => {
      const nominateDto = {
        nomineeIds: [employee2.id, employee3.id],
      }

      const response = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-nominations`)
        .set('Authorization', employee1Token)
        .send(nominateDto)
        .expect(HttpStatus.CREATED)

      expect(response.body.nominations).toHaveLength(2)
      expect(response.body.nominations[0]).toMatchObject({
        nomineeId: employee2.id,
        status: 'PENDING',
      })

      // Verify in database
      const nominations = await prisma.peerNomination.findMany({
        where: {
          cycleId: activeCycle.id,
          nominatorId: employee1.id,
        },
      })
      expect(nominations).toHaveLength(2)
    })

    it('should reject nominating self', async () => {
      const nominateDto = {
        nomineeIds: [employee1.id], // Self-nomination
      }

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-nominations`)
        .set('Authorization', employee1Token)
        .send(nominateDto)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('should reject duplicate nominations', async () => {
      const nominateDto = {
        nomineeIds: [employee2.id],
      }

      // First nomination succeeds
      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-nominations`)
        .set('Authorization', employee1Token)
        .send(nominateDto)
        .expect(HttpStatus.CREATED)

      // Duplicate nomination fails
      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-nominations`)
        .set('Authorization', employee1Token)
        .send(nominateDto)
        .expect(HttpStatus.CONFLICT)
    })

    it('should enforce maximum peer nominations (e.g., 5 peers)', async () => {
      // Create 6 additional users
      const additionalUsers = []
      for (let i = 0; i < 6; i++) {
        const user = await createTestUser(prisma, {
          email: `peer${i}@example.com`,
          name: `Peer ${i}`,
          roles: ['user'],
          department: 'Engineering',
        })
        additionalUsers.push(user.id)
      }

      const nominateDto = {
        nomineeIds: additionalUsers,
      }

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-nominations`)
        .set('Authorization', employee1Token)
        .send(nominateDto)
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('POST /performance-reviews/cycles/:cycleId/peer-feedback', () => {
    beforeEach(async () => {
      // Create peer nomination for employee2 to review employee1
      await prisma.peerNomination.create({
        data: {
          cycleId: activeCycle.id,
          nominatorId: employee1.id,
          nomineeId: employee2.id,
          status: 'ACCEPTED',
          nominatedAt: new Date(),
        },
      })
    })

    it('should submit peer feedback', async () => {
      const feedbackDto = {
        revieweeId: employee1.id,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 4,
        },
        strengths: 'Excellent technical skills and team collaboration.',
        growthAreas: 'Could improve documentation practices.',
        generalComments: 'Overall strong contributor to the team.',
      }

      const response = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee2Token)
        .send(feedbackDto)
        .expect(HttpStatus.CREATED)

      expect(response.body).toMatchObject({
        revieweeId: employee1.id,
        isAnonymized: true,
      })
      expect(response.body.id).toBeDefined()
      expect(response.body.submittedAt).toBeDefined()

      // Verify in database
      const feedback = await prisma.peerFeedback.findUnique({
        where: {
          cycleId_revieweeId_reviewerId: {
            cycleId: activeCycle.id,
            revieweeId: employee1.id,
            reviewerId: employee2.id,
          },
        },
      })
      expect(feedback).toBeDefined()
      expect(feedback?.projectImpactScore).toBe(4)
    })

    it('should validate score ranges (0-4)', async () => {
      const invalidDto = {
        revieweeId: employee1.id,
        scores: {
          projectImpact: 5, // Invalid
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        strengths: 'Good work.',
      }

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee2Token)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('should reject duplicate peer feedback', async () => {
      const feedbackDto = {
        revieweeId: employee1.id,
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        strengths: 'Good work.',
      }

      // First submission succeeds
      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee2Token)
        .send(feedbackDto)
        .expect(HttpStatus.CREATED)

      // Duplicate submission fails
      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee2Token)
        .send(feedbackDto)
        .expect(HttpStatus.CONFLICT)
    })

    it('should reject self-feedback', async () => {
      const feedbackDto = {
        revieweeId: employee2.id, // Self-feedback
        scores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        strengths: 'I am great.',
      }

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee2Token)
        .send(feedbackDto)
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('GET /performance-reviews/cycles/:cycleId/peer-feedback', () => {
    beforeEach(async () => {
      // Create peer feedback from employee2 and employee3 for employee1
      await prisma.peerFeedback.createMany({
        data: [
          {
            cycleId: activeCycle.id,
            revieweeId: employee1.id,
            reviewerId: employee2.id,
            projectImpactScore: 4,
            directionScore: 3,
            engineeringExcellenceScore: 4,
            operationalOwnershipScore: 3,
            peopleImpactScore: 4,
            strengths: 'Strong technical skills.',
            growthAreas: 'Improve documentation.',
            submittedAt: new Date(),
          },
          {
            cycleId: activeCycle.id,
            revieweeId: employee1.id,
            reviewerId: employee3.id,
            projectImpactScore: 3,
            directionScore: 4,
            engineeringExcellenceScore: 3,
            operationalOwnershipScore: 4,
            peopleImpactScore: 3,
            strengths: 'Great collaboration.',
            growthAreas: 'Work on technical depth.',
            submittedAt: new Date(),
          },
        ],
      })
    })

    it('should get aggregated peer feedback', async () => {
      const response = await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee1Token)
        .expect(HttpStatus.OK)

      expect(response.body.feedbackCount).toBe(2)
      expect(response.body.aggregatedScores).toMatchObject({
        projectImpact: 3.5, // (4 + 3) / 2
        direction: 3.5, // (3 + 4) / 2
        engineeringExcellence: 3.5, // (4 + 3) / 2
        operationalOwnership: 3.5, // (3 + 4) / 2
        peopleImpact: 3.5, // (4 + 3) / 2
      })
      expect(response.body.anonymizedComments).toBeInstanceOf(Array)
      expect(response.body.anonymizedComments.length).toBeGreaterThan(0)
    })

    it('should return anonymized feedback (no reviewer names)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee1Token)
        .expect(HttpStatus.OK)

      expect(response.body.anonymizedComments).toBeInstanceOf(Array)
      response.body.anonymizedComments.forEach((comment: any) => {
        expect(comment).not.toHaveProperty('reviewerId')
        expect(comment).not.toHaveProperty('reviewerName')
        expect(comment).toHaveProperty('comment')
      })
    })

    it('should return 404 when no feedback exists', async () => {
      // Clean all feedback
      await prisma.peerFeedback.deleteMany({})

      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee1Token)
        .expect(HttpStatus.NOT_FOUND)
    })

    it('should only show feedback for current user', async () => {
      // Employee2 tries to get feedback (none exists for them)
      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee2Token)
        .expect(HttpStatus.NOT_FOUND)
    })
  })

  describe('GET /performance-reviews/cycles/:cycleId/peer-feedback/requests', () => {
    it('should get peer feedback requests for reviewer', async () => {
      // Create nominations where employee2 is nominated to review employee1 and employee3
      await prisma.peerNomination.createMany({
        data: [
          {
            cycleId: activeCycle.id,
            nominatorId: employee1.id,
            nomineeId: employee2.id,
            status: 'ACCEPTED',
            nominatedAt: new Date(),
          },
          {
            cycleId: activeCycle.id,
            nominatorId: employee3.id,
            nomineeId: employee2.id,
            status: 'PENDING',
            nominatedAt: new Date(),
          },
        ],
      })

      const response = await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback/requests`)
        .set('Authorization', employee2Token)
        .expect(HttpStatus.OK)

      expect(response.body.requests).toBeInstanceOf(Array)
      expect(response.body.total).toBeDefined()
    })
  })

  describe('Complete Peer Feedback Workflow', () => {
    it('should complete full peer feedback workflow', async () => {
      // Step 1: Employee1 nominates peers
      const nominateResponse = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-nominations`)
        .set('Authorization', employee1Token)
        .send({
          nomineeIds: [employee2.id, employee3.id],
        })
        .expect(HttpStatus.CREATED)

      expect(nominateResponse.body.nominations).toHaveLength(2)

      // Simulate acceptance of nominations (manually update DB)
      await prisma.peerNomination.updateMany({
        where: {
          cycleId: activeCycle.id,
          nominatorId: employee1.id,
        },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      })

      // Step 2: Employee2 submits feedback for Employee1
      const feedback1Response = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee2Token)
        .send({
          revieweeId: employee1.id,
          scores: {
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 4,
          },
          strengths: 'Strong technical execution.',
          growthAreas: 'Improve communication.',
        })
        .expect(HttpStatus.CREATED)

      expect(feedback1Response.body.isAnonymized).toBe(true)

      // Step 3: Employee3 submits feedback for Employee1
      const feedback2Response = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee3Token)
        .send({
          revieweeId: employee1.id,
          scores: {
            projectImpact: 3,
            direction: 4,
            engineeringExcellence: 3,
            operationalOwnership: 4,
            peopleImpact: 3,
          },
          strengths: 'Great team player.',
          growthAreas: 'Work on technical depth.',
        })
        .expect(HttpStatus.CREATED)

      expect(feedback2Response.body.isAnonymized).toBe(true)

      // Step 4: Employee1 views aggregated feedback
      const aggregatedResponse = await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/peer-feedback`)
        .set('Authorization', employee1Token)
        .expect(HttpStatus.OK)

      expect(aggregatedResponse.body.feedbackCount).toBe(2)
      expect(aggregatedResponse.body.aggregatedScores.projectImpact).toBe(3.5)
      expect(aggregatedResponse.body.anonymizedComments).toBeInstanceOf(Array)

      // Step 5: Verify database state
      const feedbackCount = await prisma.peerFeedback.count({
        where: {
          cycleId: activeCycle.id,
          revieweeId: employee1.id,
        },
      })
      expect(feedbackCount).toBe(2)

      const nominations = await prisma.peerNomination.findMany({
        where: {
          cycleId: activeCycle.id,
          nominatorId: employee1.id,
        },
      })
      expect(nominations).toHaveLength(2)
      expect(nominations.every((n) => n.status === 'ACCEPTED')).toBe(true)
    })
  })
})
