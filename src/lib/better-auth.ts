// @ts-nocheck
import { betterAuth } from 'better-auth';
import { createAdapterFactory as createAdapter } from 'better-auth/adapters';
import { jwt } from 'better-auth/plugins';
import { getSupabaseAdminClient } from '@/server/supabase/admin';

// Helper to apply Better-Auth where conditions to Supabase queries
function applyWhereFilters(query: any, where: any[]) {
  if (!where || where.length === 0) return query;

  for (const filter of where) {
    const operator = filter.operator || 'eq';
    switch (operator) {
      case 'eq':
        query = query.eq(filter.field, filter.value);
        break;
      case 'ne':
        query = query.neq(filter.field, filter.value);
        break;
      case 'in':
        query = query.in(filter.field, filter.value as any[]);
        break;
      case 'lt':
        query = query.lt(filter.field, filter.value);
        break;
      case 'lte':
        query = query.lte(filter.field, filter.value);
        break;
      case 'gt':
        query = query.gt(filter.field, filter.value);
        break;
      case 'gte':
        query = query.gte(filter.field, filter.value);
        break;
      case 'contains':
        query = query.ilike(filter.field, `%${filter.value}%`);
        break;
      case 'starts_with':
        query = query.ilike(filter.field, `${filter.value}%`);
        break;
      case 'ends_with':
        query = query.ilike(filter.field, `%${filter.value}`);
        break;
      default:
        query = query.eq(filter.field, filter.value);
    }
  }
  return query;
}

// Custom DB Adapter to route Better-Auth queries directly through Supabase Client
const supabaseAdapter = () => createAdapter({
  config: {
    adapterId: 'supabase-adapter',
    adapterName: 'Supabase Adapter',
  },
  adapter: () => {
    const supabase = getSupabaseAdminClient();

    return {
      create: async ({ data, model }) => {
        const { data: result, error } = await supabase
          .from(model)
          .insert(data)
          .select()
          .single();

        if (error) {
          console.error(`Better-Auth [create] error for ${model}:`, error);
          throw error;
        }
        return result;
      },

      findOne: async ({ model, where }) => {
        let query = supabase.from(model).select('*');
        query = applyWhereFilters(query, where);

        const { data, error } = await query.maybeSingle();
        if (error) {
          console.error(`Better-Auth [findOne] error for ${model}:`, error);
          throw error;
        }
        return data || null;
      },

      findMany: async ({ model, where, limit, offset, sortBy, sortDirection }) => {
        let query = supabase.from(model).select('*');
        query = applyWhereFilters(query, where);

        if (sortBy) {
          query = query.order(sortBy, { ascending: sortDirection === 'asc' });
        }
        if (limit !== undefined) {
          query = query.limit(limit);
        }
        if (offset !== undefined) {
          query = query.range(offset, offset + (limit || 10) - 1);
        }

        const { data, error } = await query;
        if (error) {
          console.error(`Better-Auth [findMany] error for ${model}:`, error);
          throw error;
        }
        return data || [];
      },

      update: async ({ model, where, data }) => {
        let query = supabase.from(model).update(data);
        query = applyWhereFilters(query, where);

        const { data: result, error } = await query.select().single();
        if (error) {
          console.error(`Better-Auth [update] error for ${model}:`, error);
          throw error;
        }
        return result;
      },

      delete: async ({ model, where }) => {
        let query = supabase.from(model).delete();
        query = applyWhereFilters(query, where);

        const { error } = await query;
        if (error) {
          console.error(`Better-Auth [delete] error for ${model}:`, error);
          throw error;
        }
      },

      deleteMany: async ({ model, where }) => {
        let query = supabase.from(model).delete();
        query = applyWhereFilters(query, where);

        const { error } = await query;
        if (error) {
          console.error(`Better-Auth [deleteMany] error for ${model}:`, error);
          throw error;
        }
      },
    };
  },
});

export const auth = betterAuth({
  database: supabaseAdapter(),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    modelName: 'users',
    fields: {
      name: 'first_name',
      image: 'avatar_url',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    additionalFields: {
      tenant_id: {
        type: 'string',
        required: true,
        input: true,
      },
      last_name: {
        type: 'string',
        required: true,
        input: true,
      },
      role: {
        type: 'string',
        required: true,
        input: true,
      },
      phone: {
        type: 'string',
        required: false,
        input: true,
      },
      legacy_user_id: {
        type: 'number',
        required: false,
      },
    },
  },
  session: {
    modelName: 'sessions',
    fields: {
      userId: 'user_id',
      expiresAt: 'expires_at',
      createdAt: 'created_at',
    },
    additionalFields: {
      tenant_id: {
        type: 'string',
        required: true,
      },
    },
  },
  plugins: [
    jwt({
      jwt: {
        definePayload: (session) => {
          return {
            id: session.user.id,
            email: session.user.email,
            tenant_id: session.user.tenant_id,
            role: session.user.role,
          };
        },
      },
    }),
  ],
});
