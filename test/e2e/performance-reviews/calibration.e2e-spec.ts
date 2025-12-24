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

describe('Calibration E2E', () => {
  let app: INestApplication
  let prisma: PrismaService
  let hrAdmin: TestUser
  let hrAdminToken: string
  let calibrator: TestUser
  let calibratorToken: string
  let manager: TestUser
  let managerToken: string
  let employee1: TestUser
  let employee2: TestUser
  let activeCycle: TestReviewCycle

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

    employee1 = await createTestUser(prisma, {
      email: 'employee1@example.com',
      name: 'Employee One',
      roles: ['user'],
      department: 'Engineering',
      level: 'MID',
      managerId: manager.id,
    })

    employee2 = await createTestUser(prisma, {
      email: 'employee2@example.com',
      name: 'Employee Two',
      roles: ['user'],
      department: 'Engineering',
      level: 'SENIOR',
      managerId: manager.id,
    })

    // Authenticate users
    hrAdminToken = await authenticateTestUser(app, hrAdmin)
    calibratorToken = await authenticateTestUser(app, calibrator)
    managerToken = await authenticateTestUser(app, manager)

    // Create an active review cycle in calibration phase
    activeCycle = await createTestReviewCycle(prisma, {
      name: '2025 Annual Review',
      year: 2025,
      status: 'CALIBRATION',
    })
  })

  afterAll(async () => {
    await cleanDatabase(prisma)
    await app.close()
  })

  afterEach(async () => {
    // Clean up calibration data after each test
    await prisma.calibrationAdjustment.deleteMany({})
    await prisma.calibrationSession.deleteMany({})
    await prisma.finalScore.deleteMany({})
    await prisma.managerEvaluation.deleteMany({})
  })

  describe('GET /performance-reviews/cycles/:cycleId/calibration', () => {
    beforeEach(async () => {
      // Create manager evaluations and final scores
      await prisma.managerEvaluation.create({
        data: {
          cycleId: activeCycle.id,
          employeeId: employee1.id,
          managerId: manager.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 4,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          narrative: 'Good performance.',
          strengths: 'Strong technical skills.',
          growthAreas: 'Improve communication.',
          developmentPlan: 'Focus on soft skills.',
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      })

      await prisma.finalScore.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee1.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 4,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          weightedScore: 3.2,
          percentageScore: 80.0,
          bonusTier: 'MEETS',
          finalLevel: 'MID',
        },
      })
    })

    it('should get calibration dashboard as Calibrator', async () => {
      const response = await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/calibration`)
        .set('Authorization', calibratorToken)
        .expect(HttpStatus.OK)

      expect(response.body.summary).toBeDefined()
      expect(response.body.summary.totalEvaluations).toBeGreaterThan(0)
      expect(response.body.summary.byBonusTier).toBeDefined()
      expect(response.body.evaluations).toBeInstanceOf(Array)
    })

    it('should get calibration dashboard as HR Admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/calibration`)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.OK)

      expect(response.body.summary).toBeDefined()
      expect(response.body.evaluations).toBeInstanceOf(Array)
    })

    it('should reject access by non-Calibrator/HR Admin', async () => {
      await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/calibration`)
        .set('Authorization', managerToken)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('should filter by department', async () => {
      const response = await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/calibration?department=Engineering`)
        .set('Authorization', calibratorToken)
        .expect(HttpStatus.OK)

      expect(response.body.evaluations).toBeInstanceOf(Array)
      if (response.body.evaluations.length > 0) {
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.department).toBe('Engineering')
        })
      }
    })

    it('should show distribution by bonus tier', async () => {
      const response = await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/calibration`)
        .set('Authorization', calibratorToken)
        .expect(HttpStatus.OK)

      expect(response.body.summary.byBonusTier).toBeDefined()
      expect(response.body.summary.byBonusTier).toHaveProperty('MEETS')
    })
  })

  describe('POST /performance-reviews/cycles/:cycleId/calibration/sessions', () => {
    it('should create calibration session as Calibrator', async () => {
      const sessionDto = {
        name: 'Engineering Org Calibration',
        department: 'Engineering',
        facilitatorId: calibrator.id,
        participantIds: [manager.id],
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      }

      const response = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/sessions`)
        .set('Authorization', calibratorToken)
        .send(sessionDto)
        .expect(HttpStatus.CREATED)

      expect(response.body.id).toBeDefined()
      expect(response.body.name).toBe(sessionDto.name)
      expect(response.body.status).toBe('SCHEDULED')

      // Verify in database
      const session = await prisma.calibrationSession.findUnique({
        where: { id: response.body.id },
      })
      expect(session).toBeDefined()
      expect(session?.facilitatorId).toBe(calibrator.id)
    })

    it('should create calibration session as HR Admin', async () => {
      const sessionDto = {
        name: 'Cross-functional Calibration',
        facilitatorId: hrAdmin.id,
        participantIds: [manager.id],
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }

      const response = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/sessions`)
        .set('Authorization', hrAdminToken)
        .send(sessionDto)
        .expect(HttpStatus.CREATED)

      expect(response.body.id).toBeDefined()
    })

    it('should reject creation by non-Calibrator/HR Admin', async () => {
      const sessionDto = {
        name: 'Engineering Org Calibration',
        facilitatorId: manager.id,
        participantIds: [manager.id],
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/sessions`)
        .set('Authorization', managerToken)
        .send(sessionDto)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('should validate required fields', async () => {
      const invalidDto = {
        name: 'Engineering Org Calibration',
        // Missing facilitatorId, participantIds, scheduledAt
      }

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/sessions`)
        .set('Authorization', calibratorToken)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('POST /performance-reviews/cycles/:cycleId/calibration/adjustments', () => {
    let calibrationSession: any
    let managerEvaluation: any

    beforeEach(async () => {
      // Create calibration session
      calibrationSession = await prisma.calibrationSession.create({
        data: {
          cycleId: activeCycle.id,
          name: 'Engineering Org Calibration',
          facilitatorId: calibrator.id,
          participantIds: [manager.id],
          scheduledAt: new Date(),
          status: 'IN_PROGRESS',
        },
      })

      // Create manager evaluation
      managerEvaluation = await prisma.managerEvaluation.create({
        data: {
          cycleId: activeCycle.id,
          employeeId: employee1.id,
          managerId: manager.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 3,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          narrative: 'Good performance.',
          strengths: 'Strong technical skills.',
          growthAreas: 'Improve communication.',
          developmentPlan: 'Focus on soft skills.',
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      })
    })

    it('should apply calibration adjustment as Calibrator', async () => {
      const adjustmentDto = {
        sessionId: calibrationSession.id,
        evaluationId: managerEvaluation.id,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Scores adjusted based on cross-team comparison.',
      }

      const response = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/adjustments`)
        .set('Authorization', calibratorToken)
        .send(adjustmentDto)
        .expect(HttpStatus.CREATED)

      expect(response.body.id).toBeDefined()
      expect(response.body.adjustedScores.projectImpact).toBe(4)

      // Verify in database
      const adjustment = await prisma.calibrationAdjustment.findFirst({
        where: {
          sessionId: calibrationSession.id,
          evaluationId: managerEvaluation.id,
        },
      })
      expect(adjustment).toBeDefined()
      expect(adjustment?.adjustedProjectImpact).toBe(4)
    })

    it('should validate score ranges (0-4)', async () => {
      const invalidDto = {
        sessionId: calibrationSession.id,
        evaluationId: managerEvaluation.id,
        adjustedScores: {
          projectImpact: 5, // Invalid
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Invalid adjustment.',
      }

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/adjustments`)
        .set('Authorization', calibratorToken)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('should require justification', async () => {
      const invalidDto = {
        sessionId: calibrationSession.id,
        evaluationId: managerEvaluation.id,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        // Missing justification
      }

      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/adjustments`)
        .set('Authorization', calibratorToken)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('POST /performance-reviews/cycles/:cycleId/calibration/lock', () => {
    beforeEach(async () => {
      // Create final scores
      await prisma.finalScore.create({
        data: {
          cycleId: activeCycle.id,
          userId: employee1.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 4,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          weightedScore: 3.2,
          percentageScore: 80.0,
          bonusTier: 'MEETS',
          finalLevel: 'MID',
          locked: false,
        },
      })
    })

    it('should lock final scores as HR Admin', async () => {
      const response = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/lock`)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.OK)

      expect(response.body.lockedCount).toBeGreaterThan(0)

      // Verify in database
      const finalScore = await prisma.finalScore.findFirst({
        where: {
          cycleId: activeCycle.id,
          userId: employee1.id,
        },
      })
      expect(finalScore?.locked).toBe(true)
      expect(finalScore?.lockedAt).toBeDefined()
    })

    it('should reject locking by Calibrator (only HR Admin)', async () => {
      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/lock`)
        .set('Authorization', calibratorToken)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('should prevent locking already locked scores', async () => {
      // Lock scores first time
      await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/lock`)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.OK)

      // Try to lock again
      const response = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/lock`)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.OK)

      expect(response.body.lockedCount).toBe(0) // No new locks
    })
  })

  describe('Complete Calibration Workflow', () => {
    it('should complete full calibration workflow', async () => {
      // Step 1: Create manager evaluations
      const evaluation1 = await prisma.managerEvaluation.create({
        data: {
          cycleId: activeCycle.id,
          employeeId: employee1.id,
          managerId: manager.id,
          projectImpactScore: 3,
          directionScore: 3,
          engineeringExcellenceScore: 3,
          operationalOwnershipScore: 3,
          peopleImpactScore: 3,
          narrative: 'Good performance.',
          strengths: 'Strong technical skills.',
          growthAreas: 'Improve communication.',
          developmentPlan: 'Focus on soft skills.',
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      })

      await prisma.managerEvaluation.create({
        data: {
          cycleId: activeCycle.id,
          employeeId: employee2.id,
          managerId: manager.id,
          projectImpactScore: 4,
          directionScore: 4,
          engineeringExcellenceScore: 4,
          operationalOwnershipScore: 4,
          peopleImpactScore: 4,
          narrative: 'Excellent performance.',
          strengths: 'Leadership and technical excellence.',
          growthAreas: 'Continue growth trajectory.',
          developmentPlan: 'Prepare for next level.',
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      })

      // Create final scores
      await prisma.finalScore.createMany({
        data: [
          {
            cycleId: activeCycle.id,
            userId: employee1.id,
            projectImpactScore: 3,
            directionScore: 3,
            engineeringExcellenceScore: 3,
            operationalOwnershipScore: 3,
            peopleImpactScore: 3,
            weightedScore: 3.0,
            percentageScore: 75.0,
            bonusTier: 'MEETS',
            finalLevel: 'MID',
          },
          {
            cycleId: activeCycle.id,
            userId: employee2.id,
            projectImpactScore: 4,
            directionScore: 4,
            engineeringExcellenceScore: 4,
            operationalOwnershipScore: 4,
            peopleImpactScore: 4,
            weightedScore: 4.0,
            percentageScore: 100.0,
            bonusTier: 'EXCEEDS',
            finalLevel: 'SENIOR',
          },
        ],
      })

      // Step 2: View calibration dashboard
      const dashboardResponse = await request(app.getHttpServer())
        .get(`/performance-reviews/cycles/${activeCycle.id}/calibration`)
        .set('Authorization', calibratorToken)
        .expect(HttpStatus.OK)

      expect(dashboardResponse.body.summary.totalEvaluations).toBe(2)
      expect(dashboardResponse.body.evaluations).toHaveLength(2)

      // Step 3: Create calibration session
      const sessionResponse = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/sessions`)
        .set('Authorization', calibratorToken)
        .send({
          name: 'Engineering Org Calibration',
          department: 'Engineering',
          facilitatorId: calibrator.id,
          participantIds: [manager.id],
          scheduledAt: new Date().toISOString(),
        })
        .expect(HttpStatus.CREATED)

      const sessionId = sessionResponse.body.id

      // Step 4: Apply calibration adjustment
      const adjustmentResponse = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/adjustments`)
        .set('Authorization', calibratorToken)
        .send({
          sessionId,
          evaluationId: evaluation1.id,
          adjustedScores: {
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 3,
          },
          justification: 'Adjusted upward based on cross-team comparison.',
        })
        .expect(HttpStatus.CREATED)

      expect(adjustmentResponse.body.id).toBeDefined()

      // Step 5: Lock final scores
      const lockResponse = await request(app.getHttpServer())
        .post(`/performance-reviews/cycles/${activeCycle.id}/calibration/lock`)
        .set('Authorization', hrAdminToken)
        .expect(HttpStatus.OK)

      expect(lockResponse.body.lockedCount).toBe(2)

      // Step 6: Verify database state
      const finalScores = await prisma.finalScore.findMany({
        where: { cycleId: activeCycle.id },
      })
      expect(finalScores).toHaveLength(2)
      expect(finalScores.every((fs) => fs.locked)).toBe(true)

      const adjustment = await prisma.calibrationAdjustment.findFirst({
        where: { evaluationId: evaluation1.id },
      })
      expect(adjustment).toBeDefined()
      expect(adjustment?.adjustedProjectImpact).toBe(4)
    })
  })
})
