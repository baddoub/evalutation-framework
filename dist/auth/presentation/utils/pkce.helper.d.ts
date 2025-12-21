export declare class PkceHelper {
    static generateCodeVerifier(): string;
    static generateCodeChallenge(verifier: string): string;
    static generateState(): string;
    private static base64URLEncode;
}
