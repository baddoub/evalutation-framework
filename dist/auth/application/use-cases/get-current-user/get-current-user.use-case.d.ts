import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { GetCurrentUserInput } from './get-current-user.input';
import { GetCurrentUserOutput } from './get-current-user.output';
export declare class GetCurrentUserUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput>;
}
