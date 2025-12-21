import { ValidationOptions } from 'class-validator';
export declare function MaxWords(maxWords: number, validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
