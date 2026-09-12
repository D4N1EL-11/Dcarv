import { cookies } from 'next/headers';
import { verifyToken, type SessionPayload } from './jwt';
export async function getSession(): Promise<SessionPayload | null> { const token = (await cookies()).get('dcarv_session')?.value; if (!token) return null; try { return await verifyToken(token); } catch { return null; } }