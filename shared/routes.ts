import { z } from 'zod';
import { insertUserSchema, insertAssetSchema, users, assets, assetAssignments } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>() }),
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  admin: {
    users: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/users' as const,
        responses: {
          200: z.array(z.custom<typeof users.$inferSelect>()),
          403: errorSchemas.forbidden,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/users' as const,
        input: insertUserSchema,
        responses: {
          201: z.custom<typeof users.$inferSelect>(),
          403: errorSchemas.forbidden,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/users/:id' as const,
        input: insertUserSchema.partial(),
        responses: {
          200: z.custom<typeof users.$inferSelect>(),
          403: errorSchemas.forbidden,
        },
      },
      deactivate: {
        method: 'PATCH' as const,
        path: '/api/admin/users/:id/deactivate' as const,
        responses: {
          200: z.custom<typeof users.$inferSelect>(),
          403: errorSchemas.forbidden,
        },
      },
    },
    assets: {
      create: {
        method: 'POST' as const,
        path: '/api/admin/assets' as const,
        input: insertAssetSchema,
        responses: {
          201: z.custom<typeof assets.$inferSelect>(),
          403: errorSchemas.forbidden,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/assets/:id' as const,
        input: insertAssetSchema.partial(),
        responses: {
          200: z.custom<typeof assets.$inferSelect>(),
          403: errorSchemas.forbidden,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/assets/:id' as const,
        responses: {
          204: z.void(),
          403: errorSchemas.forbidden,
        },
      },
    },
    assignments: {
      history: {
        method: 'GET' as const,
        path: '/api/admin/assignments' as const,
        responses: {
          200: z.array(
            z.custom<
              typeof assetAssignments.$inferSelect & {
                asset: typeof assets.$inferSelect;
                user: typeof users.$inferSelect;
              }
            >()
          ),
          403: errorSchemas.forbidden,
        },
      },
      assign: {
        method: 'POST' as const,
        path: '/api/admin/assignments' as const,
        input: z.object({ assetId: z.string(), userId: z.string() }),
        responses: {
          201: z.custom<typeof assetAssignments.$inferSelect>(),
          403: errorSchemas.forbidden,
        },
      },
      return: {
        method: 'POST' as const,
        path: '/api/admin/assignments/return' as const,
        input: z.object({ assetId: z.string() }),
        responses: {
          200: z.custom<typeof assetAssignments.$inferSelect>(),
          403: errorSchemas.forbidden,
        },
      },
    },
    dashboard: {
      stats: {
        method: 'GET' as const,
        path: '/api/admin/dashboard/stats' as const,
        responses: {
          200: z.object({
            totalAssets: z.number(),
            assignedAssets: z.number(),
            availableAssets: z.number(),
            maintenanceAssets: z.number(),
          }),
          403: errorSchemas.forbidden,
        },
      },
    },
    reports: {
      assets: {
        method: 'GET' as const,
        path: '/api/admin/reports/assets' as const,
        responses: { 200: z.string() },
      },
      assignments: {
        method: 'GET' as const,
        path: '/api/admin/reports/assignments' as const,
        responses: { 200: z.string() },
      },
    },
  },
  user: {
    assets: {
      list: {
        method: 'GET' as const,
        path: '/api/user/assets' as const,
        responses: {
          200: z.array(z.custom<typeof assetAssignments.$inferSelect & { asset: typeof assets.$inferSelect }>()),
        },
      },
      requestReturn: {
        method: 'POST' as const,
        path: '/api/user/assets/request-return' as const,
        input: z.object({ assetId: z.string() }),
        responses: {
          200: z.custom<typeof assetAssignments.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
    },
  },
  assets: {
    list: {
      method: 'GET' as const,
      path: '/api/assets' as const,
      responses: {
        200: z.array(z.custom<typeof assets.$inferSelect>()),
      },
    },
  },
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
