import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../../src/auth/infrastructure/persistence/prisma/prisma.service'
import { AppModule } from '../../src/app.module'
import request from 'supertest'

export interface TestUser {
  id: string
  email: string
  name: string
  keycloakId: string
  roles: string[]
  level?: string
  department?: string
  managerId?: string
  token?: string
}

export interface TestReviewCycle {
  id: string
  name: string
  year: number
  status: string
}

/**
 * Creates a test NestJS application instance
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleFixture.createNestApplication()
  await app.init()

  return app
}

/**
 * Cleans up all test data from the database
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.finalScore.deleteMany({})
  await prisma.calibrationAdjustment.deleteMany({})
  await prisma.calibrationSession.deleteMany({})
  await prisma.scoreAdjustmentRequest.deleteMany({})
  await prisma.managerEvaluation.deleteMany({})
  await prisma.peerFeedback.deleteMany({})
  await prisma.peerNomination.deleteMany({})
  await prisma.selfReview.deleteMany({})
  await prisma.reviewCycle.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.refreshToken.deleteMany({})
  await prisma.user.deleteMany({})
}

/**
 * Creates a test user in the database
 */
export async function createTestUser(
  prisma: PrismaService,
  data: {
    email: string
    name: string
    roles?: string[]
    level?: string
    department?: string
    managerId?: string
  },
): Promise<TestUser> {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      keycloakId: `keycloak-${data.email}`,
      roles: data.roles || ['user'],
      isActive: true,
      level: data.level,
      department: data.department,
      managerId: data.managerId,
    },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    keycloakId: user.keycloakId,
    roles: user.roles,
    level: user.level || undefined,
    department: user.department || undefined,
    managerId: user.managerId || undefined,
  }
}

/**
 * Generates a JWT token for testing purposes
 */
export function generateTestToken(user: TestUser): string {
  // For testing, we'll use a simple JWT-like structure
  // In a real scenario, this would use proper JWT signing
  const payload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    keycloakId: user.keycloakId,
  }

  // This is a mock token - in real tests you'd need proper JWT signing
  // For now, we'll use the actual auth endpoint to get real tokens
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

/**
 * Authenticates a test user and returns a valid JWT token
 */
export async function authenticateTestUser(
  app: INestApplication,
  user: TestUser,
): Promise<string> {
  // For E2E tests, we'll bypass Keycloak and directly create a session
  // This is a simplified approach - adjust based on your actual auth implementation
  const prisma = app.get(PrismaService)

  // Create a refresh token for the user with unique hash
  const uniqueTokenHash = `test-token-hash-${user.id}-${Date.now()}-${Math.random()}`
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: uniqueTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  // Create a session
  await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  })

  // Return a mock JWT token for testing
  // In a real scenario, you'd use the JWT service to generate this
  return `Bearer mock-jwt-token-${user.id}`
}

/**
 * Creates a test review cycle
 */
export async function createTestReviewCycle(
  prisma: PrismaService,
  data: {
    name: string
    year: number
    status?: string
  },
): Promise<TestReviewCycle> {
  const now = new Date()
  const cycle = await prisma.reviewCycle.create({
    data: {
      name: data.name,
      year: data.year,
      status: data.status || 'DRAFT',
      selfReviewDeadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 days
      peerFeedbackDeadline: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // +45 days
      managerEvalDeadline: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // +60 days
      calibrationDeadline: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000), // +75 days
      feedbackDeliveryDeadline: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // +90 days
      startDate: data.status === 'ACTIVE' ? now : new Date(now.getTime() + 1000),
    },
  })

  return {
    id: cycle.id,
    name: cycle.name,
    year: cycle.year,
    status: cycle.status,
  }
}

/**
 * Creates a test self-review
 */
export async function createTestSelfReview(
  prisma: PrismaService,
  data: {
    cycleId: string
    userId: string
    status?: string
  },
): Promise<any> {
  return await prisma.selfReview.create({
    data: {
      cycleId: data.cycleId,
      userId: data.userId,
      projectImpactScore: 3,
      directionScore: 3,
      engineeringExcellenceScore: 3,
      operationalOwnershipScore: 3,
      peopleImpactScore: 3,
      narrative: 'Test narrative',
      status: data.status || 'DRAFT',
    },
  })
}

/**
 * Makes an authenticated request to the API
 */
export async function makeAuthRequest(
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  token: string,
  body?: any,
): Promise<request.Test> {
  const req = request(app.getHttpServer())[method](path).set('Authorization', token)

  if (body) {
    req.send(body)
  }

  return req
}
