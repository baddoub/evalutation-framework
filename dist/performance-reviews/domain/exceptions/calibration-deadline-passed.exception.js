"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalibrationDeadlinePassedException = void 0;
class CalibrationDeadlinePassedException extends Error {
    constructor(message = 'Calibration deadline has passed') {
        super(message);
        this.name = 'CalibrationDeadlinePassedException';
    }
}
exports.CalibrationDeadlinePassedException = CalibrationDeadlinePassedException;
//# sourceMappingURL=calibration-deadline-passed.exception.js.map