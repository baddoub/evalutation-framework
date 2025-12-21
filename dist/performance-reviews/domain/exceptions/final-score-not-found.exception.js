"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalScoreNotFoundException = void 0;
class FinalScoreNotFoundException extends Error {
    constructor(message = 'Final score not found') {
        super(message);
        this.name = 'FinalScoreNotFoundException';
    }
}
exports.FinalScoreNotFoundException = FinalScoreNotFoundException;
//# sourceMappingURL=final-score-not-found.exception.js.map