import { Inject, Injectable } from '@nestjs/common'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { GetCurrentUserInput } from './get-current-user.input'
import { GetCurrentUserOutput } from './get-current-user.output'
import { UserDto } from '../../dto/user.dto'
import { UserNotFoundException } from '../../exceptions/user-not-found.exception'
import { UserDeactivatedException } from '../../exceptions/user-deactivated.exception'

/**
 * GetCurrentUserUseCase
 *
 * Retrieves current user information:
 * 1. Find user by ID
 * 2. Check if user exists
 * 3. Check if user is active
 * 4. Return user DTO
 */
@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput> {
    // Step 1: Find user by ID
    const user = await this.userRepository.findById(input.userId)

    // Step 2: Check if user exists
    if (!user) {
      throw new UserNotFoundException(`User with ID ${input.userId.value} not found`)
    }

    // Step 3: Check if user is active
    if (!user.isActive) {
      throw new UserDeactivatedException('User account is deactivated. Please contact support.')
    }

    // Step 4: Return user DTO
    return new GetCurrentUserOutput(UserDto.fromDomain(user))
  }
}
