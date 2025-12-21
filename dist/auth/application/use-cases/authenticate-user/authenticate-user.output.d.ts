import { UserDto } from '../../dto/user.dto';
export declare class AuthenticateUserOutput {
    readonly user: UserDto;
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly expiresIn: number;
    constructor(user: UserDto, accessToken: string, refreshToken: string, expiresIn: number);
}
