/**
 * Input DTO for LogoutUserUseCase
 *
 * Represents the data required to logout a user.
 */

import type { UserId } from '../../../domain/value-objects/user-id.vo'

export class LogoutUserInput {
  constructor(public readonly userId: UserId) {}
}
