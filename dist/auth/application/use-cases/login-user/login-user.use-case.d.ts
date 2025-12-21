import { LoginUserInput } from './login-user.input';
import { LoginUserOutput } from './login-user.output';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ITokenService } from '../../ports/token-service.interface';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
export declare class LoginUserUseCase {
    private readonly userRepository;
    private readonly tokenService;
    private readonly refreshTokenRepository;
    constructor(userRepository: IUserRepository, tokenService: ITokenService, refreshTokenRepository: IRefreshTokenRepository);
    execute(input: LoginUserInput): Promise<LoginUserOutput>;
}
