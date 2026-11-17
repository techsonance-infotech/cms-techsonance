import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { createSignedTenantFileUrl } from '@/server/supabase/storage';
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

function assertSafeStoragePath(path: string) {
  if (!path || path.startsWith('/') || path.includes('..')) {
    throw new BadRequestError('Invalid file path');
  }
}

/**
 * GET: Secure Download & Preview Redirect Endpoint
 * Handles both legacy Supabase files and new Cloudinary file IDs.
 */
export const GET = withApiHandler(
  async (request, context) => {
    const accessToken = context.auth?.accessToken;
    if (!accessToken) throw new BadRequestError('Authorization token is required');
    const actor = await getCurrentSupabaseActor(accessToken);
    const searchParams = new URL(request.url).searchParams;

    const fileId = searchParams.get('fileId');
    const path = searchParams.get('path');
    const kindParam = searchParams.get('kind');

    // 1. Fallback for legacy Supabase Storage requests
    if (path && kindParam && !fileId) {
      assertSafeStoragePath(path);
      const signedUrl = await createSignedTenantFileUrl({
        tenantId: actor.tenantId,
        kind: kindParam as any,
        path,
        expiresIn: 60 * 10,
      });

      if (request.headers.get('accept')?.includes('application/json')) {
        const jsonRes = apiSuccess({ url: signedUrl }, 'Legacy signed URL generated');
        jsonRes.headers.set('Cache-Control', 'private, max-age=300');
        return jsonRes;
      }

      const redirectRes = NextResponse.redirect(signedUrl, { status: 302 });
      redirectRes.headers.set('Cache-Control', 'private, max-age=300');
      return redirectRes;
    }

    // 2. New Cloudinary-first storage requests
    if (!fileId) {
      throw new BadRequestError('fileId is required');
    }

    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'N/A';

    const { metadata, downloadUrl } = await FileStorageService.getFile(fileId, {
      tenantId: actor.tenantId,
      userId: actor.authUserId,
      role: actor.role as UserRole,
      ipAddress,
      userAgent,
    });

    if (request.headers.get('accept')?.includes('application/json')) {
      const jsonRes = apiSuccess({ url: downloadUrl, metadata }, 'File secure URL generated');
      jsonRes.headers.set('Cache-Control', 'private, max-age=300');
      return jsonRes;
    }

    const redirectRes = NextResponse.redirect(downloadUrl, { status: 302 });
    redirectRes.headers.set('Cache-Control', 'private, max-age=300');
    return redirectRes;
  },
  { requireAuth: true, roles: ['Employee'] }
);

/**
 * POST: Centralized File Upload Endpoint
 * Supports single file (`file`) and multiple files (`files` or `files[]`).
 */
export const POST = withApiHandler(
  async (request, context) => {
    const accessToken = context.auth?.accessToken;
    if (!accessToken) throw new BadRequestError('Authorization token is required');
    const actor = await getCurrentSupabaseActor(accessToken);

    const formData = await request.formData();
    const kind = getUploadKind(formData.get('kind'));
    const moduleName = (formData.get('moduleName') as string) || kind;
    const entityType = (formData.get('entityType') as string) || 'general';
    const entityId = (formData.get('entityId') as string) || 'draft';
    const accessLevelInput = formData.get('accessLevel') as string;
    const accessLevel = accessLevelInput === 'public' || accessLevelInput === 'restricted' ? accessLevelInput : undefined;

    // Retrieve uploaded files
    const uploadedFiles: File[] = [];
    
    const file = formData.get('file');
    if (file instanceof File) {
      uploadedFiles.push(file);
    }
    
    // Check for multiple files
    const files = formData.getAll('files');
    for (const f of files) {
      if (f instanceof File) {
        uploadedFiles.push(f);
      }
    }

    const filesArray = formData.getAll('file[]');
    for (const f of filesArray) {
      if (f instanceof File) {
        uploadedFiles.push(f);
      }
    }

    if (uploadedFiles.length === 0) {
      throw new BadRequestError('At least one file upload is required');
    }

    // Server-side type and size validation
    for (const uFile of uploadedFiles) {
      const fileNameLower = uFile.name.toLowerCase();
      const mimeType = uFile.type;
      
      const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/jpg' || mimeType === 'image/webp' ||
                      fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png') || fileNameLower.endsWith('.webp');
                      
      const isPdf = mimeType === 'application/pdf' || fileNameLower.endsWith('.pdf');
      
      const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileNameLower.endsWith('.docx');
      
      if (!isImage && !isPdf && !isDocx) {
        throw new BadRequestError(`Invalid file type for '${uFile.name}'. Only PDF, DOCX, and images (JPG, JPEG, PNG, WEBP) are accepted.`);
      }
      
      if (isImage && uFile.size > 5 * 1024 * 1024) {
        throw new BadRequestError(`File '${uFile.name}' exceeds the 5MB limit for images.`);
      }
      
      if ((isPdf || isDocx) && uFile.size > 5 * 1024 * 1024) {
        throw new BadRequestError(`File '${uFile.name}' exceeds the 5MB limit for documents.`);
      }
    }

    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'N/A';

    const uploadOptions = {
      tenantId: actor.tenantId,
      userId: actor.authUserId,
      kind,
      moduleName,
      entityType,
      entityId,
      accessLevel: accessLevel as 'public' | 'restricted' | undefined,
      ipAddress,
      userAgent,
    };

    const results = [];
    for (const uFile of uploadedFiles) {
      const bytes = await uFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const record = await FileStorageService.uploadFile(
        buffer,
        uFile.name,
        uFile.type,
        uploadOptions
      );

      results.push({
        url: `/api/upload?fileId=${record.id}`,
        id: record.id,
        name: record.original_filename,
        type: record.mime_type,
        size: record.size_bytes,
        kind,
        publicId: record.public_id,
        secureUrl: record.secure_url,
      });
    }

    // Return single object if only one file was uploaded, for backwards compatibility
    const responseData = results.length === 1 ? results[0] : results;
    const message = results.length === 1 ? 'File uploaded successfully' : 'Files uploaded successfully';

    return apiSuccess(responseData, message, { status: 201 });
  },
  { requireAuth: true, roles: ['Employee'] }
);
