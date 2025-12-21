import { RegisterUserInput } from './register-user.input';
import { RegisterUserOutput } from './register-user.output';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ITokenService } from '../../ports/token-service.interface';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
export declare class RegisterUserUseCase {
    private readonly userRepository;
    private readonly tokenService;
    private readonly refreshTokenRepository;
    constructor(userRepository: IUserRepository, tokenService: ITokenService, refreshTokenRepository: IRefreshTokenRepository);
    execute(input: RegisterUserInput): Promise<RegisterUserOutput>;
}
