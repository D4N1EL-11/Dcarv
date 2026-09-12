import { z } from 'zod';
import { baseRecordSchema } from './base.schema';
export const userSchema = baseRecordSchema.extend({ email: z.string().email(), passwordHash: z.string().min(20), role: z.enum(['admin', 'editor', 'viewer']) });
export const userCreateSchema = userSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({ password: z.string().min(8) });
export type UserRecord = z.infer<typeof userSchema>;