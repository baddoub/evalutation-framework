/**
 * Input DTO for GetCurrentUserUseCase
 *
 * Represents the data required to get current user information.
 */

import type { UserId } from '../../../domain/value-objects/user-id.vo'

export class GetCurrentUserInput {
  constructor(public readonly userId: UserId) {}
}
