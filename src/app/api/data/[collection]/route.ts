import { NextResponse } from 'next/server';
import { create, getAll, getById, remove, update, JsonDBError } from '@/lib/json-db';
import { createSchemaRegistry, getSchema } from '@data/_schema/registry';
import type { BaseRecord } from '@/lib/types';
import { getSession } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';

const success = <T>(data: T, status = 200) => NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
const failure = (error: unknown) => {
  const dbError = error instanceof JsonDBError ? error : new JsonDBError('Error interno.', 'IO_ERROR');
  return NextResponse.json({ success: false, error: dbError.message, code: dbError.code, timestamp: new Date().toISOString() }, { status: dbError.statusCode });
};

async function authorize(action: 'read' | 'create' | 'update' | 'delete') {
  const session = await getSession();
  if (!session) throw new JsonDBError('No autenticado.', 'VALIDATION_ERROR', 401);
  if (!can(session.role, action)) throw new JsonDBError('Acceso denegado.', 'VALIDATION_ERROR', 403);
}

type Context = { params: Promise<{ collection: string }> };

export async function GET(request: Request, context: Context) {
  try {
    await authorize('read');
    const { collection } = await context.params;
    if (!getSchema(collection)) return failure(new JsonDBError('Colección no registrada.', 'NOT_FOUND', 404));
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) return success(await getById(collection, id));
    return success(await getAll(collection, {
      limit: Number(url.searchParams.get('limit') ?? 50),
      offset: Number(url.searchParams.get('offset') ?? 0),
      sortBy: url.searchParams.get('sortBy') ?? undefined,
      sortOrder: url.searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc',
    }));
  } catch (error) { return failure(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    await authorize('create');
    const { collection } = await context.params;
    const schema = createSchemaRegistry[collection];
    if (!schema) return failure(new JsonDBError('Colección no registrada.', 'NOT_FOUND', 404));
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return failure(new JsonDBError(parsed.error.message, 'VALIDATION_ERROR', 400));
    return success(await create(collection, parsed.data as Omit<BaseRecord, 'id' | 'createdAt' | 'updatedAt'>), 201);
  } catch (error) { return failure(error); }
}

export async function PUT(request: Request, context: Context) {
  try {
    await authorize('update');
    const { collection } = await context.params;
    const schema = getSchema(collection);
    if (!schema) return failure(new JsonDBError('Colección no registrada.', 'NOT_FOUND', 404));
    const body = await request.json() as { id?: string; [key: string]: unknown };
    if (!body.id) return failure(new JsonDBError('El campo id es obligatorio.', 'VALIDATION_ERROR', 400));
    const parsed = schema.partial().safeParse(body);
    if (!parsed.success) return failure(new JsonDBError(parsed.error.message, 'VALIDATION_ERROR', 400));
    const { id, ...partial } = parsed.data as { id: string; [key: string]: unknown };
    return success(await update(collection, id, partial));
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    await authorize('delete');
    const { collection } = await context.params;
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return failure(new JsonDBError('El parámetro id es obligatorio.', 'VALIDATION_ERROR', 400));
    await remove(collection, id);
    return success({ removed: true });
  } catch (error) { return failure(error); }
}