"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineerLevel = void 0;
const invalid_engineer_level_exception_1 = require("../exceptions/invalid-engineer-level.exception");
class EngineerLevel {
    constructor(value) {
        this._value = value;
    }
    static fromString(level) {
        if (!level || typeof level !== 'string') {
            throw new invalid_engineer_level_exception_1.InvalidEngineerLevelException('Invalid engineer level: Level cannot be empty');
        }
        const trimmedLevel = level.trim().toUpperCase();
        if (!this.isValid(trimmedLevel)) {
            const validLevels = this.VALID_LEVELS.join(', ');
            throw new invalid_engineer_level_exception_1.InvalidEngineerLevelException(`Invalid engineer level: ${level}. Valid levels: ${validLevels}`);
        }
        return new EngineerLevel(trimmedLevel);
    }
    static create(level) {
        return this.fromString(level);
    }
    static isValid(level) {
        return this.VALID_LEVELS.includes(level);
    }
    get value() {
        return this._value;
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this._value === other._value;
    }
    isJunior() {
        return this._value === 'JUNIOR';
    }
    isMid() {
        return this._value === 'MID';
    }
    isSenior() {
        return this._value === 'SENIOR';
    }
    isLead() {
        return this._value === 'LEAD';
    }
    isManager() {
        return this._value === 'MANAGER';
    }
    toString() {
        return this._value;
    }
}
exports.EngineerLevel = EngineerLevel;
EngineerLevel.VALID_LEVELS = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER'];
EngineerLevel.JUNIOR = new EngineerLevel('JUNIOR');
EngineerLevel.MID = new EngineerLevel('MID');
EngineerLevel.SENIOR = new EngineerLevel('SENIOR');
EngineerLevel.LEAD = new EngineerLevel('LEAD');
EngineerLevel.MANAGER = new EngineerLevel('MANAGER');
//# sourceMappingURL=engineer-level.vo.js.map