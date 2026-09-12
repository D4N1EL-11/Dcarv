import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/hash';
import { create } from '@/lib/json-db';
import { userCreateSchema } from '@data/_schema/user.schema';
import type { UserRecord } from '@data/_schema/user.schema';

export async function POST(request: Request) {
	const parsed = userCreateSchema.safeParse(await request.json());
	if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 });
	const { password, ...input } = parsed.data;
	const user = await create<UserRecord>('user', { ...input, passwordHash: await hashPassword(password), role: 'viewer' }, 'usr');
	return NextResponse.json({ success: true, data: { id: user.id, email: user.email, role: user.role } }, { status: 201 });
}