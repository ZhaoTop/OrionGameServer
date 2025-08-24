import crypto from 'crypto';
import { authConfig } from '@/common/config';

export class CryptoUtils {
  private static readonly algorithm = 'aes-256-cbc';
  private static readonly secretKey = authConfig.aes.secretKey;
  private static readonly ivLength = authConfig.aes.ivLength;

  public static encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.secretKey);
      cipher.update(text, 'utf8');
      const encrypted = cipher.final('base64');
      return iv.toString('base64') + ':' + encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${(error as Error).message}`);
    }
  }

  public static decrypt(encryptedText: string): string {
    try {
      const [ivBase64, encrypted] = encryptedText.split(':');
      if (!ivBase64 || !encrypted) {
        throw new Error('Invalid encrypted text format');
      }

      const iv = Buffer.from(ivBase64, 'base64');
      const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
      decipher.update(encrypted, 'base64');
      const decrypted = decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
  }

  public static generateHash(data: string, salt?: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(data + (salt || ''));
    return hash.digest('hex');
  }

  public static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  public static validateHash(data: string, hash: string, salt?: string): boolean {
    const expectedHash = this.generateHash(data, salt);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  }
}