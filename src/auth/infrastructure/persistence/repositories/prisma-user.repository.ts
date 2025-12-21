import { Injectable } from '@nestjs/common'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { User } from '../../../domain/entities/user.entity'
import { Email } from '../../../domain/value-objects/email.vo'
import { UserId } from '../../../domain/value-objects/user-id.vo'
import { Role } from '../../../domain/value-objects/role.vo'
import { PrismaService } from '../prisma/prisma.service'
import { UserMapper } from '../../mappers/user.mapper'

/**
 * PrismaUserRepository
 *
 * Implementation of IUserRepository using Prisma ORM
 * Handles all user persistence operations with PostgreSQL
 */
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user by unique identifier
   * Automatically filters out soft-deleted users
   */
  async findById(id: UserId): Promise<User | null> {
    const prismaUser = await this.prisma.user.findFirst({
      where: {
        id: id.value,
        deletedAt: null,
      },
    })

    return prismaUser ? UserMapper.toDomain(prismaUser) : null
  }

  /**
   * Find user by email address
   * Automatically filters out soft-deleted users
   */
  async findByEmail(email: Email): Promise<User | null> {
    const prismaUser = await this.prisma.user.findFirst({
      where: {
        email: email.value,
        deletedAt: null,
      },
    })

    return prismaUser ? UserMapper.toDomain(prismaUser) : null
  }

  /**
   * Find user by Keycloak ID
   * Automatically filters out soft-deleted users
   */
  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findFirst({
      where: {
        keycloakId,
        deletedAt: null,
      },
    })

    return prismaUser ? UserMapper.toDomain(prismaUser) : null
  }

  /**
   * Save user (create or update)
   * Uses upsert pattern based on user ID
   */
  async save(user: User): Promise<User> {
    const ormData = UserMapper.toOrmData(user)

    const savedUser = await this.prisma.user.upsert({
      where: { id: user.id.value },
      create: {
        id: user.id.value,
        ...ormData,
      },
      update: ormData,
    })

    return UserMapper.toDomain(savedUser)
  }

  /**
   * Soft delete user
   * Sets deletedAt timestamp instead of removing from database
   */
  async delete(id: UserId): Promise<void> {
    await this.prisma.user.update({
      where: { id: id.value },
      data: { deletedAt: new Date() },
    })
  }

  /**
   * Check if user with email exists
   * Excludes soft-deleted users
   */
  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email: email.value,
        deletedAt: null,
      },
    })

    return count > 0
  }

  /**
   * Find all users with a specific role
   * Excludes soft-deleted users
   */
  async findByRole(role: Role): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany({
      where: {
        roles: {
          has: role.value,
        },
        deletedAt: null,
      },
    })

    return prismaUsers.map((prismaUser) => UserMapper.toDomain(prismaUser))
  }

  /**
   * Find all users managed by a specific manager
   * Excludes soft-deleted users
   */
  async findByManagerId(managerId: string): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany({
      where: {
        managerId,
        deletedAt: null,
      },
    })

    return prismaUsers.map((prismaUser) => UserMapper.toDomain(prismaUser))
  }
}
