import { z } from 'zod';
import { insertTriageSessionSchema, triageSessions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  triageSessions: {
    list: {
      method: 'GET' as const,
      path: '/api/triage-sessions' as const,
      responses: {
        200: z.array(z.custom<typeof triageSessions.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/triage-sessions/:id' as const,
      responses: {
        200: z.custom<typeof triageSessions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/triage-sessions' as const,
      input: insertTriageSessionSchema,
      responses: {
        201: z.custom<typeof triageSessions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/triage-sessions/:id' as const,
      input: insertTriageSessionSchema.partial(),
      responses: {
        200: z.custom<typeof triageSessions.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CreateTriageSessionInput = z.infer<typeof api.triageSessions.create.input>;
export type UpdateTriageSessionInput = z.infer<typeof api.triageSessions.update.input>;
export type TriageSessionResponse = z.infer<typeof api.triageSessions.create.responses[201]>;
export type TriageSessionsListResponse = z.infer<typeof api.triageSessions.list.responses[200]>;
