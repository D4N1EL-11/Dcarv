import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'development-only-secret-change-me');
export type SessionPayload = JWTPayload & { userId: string; role: 'admin' | 'editor' | 'viewer'; email: string };
export async function createToken(payload: Omit<SessionPayload, 'iat' | 'exp'>) { return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('24h').sign(secret); }
export async function verifyToken(token: string): Promise<SessionPayload> { const result = await jwtVerify<SessionPayload>(token, secret); return result.payload; }