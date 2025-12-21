import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ============================================================================
  // USERS WITH ORGANIZATIONAL HIERARCHY
  // ============================================================================

  // Create Engineering Director (Top-level manager)
  const director = await prisma.user.upsert({
    where: { email: 'director@example.com' },
    update: {},
    create: {
      email: 'director@example.com',
      name: 'Jane Director',
      keycloakId: 'keycloak-director-123',
      roles: ['hr_admin', 'manager', 'user'],
      isActive: true,
      level: 'Manager',
      department: 'Engineering',
      jobTitle: 'Director of Engineering',
    },
  });
  console.log('Created director:', director.name);

  // Create Engineering Manager (reports to Director)
  const manager1 = await prisma.user.upsert({
    where: { email: 'manager1@example.com' },
    update: {},
    create: {
      email: 'manager1@example.com',
      name: 'John Manager',
      keycloakId: 'keycloak-manager1-123',
      roles: ['manager', 'user'],
      isActive: true,
      level: 'Manager',
      department: 'Engineering',
      jobTitle: 'Engineering Manager',
      managerId: director.id,
    },
  });
  console.log('Created manager 1:', manager1.name);

  // Create another Engineering Manager
  const manager2 = await prisma.user.upsert({
    where: { email: 'manager2@example.com' },
    update: {},
    create: {
      email: 'manager2@example.com',
      name: 'Sarah Manager',
      keycloakId: 'keycloak-manager2-123',
      roles: ['manager', 'calibrator', 'user'],
      isActive: true,
      level: 'Manager',
      department: 'Engineering',
      jobTitle: 'Engineering Manager',
      managerId: director.id,
    },
  });
  console.log('Created manager 2:', manager2.name);

  // Create Senior Engineers (reports to Manager 1)
  const senior1 = await prisma.user.upsert({
    where: { email: 'senior1@example.com' },
    update: {},
    create: {
      email: 'senior1@example.com',
      name: 'Alice Senior',
      keycloakId: 'keycloak-senior1-123',
      roles: ['user'],
      isActive: true,
      level: 'Senior',
      department: 'Engineering',
      jobTitle: 'Senior Software Engineer',
      managerId: manager1.id,
    },
  });
  console.log('Created senior 1:', senior1.name);

  const senior2 = await prisma.user.upsert({
    where: { email: 'senior2@example.com' },
    update: {},
    create: {
      email: 'senior2@example.com',
      name: 'Bob Senior',
      keycloakId: 'keycloak-senior2-123',
      roles: ['user'],
      isActive: true,
      level: 'Senior',
      department: 'Engineering',
      jobTitle: 'Senior Software Engineer',
      managerId: manager1.id,
    },
  });
  console.log('Created senior 2:', senior2.name);

  // Create Mid-level Engineers (reports to Manager 1)
  const mid1 = await prisma.user.upsert({
    where: { email: 'mid1@example.com' },
    update: {},
    create: {
      email: 'mid1@example.com',
      name: 'Charlie Mid',
      keycloakId: 'keycloak-mid1-123',
      roles: ['user'],
      isActive: true,
      level: 'Mid',
      department: 'Engineering',
      jobTitle: 'Software Engineer',
      managerId: manager1.id,
    },
  });
  console.log('Created mid 1:', mid1.name);

  const mid2 = await prisma.user.upsert({
    where: { email: 'mid2@example.com' },
    update: {},
    create: {
      email: 'mid2@example.com',
      name: 'Diana Mid',
      keycloakId: 'keycloak-mid2-123',
      roles: ['user'],
      isActive: true,
      level: 'Mid',
      department: 'Engineering',
      jobTitle: 'Software Engineer',
      managerId: manager2.id,
    },
  });
  console.log('Created mid 2:', mid2.name);

  // Create Junior Engineer
  const junior1 = await prisma.user.upsert({
    where: { email: 'junior1@example.com' },
    update: {},
    create: {
      email: 'junior1@example.com',
      name: 'Eve Junior',
      keycloakId: 'keycloak-junior1-123',
      roles: ['user'],
      isActive: true,
      level: 'Junior',
      department: 'Engineering',
      jobTitle: 'Junior Software Engineer',
      managerId: manager2.id,
    },
  });
  console.log('Created junior 1:', junior1.name);

  // ============================================================================
  // REVIEW CYCLE
  // ============================================================================

  const now = new Date();
  const reviewCycle = await prisma.reviewCycle.create({
    data: {
      name: '2025 Annual Review',
      year: 2025,
      status: 'ACTIVE',
      selfReviewDeadline: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      peerFeedbackDeadline: new Date(now.getFullYear(), now.getMonth() + 1, 30),
      managerEvalDeadline: new Date(now.getFullYear(), now.getMonth() + 2, 15),
      calibrationDeadline: new Date(now.getFullYear(), now.getMonth() + 2, 28),
      feedbackDeliveryDeadline: new Date(now.getFullYear(), now.getMonth() + 3, 10),
      startDate: now,
    },
  });
  console.log('Created review cycle:', reviewCycle.name);

  // ============================================================================
  // SELF REVIEWS
  // ============================================================================

  await prisma.selfReview.create({
    data: {
      cycleId: reviewCycle.id,
      userId: senior1.id,
      projectImpactScore: 3,
      directionScore: 3,
      engineeringExcellenceScore: 4,
      operationalOwnershipScore: 3,
      peopleImpactScore: 3,
      narrative:
        'This year I led the migration of our authentication system to a modern microservices architecture. I mentored two junior engineers and improved our code review process.',
      status: 'SUBMITTED',
      submittedAt: now,
    },
  });
  console.log('Created self review for:', senior1.name);

  await prisma.selfReview.create({
    data: {
      cycleId: reviewCycle.id,
      userId: mid1.id,
      projectImpactScore: 2,
      directionScore: 2,
      engineeringExcellenceScore: 3,
      operationalOwnershipScore: 3,
      peopleImpactScore: 2,
      narrative:
        'I contributed to several key features this year and improved my testing practices significantly.',
      status: 'DRAFT',
    },
  });
  console.log('Created self review for:', mid1.name);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
