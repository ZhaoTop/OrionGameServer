import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class ValidationUtils {
  public static async validateDto<T extends object>(
    dtoClass: new () => T,
    data: unknown
  ): Promise<T> {
    const dto = plainToClass(dtoClass, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = this.formatValidationErrors(errors);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }

    return dto;
  }

  private static formatValidationErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }

      if (error.children && error.children.length > 0) {
        messages.push(...this.formatValidationErrors(error.children));
      }
    }

    return messages;
  }

  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public static isValidUsername(username: string): boolean {
    // Username should be 3-20 characters, alphanumeric and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  public static isValidPassword(password: string): boolean {
    // Password should be at least 8 characters with at least one number and one letter
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  public static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, 1000); // Limit length
  }

  public static isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}