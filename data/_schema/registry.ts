import type { ZodType } from 'zod';
import { exampleCreateSchema, exampleRecordSchema } from './example.schema';
import { noteCreateSchema, noteSchema } from './note.schema';
import { userSchema } from './user.schema';

export const schemaRegistry: Record<string, ZodType> = { example: exampleRecordSchema, note: noteSchema, user: userSchema };
export const createSchemaRegistry: Record<string, ZodType> = { example: exampleCreateSchema, note: noteCreateSchema };
export const updateSchemaRegistry: Record<string, ZodType> = {
  example: exampleRecordSchema.partial(),
  note: noteSchema.partial(),
  user: userSchema.partial(),
};

export function getSchema(collection: string): ZodType | null {
  return schemaRegistry[collection] ?? null;
}