import { Injectable } from '@nestjs/common'
import { ISessionRepository } from '../../../domain/repositories/session.repository.interface'
import { Session } from '../../../domain/entities/session.entity'
import { UserId } from '../../../domain/value-objects/user-id.vo'
import { PrismaService } from '../prisma/prisma.service'
import { SessionMapper } from '../../mappers/session.mapper'

/**
 * PrismaSessionRepository
 *
 * Implementation of ISessionRepository using Prisma ORM
 * Handles all session persistence operations with PostgreSQL
 */
@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find session by unique identifier
   */
  async findById(id: string): Promise<Session | null> {
    const prismaSession = await this.prisma.session.findUnique({
      where: { id },
    })

    return prismaSession ? SessionMapper.toDomain(prismaSession) : null
  }

  /**
   * Find all sessions for a user
   * Used for session management and concurrent session tracking
   */
  async findByUserId(userId: UserId): Promise<Session[]> {
    const prismaSessions = await this.prisma.session.findMany({
      where: { userId: userId.value },
      orderBy: { lastUsed: 'desc' },
    })

    return prismaSessions.map((session) => SessionMapper.toDomain(session))
  }

  /**
   * Save session (create or update)
   * Uses upsert pattern based on session ID
   */
  async save(session: Session): Promise<Session> {
    const ormData = SessionMapper.toOrmData(session)

    const savedSession = await this.prisma.session.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        ...ormData,
      },
      update: ormData,
    })

    return SessionMapper.toDomain(savedSession)
  }

  /**
   * Find active (non-expired) sessions for a user
   */
  async findActiveByUserId(userId: UserId): Promise<Session[]> {
    const prismaSessions = await this.prisma.session.findMany({
      where: {
        userId: userId.value,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { lastUsed: 'desc' },
    })

    return prismaSessions.map((session) => SessionMapper.toDomain(session))
  }

  /**
   * Delete session
   * Permanently removes session from database
   */
  async delete(id: string): Promise<void> {
    await this.prisma.session.delete({
      where: { id },
    })
  }

  /**
   * Delete all sessions for a user
   * Used during logout
   */
  async deleteAllByUserId(userId: UserId): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId: userId.value },
    })
  }

  /**
   * Delete all expired sessions
   * Used for scheduled cleanup job
   */
  async deleteExpired(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
    return result.count
  }
}
