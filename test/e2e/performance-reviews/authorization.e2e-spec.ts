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

describe('Authorization E2E', () => {
  let app: INestApplication
  let prisma: PrismaService
  let hrAdmin: TestUser
  let hrAdminToken: string
  let calibrator: TestUser
  let calibratorToken: string
  let manager: TestUser
  let managerToken: string
  let employee: TestUser
  let employeeToken: string
  let otherEmployee: TestUser
  let activeCycle: TestReviewCycle

  beforeAll(async () => {
    app = await createTestApp()
    prisma = app.get(PrismaService)

    // Clean database
    await cleanDatabase(prisma)

    // Create test users with different roles
    hrAdmin = await createTestUser(prisma, {
      email: 'hr-admin@example.com',
      name: 'HR Admin',
      roles: ['user', 'HR_ADMIN'],
      department: 'HR',
    })

    calibrator = await createTestUser(prisma, {
      email: 'calibrator@example.com',
      name: 'Calibrator',
      roles: ['user', 'CALIBRATOR'],
      department: 'Engineering',
    })

    manager = await createTestUser(prisma, {
      email: 'manager@example.com',
      name: 'Team Manager',
      roles: ['user', 'MANAGER'],
      department: 'Engineering',
    })

    employee = await createTestUser(prisma, {
      email: 'employee@example.com',
      name: 'Employee',
      roles: ['user'],
      department: 'Engineering',
      level: 'MID',
      managerId: manager.id,
    })

    otherEmployee = await createTestUser(prisma, {
      email: 'other-employee@example.com',
      name: 'Other Employee',
      roles: ['user'],
      department: 'Engineering',
      level: 'SENIOR',
      managerId: manager.id,
    })

    // Authenticate users
    hrAdminToken = await authenticateTestUser(app, hrAdmin)
    calibratorToken = await authenticateTestUser(app, calibrator)
    managerToken = await authenticateTestUser(app, manager)
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

  describe('Review Cycle Management Authorization', () => {
    it('HR_ADMIN can create review cycles', async () => {
      const createDto = {
        name: '2025 Q2 Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-06-01').toISOString(),
          peerFeedback: new Date('2025-06-15').toISOString(),
          managerEval: new Date('2025-06-30').toISOString(),
          calibration: new Date('2025-07-15').toISOString(),
          feedbackDelivery: new Date('2025-07-30').toISOString(),
        },
      }

      await request(app.getHttpServer())
        .post('/performance-reviews/cycles')
        .set('Authorization', hrAdminToken)
        .send(createDto)
        .expect(HttpStatus.CREATED)
    })

    it('CALIBRATOR cannot create review cycles', async () => {
      const createDto = {
        name: '2025 Q3 Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-09-01').toISOString(),
          peerFeedback: new Date('2025-09-15').toISOString(),
          managerEval: new Date('2025-09-30').toISOString(),
          calibration: new Date('2025-10-15').toISOString(),
          feedbackDelivery: new Date('2025-10-30').toISOString(),
        },
      }

      await request(app.getHttpServer())
        .post('/performance-reviews/cycles')
        .set('Authorization', calibratorToken)
        .send(createDto)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('MANAGER cannot create review cycles', async () => {
      const createDto = {
        name: '2025 Q4 Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-01').toISOString(),
          peerFeedback: new Date('2025-12-15').toISOString(),
          managerEval: new Date('2025-12-30').toISOString(),
          calibration: new Date('2026-01-15').toISOString(),
          feedbackDelivery: new Date('2026-01-30').toISOString(),
        },
      }

      await request(app.getHttpServer())
        .post('/performance-reviews/cycles')
        .set('Authorization', managerToken)
        .send(createDto)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('Regular user cannot create review cycles', async () => {
      const createDto = {
        name: '2026 Q1 Review',
        year: 2026,
        deadlines: {
          selfReview: new Date('2026-03-01').toISOString(),
          peerFeedback: new Date('2026-03-15').toISOString(),
          managerEval: new Date('2026-03-30').toISOString(),
          calibration: new Date('2026-04-15').toISOString(),
          feedbackDelivery: new Date('2026-04-30').toISOString(),
        },
      }

      await request(app.getHttpServer())
        .post('/performance-reviews/cycles')
        .set('Authorization', employeeToken)
        .send(createDto)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('HR_ADMIN can start review cycles', async () => {
      const cycle = await prisma.reviewCycle.create({
        data: {
          name: '2025 Test Review',
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
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.OK)

      await prisma.reviewCycle.delete({ where: { id: cycle.id } })
    })

    it('Regular user cannot start review cycles', async () => {
      const cycle = await prisma.reviewCycle.create({
        data: {
          name: '2025 Test Review 2',
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
        .set('Authorization', employeeToken)
        .expect(HttpStatus.FORBIDDEN)

      await prisma.reviewCycle.delete({ where: { id: cycle.id } })
    })
  })

  describe('Self-Review Authorization', () => {
    beforeEach(async () => {
      await prisma.selfReview.deleteMany({})
    })

    it('User can access their own self-review', async () => {
      await prisma.selfReview.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 3,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          narrative: 'My self-review.',
          status: 'DRAFT',
        },
      })

      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.OK)
    })

    it('User cannot access another user self-review', async () => {
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

      // Employee tries to access other employee's self-review
      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.NOT_FOUND)
    })

    it('User can update their own self-review', async () => {
      await request(app.getHttpServer())
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
          narrative: 'Updated narrative.',
        })
        .expect(HttpStatus.OK)
    })

    it('User can submit their own self-review', async () => {
      await prisma.selfReview.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 3,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          narrative: 'Complete self-review.',
          status: 'DRAFT',
        },
      })

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/self-review/submit`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.OK)
    })
  })

  describe('Manager Evaluation Authorization', () => {
    beforeEach(async () => {
      await prisma.managerEvaluation.deleteMany({})
    })

    it('Manager can access evaluations for their direct reports', async () => {
      await prisma.managerEvaluation.create({
        data: {
          cycleId: activeCycle.id,
          employeeId: employee.id,
          managerId: manager.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 3,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          narrative: 'Manager evaluation.',
          strengths: 'Strong skills.',
          growthAreas: 'Improve communication.',
          developmentPlan: 'Focus on soft skills.',
          status: 'DRAFT',
        },
      })

      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/evaluations/${employee.id}`)
        .set('Authorization', managerToken)
        .expect(HttpStatus.OK)
    })

    it('Manager cannot access evaluations for non-direct reports', async () => {
      const otherManager = await createTestUser(prisma, {
        email: 'other-manager@example.com',
        name: 'Other Manager',
        roles: ['user', 'MANAGER'],
        department: 'Product',
      })
      const otherManagerToken = await authenticateTestUser(app, otherManager)

      // Other manager tries to access employee's evaluation
      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/evaluations/${employee.id}`)
        .set('Authorization', otherManagerToken)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('Regular employee cannot access manager evaluations', async () => {
      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/evaluations/${employee.id}`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.FORBIDDEN)
    })
  })

  describe('Calibration Authorization', () => {
    beforeEach(async () => {
      await prisma.calibrationSession.deleteMany({})
      await prisma.finalScore.deleteMany({})
    })

    it('CALIBRATOR can access calibration dashboard', async () => {
      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/calibration`)
        .set('Authorization', calibratorToken)
        .expect(HttpStatus.OK)
    })

    it('HR_ADMIN can access calibration dashboard', async () => {
      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/calibration`)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.OK)
    })

    it('MANAGER cannot access calibration dashboard', async () => {
      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/calibration`)
        .set('Authorization', managerToken)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('Regular employee cannot access calibration dashboard', async () => {
      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/calibration`)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('CALIBRATOR can create calibration sessions', async () => {
      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/sessions`)
        .set('Authorization', calibratorToken)
        .send({
          name: 'Engineering Calibration',
          facilitatorId: calibrator.id,
          participantIds: [manager.id],
          scheduledAt: new Date().toISOString(),
        })
        .expect(HttpStatus.CREATED)
    })

    it('HR_ADMIN can create calibration sessions', async () => {
      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/sessions`)
        .set('Authorization', hrAdminToken)
        .send({
          name: 'HR Calibration',
          facilitatorId: hrAdmin.id,
          participantIds: [manager.id],
          scheduledAt: new Date().toISOString(),
        })
        .expect(HttpStatus.CREATED)
    })

    it('MANAGER cannot create calibration sessions', async () => {
      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/sessions`)
        .set('Authorization', managerToken)
        .send({
          name: 'Manager Calibration',
          facilitatorId: manager.id,
          participantIds: [manager.id],
          scheduledAt: new Date().toISOString(),
        })
        .expect(HttpStatus.FORBIDDEN)
    })

    it('HR_ADMIN can lock final scores', async () => {
      await prisma.finalScore.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 3,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          weightedScore: 3.0,
          percentageScore: 75.0,
          bonusTier: 'MEETS',
          finalLevel: 'MID',
          locked: false,
        },
      })

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/lock`)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.OK)
    })

    it('CALIBRATOR cannot lock final scores', async () => {
      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/lock`)
        .set('Authorization', calibratorToken)
        .expect(HttpStatus.FORBIDDEN)
    })
  })

  describe('Authentication Requirements', () => {
    it('Unauthenticated requests are rejected', async () => {
      await request(app.getHttpServer())
        .get('/performance-reviews/cycles/active')
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .post('/performance-reviews/cycles')
        .send({
          name: 'Test Cycle',
          year: 2025,
          deadlines: {
            selfReview: new Date().toISOString(),
            peerFeedback: new Date().toISOString(),
            managerEval: new Date().toISOString(),
            calibration: new Date().toISOString(),
            feedbackDelivery: new Date().toISOString(),
          },
        })
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/self-review`)
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/calibration`)
        .expect(HttpStatus.UNAUTHORIZED)
    })

    it('Invalid token is rejected', async () => {
      await request(app.getHttpServer())
        .get('/performance-reviews/cycles/active')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED)
    })
  })

  describe('Role-Based Access Control', () => {
    it('Enforces role hierarchy for admin operations', async () => {
      const endpoint = {
        path: '/performance-reviews/cycles',
        body: {
          name: 'Test',
          year: 2025,
          deadlines: {
            selfReview: new Date().toISOString(),
            peerFeedback: new Date().toISOString(),
            managerEval: new Date().toISOString(),
            calibration: new Date().toISOString(),
            feedbackDelivery: new Date().toISOString(),
          },
        },
      }

      // HR Admin should succeed
      await request(app.getHttpServer())
        .post(endpoint.path)
        .set('Authorization', hrAdminToken)
        .send(endpoint.body)
        .expect(HttpStatus.CREATED)

      // Regular user should be forbidden
      await request(app.getHttpServer())
        .post(endpoint.path)
        .set('Authorization', employeeToken)
        .send(endpoint.body)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('Enforces role requirements for calibration operations', async () => {
      const path = `/performance-reviews/cycles/${activeCycle.id}/calibration`

      // Calibrator should succeed
      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', calibratorToken)
        .expect(HttpStatus.OK)

      // HR Admin should succeed
      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.OK)

      // Regular user should be forbidden
      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', employeeToken)
        .expect(HttpStatus.FORBIDDEN)

      // Manager should be forbidden
      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', managerToken)
        .expect(HttpStatus.FORBIDDEN)
    })
  })
})
