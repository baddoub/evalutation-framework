import { Injectable } from '@nestjs/common'
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import { RefreshToken } from '../../../domain/entities/refresh-token.entity'
import { UserId } from '../../../domain/value-objects/user-id.vo'
import { PrismaService } from '../prisma/prisma.service'
import { RefreshTokenMapper } from '../../mappers/refresh-token.mapper'

/**
 * PrismaRefreshTokenRepository
 *
 * Implementation of IRefreshTokenRepository using Prisma ORM
 * Handles all refresh token persistence operations with PostgreSQL
 */
@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find refresh token by unique identifier
   */
  async findById(id: string): Promise<RefreshToken | null> {
    const prismaToken = await this.prisma.refreshToken.findUnique({
      where: { id },
    })

    return prismaToken ? RefreshTokenMapper.toDomain(prismaToken) : null
  }

  /**
   * Find refresh token by hash
   * Used for token validation during refresh flow
   */
  async findByTokenHash(hash: string): Promise<RefreshToken | null> {
    const prismaToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
    })

    return prismaToken ? RefreshTokenMapper.toDomain(prismaToken) : null
  }

  /**
   * Find all refresh tokens for a user
   * Used for session management and token rotation
   */
  async findByUserId(userId: UserId): Promise<RefreshToken[]> {
    const prismaTokens = await this.prisma.refreshToken.findMany({
      where: { userId: userId.value },
      orderBy: { createdAt: 'desc' },
    })

    return prismaTokens.map((token) => RefreshTokenMapper.toDomain(token))
  }

  /**
   * Save refresh token (create or update)
   * Uses upsert pattern based on token ID
   */
  async save(token: RefreshToken): Promise<RefreshToken> {
    const ormData = RefreshTokenMapper.toOrmData(token)

    const savedToken = await this.prisma.refreshToken.upsert({
      where: { id: token.id },
      create: {
        id: token.id,
        ...ormData,
      },
      update: ormData,
    })

    return RefreshTokenMapper.toDomain(savedToken)
  }

  /**
   * Delete refresh token
   * Permanently removes token from database
   */
  async delete(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { id },
    })
  }

  /**
   * Delete all refresh tokens for a user
   * Used during logout or when token theft is detected
   */
  async deleteAllByUserId(userId: UserId): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId: userId.value },
    })
  }

  /**
   * Delete expired and revoked tokens (cleanup job)
   * Returns the number of tokens deleted
   */
  async deleteExpiredAndRevoked(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
      },
    })

    return result.count
  }
}
