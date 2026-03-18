import { SignJWT, jwtVerify } from 'jose';
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return salt + ':' + derived.toString('hex');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const parts = hash.split(':');
  const salt = parts[0];
  const key = parts[1];
  if (!salt || !key) return false;
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const keyBuffer = Buffer.from(key, 'hex');
  return timingSafeEqual(derived, keyBuffer);
}

export async function generateToken(userId: number, email: string, role: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
  const token = await new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
  return token;
}

export async function verifyToken(token: string): Promise<{ userId: number; email: string; role: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch (error) {
    return null;
  }
}
