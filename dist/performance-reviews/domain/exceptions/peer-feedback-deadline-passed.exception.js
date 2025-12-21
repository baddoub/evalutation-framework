"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerFeedbackDeadlinePassedException = void 0;
class PeerFeedbackDeadlinePassedException extends Error {
    constructor(message = 'Peer feedback deadline has passed') {
        super(message);
        this.name = 'PeerFeedbackDeadlinePassedException';
    }
}
exports.PeerFeedbackDeadlinePassedException = PeerFeedbackDeadlinePassedException;
//# sourceMappingURL=peer-feedback-deadline-passed.exception.js.map