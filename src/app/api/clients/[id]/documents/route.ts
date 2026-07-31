import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { FileMetadataRepository } from '@/server/repositories/file-metadata.repository';

function getClientIdFromRequest(request: Request): string | undefined {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    // Path format: /api/clients/[id]/documents
    // parts: ['api', 'clients', '[id]', 'documents'] -> client ID is second from last
    return parts[parts.length - 2];
  } catch (err) {
    console.error('Failed to parse client ID from request URL:', err);
    return undefined;
  }
}

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const clientIdStr = getClientIdFromRequest(request);
  if (!clientIdStr) throw new BadRequestError('Client ID is required');

  const clientId = Number(clientIdStr);
  if (isNaN(clientId) || clientId <= 0) {
    throw new BadRequestError('Invalid Client ID');
  }

  const { data: files } = await FileMetadataRepository.list(tenantId, {
    module_name: 'clients',
    entity_id: String(clientId),
    limit: 100,
  });

  return NextResponse.json(files);
}, { requireAuth: true });
