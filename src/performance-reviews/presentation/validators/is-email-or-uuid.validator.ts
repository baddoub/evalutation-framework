import type { ValidationOptions, ValidationArguments } from 'class-validator'
import { registerDecorator } from 'class-validator'
import { validate as isValidUUID } from 'uuid'

/**
 * Check if a string is a valid email format
 */
function isEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

/**
 * Custom validator that accepts either email or UUID format
 */
export function IsEmailOrUUID(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEmailOrUUID',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false
          return isValidUUID(value) || isEmail(value)
        },
        defaultMessage(args: ValidationArguments) {
          return `each value in ${args.property} must be a valid UUID or email address`
        },
      },
    })
  }
}
