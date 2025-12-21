"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxWords = MaxWords;
const class_validator_1 = require("class-validator");
function MaxWords(maxWords, validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'maxWords',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [maxWords],
            options: validationOptions,
            validator: {
                validate(value, args) {
                    if (typeof value !== 'string') {
                        return false;
                    }
                    const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
                    return wordCount <= args.constraints[0];
                },
                defaultMessage(args) {
                    return `${args.property} must not exceed ${args.constraints[0]} words`;
                },
            },
        });
    };
}
//# sourceMappingURL=max-words.validator.js.map