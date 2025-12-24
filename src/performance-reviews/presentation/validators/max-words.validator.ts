import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ name: 'MaxWords', async: false })
export class MaxWordsConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments): boolean {
    const [maxWords] = args.constraints
    if (!text) {
      return true // Let @IsString() or @IsNotEmpty() handle empty strings
    }

    const wordCount = this.countWords(text)
    return wordCount <= maxWords
  }

  defaultMessage(args: ValidationArguments): string {
    const [maxWords] = args.constraints
    const text = args.value as string
    const wordCount = this.countWords(text)
    return `Narrative exceeds ${maxWords} word limit (current: ${wordCount} words)`
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }
}

export function MaxWords(maxWords: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [maxWords],
      validator: MaxWordsConstraint,
    })
  }
}
