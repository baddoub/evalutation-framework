"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalibrationSessionNotFoundException = void 0;
class CalibrationSessionNotFoundException extends Error {
    constructor(message = 'Calibration session not found') {
        super(message);
        this.name = 'CalibrationSessionNotFoundException';
    }
}
exports.CalibrationSessionNotFoundException = CalibrationSessionNotFoundException;
//# sourceMappingURL=calibration-session-not-found.exception.js.map