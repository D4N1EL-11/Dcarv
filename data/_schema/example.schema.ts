import { z } from 'zod';
import { baseRecordSchema } from './base.schema';

export const exampleRecordSchema = baseRecordSchema.extend({
  name: z.string().min(1).max(255),
  active: z.boolean(),
});

export const exampleCreateSchema = exampleRecordSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type ExampleRecord = z.infer<typeof exampleRecordSchema>;