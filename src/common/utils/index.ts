export * from './crypto';
export * from './validators';

export class TimeUtils {
  public static now(): Date {
    return new Date();
  }

  public static addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  }

  public static addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  public static isExpired(expirationDate: Date): boolean {
    return expirationDate < this.now();
  }
}

export class StringUtils {
  public static generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  public static truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  public static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}

export class ObjectUtils {
  public static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  public static pick<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  public static omit<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }
}