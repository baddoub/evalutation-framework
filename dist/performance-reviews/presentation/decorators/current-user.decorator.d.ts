export interface CurrentUserData {
    userId: string;
    email: string;
    name: string;
    role?: string;
    level?: string;
    department?: string;
    managerId?: string;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
