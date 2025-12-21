import { RefreshToken as PrismaRefreshToken } from '@prisma/client'
import { RefreshToken } from '../../domain/entities/refresh-token.entity'
import { UserId } from '../../domain/value-objects/user-id.vo'

/**
 * RefreshTokenMapper
 *
 * Maps between Prisma ORM entities and Domain entities for RefreshToken
 */
export class RefreshTokenMapper {
  /**
   * Convert Prisma RefreshToken to Domain RefreshToken
   */
  static toDomain(prismaToken: PrismaRefreshToken): RefreshToken {
    const userId = UserId.fromString(prismaToken.userId)

    return RefreshToken.create({
      id: prismaToken.id,
      userId,
      tokenHash: prismaToken.tokenHash,
      used: prismaToken.used,
      expiresAt: prismaToken.expiresAt,
      createdAt: prismaToken.createdAt,
      revokedAt: prismaToken.revokedAt ?? undefined,
    })
  }

  /**
   * Convert Domain RefreshToken to Prisma RefreshToken format
   */
  static toOrm(domainToken: RefreshToken): PrismaRefreshToken {
    return {
      id: domainToken.id,
      userId: domainToken.userId.value,
      tokenHash: domainToken.tokenHash,
      used: domainToken.used,
      expiresAt: domainToken.expiresAt,
      createdAt: domainToken.createdAt,
      revokedAt: domainToken.revokedAt ?? null,
    }
  }

  /**
   * Convert Domain RefreshToken to Prisma data for create/update operations
   */
  static toOrmData(domainToken: RefreshToken): Omit<PrismaRefreshToken, 'id'> {
    return {
      userId: domainToken.userId.value,
      tokenHash: domainToken.tokenHash,
      used: domainToken.used,
      expiresAt: domainToken.expiresAt,
      createdAt: domainToken.createdAt,
      revokedAt: domainToken.revokedAt ?? null,
    }
  }
}
