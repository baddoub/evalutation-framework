/**
 * Application Layer Data Transfer Object for User
 *
 * This DTO is used to transfer user data between application layer and other layers.
 * It does not contain business logic - only data structure and mapping utilities.
 */

import type { User } from '../../domain/entities/user.entity'

export class UserDto {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly keycloakId: string,
    public readonly roles: string[],
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Create UserDto from domain User entity
   */
  static fromDomain(user: User): UserDto {
    return new UserDto(
      user.id.value,
      user.email.value,
      user.name,
      user.keycloakId,
      user.roles.map((role) => role.value),
      user.isActive,
      user.createdAt,
      user.updatedAt,
    )
  }
}
