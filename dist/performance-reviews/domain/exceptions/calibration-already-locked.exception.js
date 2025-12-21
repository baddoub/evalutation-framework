"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalibrationAlreadyLockedException = void 0;
class CalibrationAlreadyLockedException extends Error {
    constructor(message = 'Calibration session is already locked') {
        super(message);
        this.name = 'CalibrationAlreadyLockedException';
    }
}
exports.CalibrationAlreadyLockedException = CalibrationAlreadyLockedException;
//# sourceMappingURL=calibration-already-locked.exception.js.map