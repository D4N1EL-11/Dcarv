import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
export async function GET() { const session = await getSession(); return session ? NextResponse.json({ success: true, data: session }) : NextResponse.json({ success: false, error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 }); }