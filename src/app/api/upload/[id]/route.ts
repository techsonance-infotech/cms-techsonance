import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { getCurrentSupabaseActor } from '@/server/supabase/route-helpers';
import { FileStorageService, StorageKind } from '@/server/services/file-storage.service';
import type { UserRole } from '@/lib/permissions';

const VALID_KINDS = new Set([
  'avatar',
  'logo',
  'payroll',
  'expense',
  'project',
  'leave_document',
  'employee_document',
  'resume',
  'contract',
  'general',
]);

function getUploadKind(value: FormDataEntryValue | null): StorageKind {
  if (typeof value !== 'string') {
    return 'general';
  }

  if (!VALID_KINDS.has(value)) {
    throw new BadRequestError('Invalid upload kind');
  }

  return value as StorageKind;
}
function getResourceIdFromRequest(request: Request): string | undefined {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1];
  } catch (err) {
    console.error('Failed to parse resource ID from request URL:', err);
    return undefined;
  }
}

/**
 * GET /api/upload/[id]
 * Checks permission and redirects user to secure signed Cloudinary URL.
 */
export const GET = withApiHandler(
  async (request, context) => {
    const id = getResourceIdFromRequest(request);

    if (!id) {
      throw new BadRequestError('File ID is required');
    }

    const accessToken = context.auth?.accessToken;
    if (!accessToken) throw new BadRequestError('Authorization token is required');
    const actor = await getCurrentSupabaseActor(accessToken);

    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'N/A';

    const { metadata, downloadUrl } = await FileStorageService.getFile(id, {
      tenantId: actor.tenantId,
      userId: actor.authUserId,
      role: actor.role as UserRole,
      ipAddress,
      userAgent,
    });

    if (request.headers.get('accept')?.includes('application/json')) {
      return apiSuccess({ url: downloadUrl, metadata }, 'Secure preview details generated');
    }

    return NextResponse.redirect(downloadUrl, { status: 302 });
  },
  { requireAuth: true, roles: ['Employee'] }
);

/**
 * PUT /api/upload/[id]
 * Replaces an existing file with a new uploaded version.
 */
export const PUT = withApiHandler(
  async (request, context) => {
    const id = getResourceIdFromRequest(request);

    if (!id) {
      throw new BadRequestError('File ID is required');
    }

    const accessToken = context.auth?.accessToken;
    if (!accessToken) throw new BadRequestError('Authorization token is required');
    const actor = await getCurrentSupabaseActor(accessToken);

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new BadRequestError('A file replacement is required');
    }

    const kind = getUploadKind(formData.get('kind'));
    const moduleName = (formData.get('moduleName') as string) || kind;
    const entityType = (formData.get('entityType') as string) || 'general';
    const entityId = (formData.get('entityId') as string) || 'draft';
    const accessLevelInput = formData.get('accessLevel') as string;
    const accessLevel = accessLevelInput === 'public' || accessLevelInput === 'restricted' ? accessLevelInput : undefined;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'N/A';

    const record = await FileStorageService.replaceFile(
      id,
      buffer,
      file.name,
      file.type,
      {
        tenantId: actor.tenantId,
        userId: actor.authUserId,
        kind,
        moduleName,
        entityType,
        entityId,
        accessLevel: accessLevel as 'public' | 'restricted' | undefined,
        ipAddress,
        userAgent,
      }
    );

    return apiSuccess(
      {
        url: `/api/upload?fileId=${record.id}`,
        id: record.id,
        name: record.original_filename,
        type: record.mime_type,
        size: record.size_bytes,
        kind,
        publicId: record.public_id,
        secureUrl: record.secure_url,
      },
      'File replaced successfully'
    );
  },
  { requireAuth: true, roles: ['Employee'] }
);

/**
 * DELETE /api/upload/[id]
 * Soft deletes the file from system metadata and deletes/archives the Cloudinary asset.
 */
export const DELETE = withApiHandler(
  async (request, context) => {
    const id = getResourceIdFromRequest(request);

    if (!id) {
      throw new BadRequestError('File ID is required');
    }

    const accessToken = context.auth?.accessToken;
    if (!accessToken) throw new BadRequestError('Authorization token is required');
    const actor = await getCurrentSupabaseActor(accessToken);

    // Default to soft-deleting files. If query param hard=true and user is Admin, hard delete.
    const searchParams = new URL(request.url).searchParams;
    const hardDelete = searchParams.get('hard') === 'true' && (actor.role === 'Admin' || actor.role === 'SuperAdmin');

    await FileStorageService.deleteFile(
      id,
      {
        tenantId: actor.tenantId,
        userId: actor.authUserId,
        role: actor.role as any,
      },
      !hardDelete
    );

    return apiSuccess({ id }, hardDelete ? 'File permanently deleted' : 'File soft deleted successfully');
  },
  { requireAuth: true, roles: ['Employee'] }
);
