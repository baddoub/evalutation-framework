export interface RegisterUserOutput {
    user: {
        id: string;
        email: string;
        name: string;
        roles: string[];
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
