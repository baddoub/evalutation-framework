import { User as PrismaUser } from '@prisma/client'
import { User } from '../../domain/entities/user.entity'
import { Email } from '../../domain/value-objects/email.vo'
import { UserId } from '../../domain/value-objects/user-id.vo'
import { Role } from '../../domain/value-objects/role.vo'

/**
 * UserMapper
 *
 * Maps between Prisma ORM entities and Domain entities
 * Handles conversion of value objects and maintains clean architecture boundaries
 */
export class UserMapper {
  /**
   * Convert Prisma User to Domain User
   */
  static toDomain(prismaUser: PrismaUser): User {
    const userId = UserId.fromString(prismaUser.id)
    const email = Email.create(prismaUser.email)
    const roles = prismaUser.roles.map((roleString) => Role.create(roleString))

    return User.create({
      id: userId,
      email,
      name: prismaUser.name,
      keycloakId: prismaUser.keycloakId,
      roles,
      isActive: prismaUser.isActive,
      level: prismaUser.level,
      department: prismaUser.department,
      jobTitle: prismaUser.jobTitle,
      managerId: prismaUser.managerId,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: prismaUser.deletedAt ?? undefined,
    })
  }

  /**
   * Convert Domain User to Prisma User format
   */
  static toOrm(domainUser: User): PrismaUser {
    return {
      id: domainUser.id.value,
      email: domainUser.email.value,
      name: domainUser.name,
      keycloakId: domainUser.keycloakId,
      roles: domainUser.roles.map((role) => role.value),
      isActive: domainUser.isActive,
      level: domainUser.level ?? null,
      department: domainUser.department ?? null,
      jobTitle: domainUser.jobTitle ?? null,
      managerId: domainUser.managerId ?? null,
      createdAt: domainUser.createdAt,
      updatedAt: domainUser.updatedAt,
      deletedAt: domainUser.deletedAt ?? null,
    }
  }

  /**
   * Convert Domain User to Prisma User data for create/update operations
   * Excludes id since it's auto-generated or already exists
   */
  static toOrmData(domainUser: User): Omit<PrismaUser, 'id'> {
    return {
      email: domainUser.email.value,
      name: domainUser.name,
      keycloakId: domainUser.keycloakId,
      roles: domainUser.roles.map((role) => role.value),
      isActive: domainUser.isActive,
      level: domainUser.level ?? null,
      department: domainUser.department ?? null,
      jobTitle: domainUser.jobTitle ?? null,
      managerId: domainUser.managerId ?? null,
      createdAt: domainUser.createdAt,
      updatedAt: domainUser.updatedAt,
      deletedAt: domainUser.deletedAt ?? null,
    }
  }
}
