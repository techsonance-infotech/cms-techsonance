import { NextRequest } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { env } from '@/server/config/env';
import { FileStorageService } from '@/server/services/file-storage.service';

/**
 * GET /api/upload/cleanup
 * Cron trigger or admin-facing endpoint to purge soft-deleted assets older than X days.
 */
export const GET = withApiHandler(
  async (request, context) => {
    const searchParams = new URL(request.url).searchParams;
    const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');
    const daysParam = searchParams.get('days');
    const daysOlderThan = daysParam ? parseInt(daysParam, 10) : 30;

    if (isNaN(daysOlderThan) || daysOlderThan < 0) {
      throw new BadRequestError('Invalid days parameter');
    }

    // 1. Verify Authorization: Cron Secret or Admin Role
    const isCronBypass = env.CRON_SECRET && secret === env.CRON_SECRET;
    
    if (!isCronBypass) {
      const user = context.auth?.user;
      if (!user) throw new ForbiddenError('Unauthorized: Access denied');
      
      const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';
      if (!isAdmin) {
        throw new ForbiddenError('Forbidden: Only admins can trigger file storage cleanup');
      }
    }

    // 2. Perform file cleanup
    const purgeCount = await FileStorageService.cleanupExpiredSoftDeleted(daysOlderThan);

    return apiSuccess(
      { purgedCount: purgeCount, daysThreshold: daysOlderThan },
      `Successfully purges ${purgeCount} expired file assets from Cloudinary and PostgreSQL metadata records.`
    );
  },
  { requireAuth: false } // We handle authorization checks custom inside the handler
);
