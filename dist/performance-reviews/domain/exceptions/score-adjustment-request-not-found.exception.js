"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreAdjustmentRequestNotFoundException = void 0;
class ScoreAdjustmentRequestNotFoundException extends Error {
    constructor(message = 'Score adjustment request not found') {
        super(message);
        this.name = 'ScoreAdjustmentRequestNotFoundException';
    }
}
exports.ScoreAdjustmentRequestNotFoundException = ScoreAdjustmentRequestNotFoundException;
//# sourceMappingURL=score-adjustment-request-not-found.exception.js.map