import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { Rol } from './permisos';
import { secretoSesion } from './secreto';

export type SessionPayload = JWTPayload & { userId: string; role: Rol; email: string };

export async function createToken(payload: Omit<SessionPayload, 'iat' | 'exp'>) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('24h').sign(secretoSesion());
}

export async function verifyToken(token: string): Promise<SessionPayload> {
  const result = await jwtVerify<SessionPayload>(token, secretoSesion(), { algorithms: ['HS256'] });
  return result.payload;
}
