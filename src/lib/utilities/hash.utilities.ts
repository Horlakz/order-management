import * as argon2 from 'argon2';

export class HashUtils {
  public static async hash(text: string): Promise<string> {
    return await argon2.hash(text, {
      memoryCost: 2 ** 16,
      parallelism: 1,
      timeCost: 4,
    });
  }

  public static async compareHash(
    text: string,
    hash: string,
  ): Promise<boolean> {
    return await argon2.verify(hash, text);
  }
}
