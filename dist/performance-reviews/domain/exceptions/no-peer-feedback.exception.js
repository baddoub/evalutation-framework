"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoPeerFeedbackException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class NoPeerFeedbackException extends domain_exception_1.DomainException {
    constructor(message = 'No peer feedback available to aggregate', code = 'NO_PEER_FEEDBACK') {
        super(message, code);
        this.name = 'NoPeerFeedbackException';
    }
}
exports.NoPeerFeedbackException = NoPeerFeedbackException;
//# sourceMappingURL=no-peer-feedback.exception.js.map