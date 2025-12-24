import type { Session as PrismaSession } from '@prisma/client'
import { Session } from '../../domain/entities/session.entity'
import { UserId } from '../../domain/value-objects/user-id.vo'

/**
 * SessionMapper
 *
 * Maps between Prisma ORM entities and Domain entities for Session
 */
export class SessionMapper {
  /**
   * Convert Prisma Session to Domain Session
   */
  static toDomain(prismaSession: PrismaSession): Session {
    const userId = UserId.fromString(prismaSession.userId)

    return Session.create({
      id: prismaSession.id,
      userId,
      deviceId: prismaSession.deviceId,
      userAgent: prismaSession.userAgent,
      ipAddress: prismaSession.ipAddress,
      expiresAt: prismaSession.expiresAt,
      createdAt: prismaSession.createdAt,
      lastUsed: prismaSession.lastUsed,
    })
  }

  /**
   * Convert Domain Session to Prisma Session format
   */
  static toOrm(domainSession: Session): PrismaSession {
    return {
      id: domainSession.id,
      userId: domainSession.userId.value,
      deviceId: domainSession.deviceId,
      userAgent: domainSession.userAgent,
      ipAddress: domainSession.ipAddress,
      expiresAt: domainSession.expiresAt,
      createdAt: domainSession.createdAt,
      lastUsed: domainSession.lastUsed,
    }
  }

  /**
   * Convert Domain Session to Prisma data for create/update operations
   */
  static toOrmData(domainSession: Session): Omit<PrismaSession, 'id'> {
    return {
      userId: domainSession.userId.value,
      deviceId: domainSession.deviceId,
      userAgent: domainSession.userAgent,
      ipAddress: domainSession.ipAddress,
      expiresAt: domainSession.expiresAt,
      createdAt: domainSession.createdAt,
      lastUsed: domainSession.lastUsed,
    }
  }
}
