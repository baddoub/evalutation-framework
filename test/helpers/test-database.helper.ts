import type { PrismaClient } from '@prisma/client'

/**
 * Helper class for managing test database operations
 */
export class TestDatabaseHelper {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Clean all tables in the database
   */
  async cleanDatabase(): Promise<void> {
    const tables = ['RefreshToken', 'Session', 'User']

    for (const table of tables) {
      try {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
      } catch (error) {
        console.warn(`Failed to truncate table ${table}:`, error)
      }
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }

  /**
   * Seed test data
   */
  async seed(): Promise<void> {
    // Implement seeding logic as needed
  }
}
