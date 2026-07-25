import { env } from '@/server/config/env';
import { getSupabaseAdminClient } from '@/server/supabase/admin';

export type StorageKind = 'avatar' | 'payroll' | 'expense' | 'project' | 'leave_document' | 'employee_document';

function getBucketName(kind: StorageKind) {
  switch (kind) {
    case 'avatar':
      return env.SUPABASE_STORAGE_BUCKET_AVATARS ?? 'avatars';
    case 'payroll':
      return env.SUPABASE_STORAGE_BUCKET_PAYROLL ?? 'payroll';
    case 'expense':
      return env.SUPABASE_STORAGE_BUCKET_EXPENSES ?? 'expenses';
    case 'project':
      return env.SUPABASE_STORAGE_BUCKET_PROJECTS ?? 'project-files';
    case 'leave_document':
      return 'leave-documents';
    case 'employee_document':
      return 'employee-documents';
  }
}

export async function uploadTenantFile(input: {
  tenantId: string;
  kind: StorageKind;
  path: string;
  contentType: string;
  data: ArrayBuffer | Uint8Array;
  upsert?: boolean;
}) {
  const supabase = getSupabaseAdminClient();
  const bucket = getBucketName(input.kind);
  const filePath = `tenants/${input.tenantId}/${input.path}`;

  // Self-heal: ensure the bucket exists in Supabase Storage before uploading
  try {
    const { data: bucketInfo, error: bucketErr } = await supabase.storage.getBucket(bucket);
    if (bucketErr || !bucketInfo) {
      console.warn(`Storage bucket '${bucket}' not found. Creating it...`);
      const { error: createErr } = await supabase.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024,
      });
      if (createErr) {
        console.error(`Failed to create bucket '${bucket}':`, createErr);
      }
    }
  } catch (err) {
    console.warn(`Error during bucket check for '${bucket}':`, err);
  }

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, input.data, {
    contentType: input.contentType,
    upsert: input.upsert ?? false,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function createSignedTenantFileUrl(input: {
  tenantId: string;
  kind: StorageKind;
  path: string;
  expiresIn?: number;
}) {
  const supabase = getSupabaseAdminClient();
  const bucket = getBucketName(input.kind);
  const filePath = `tenants/${input.tenantId}/${input.path}`;

  // Self-heal: ensure the bucket exists in Supabase Storage before signing URLs
  try {
    const { data: bucketInfo, error: bucketErr } = await supabase.storage.getBucket(bucket);
    if (bucketErr || !bucketInfo) {
      console.warn(`Storage bucket '${bucket}' not found during URL signing. Creating it...`);
      const { error: createErr } = await supabase.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024,
      });
      if (createErr) {
        console.error(`Failed to create bucket '${bucket}':`, createErr);
      }
    }
  } catch (err) {
    console.warn(`Error during bucket check for '${bucket}':`, err);
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, input.expiresIn ?? 60 * 10);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
