export declare class Narrative {
    private static readonly MAX_WORDS;
    private readonly _text;
    private readonly _wordCount;
    private constructor();
    static fromText(text: string): Narrative;
    static create(text: string): Narrative;
    private calculateWordCount;
    get text(): string;
    get wordCount(): number;
    equals(other: Narrative): boolean;
    toString(): string;
}
