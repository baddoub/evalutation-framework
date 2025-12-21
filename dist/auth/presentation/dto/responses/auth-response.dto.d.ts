import { UserResponseDto } from './user-response.dto';
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: UserResponseDto;
}
