"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Narrative = void 0;
const narrative_exceeds_word_limit_exception_1 = require("../exceptions/narrative-exceeds-word-limit.exception");
class Narrative {
    constructor(text) {
        this._text = text.trim();
        this._wordCount = this.calculateWordCount(this._text);
        if (this._wordCount > Narrative.MAX_WORDS) {
            throw new narrative_exceeds_word_limit_exception_1.NarrativeExceedsWordLimitException(this._wordCount);
        }
    }
    static fromText(text) {
        if (!text || typeof text !== 'string') {
            return new Narrative('');
        }
        return new Narrative(text);
    }
    static create(text) {
        return this.fromText(text);
    }
    calculateWordCount(text) {
        if (!text || text.length === 0) {
            return 0;
        }
        return text.split(/\s+/).filter((word) => word.length > 0).length;
    }
    get text() {
        return this._text;
    }
    get wordCount() {
        return this._wordCount;
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this._text === other._text;
    }
    toString() {
        return this._text;
    }
}
exports.Narrative = Narrative;
Narrative.MAX_WORDS = 1000;
//# sourceMappingURL=narrative.vo.js.map