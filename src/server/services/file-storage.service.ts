import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { env } from '@/server/config/env';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { FileMetadataRepository, FileMetadataInput, FileMetadata } from '@/server/repositories/file-metadata.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/server/http/errors';
import { hasPermission } from '@/lib/permissions';
import type { UserRole } from '@/lib/permissions';

// Initialize Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn('Cloudinary environment variables are missing. File uploads to Cloudinary will fail.');
}

export type StorageKind =
  | 'avatar'
  | 'logo'
  | 'payroll'
  | 'expense'
  | 'project'
  | 'leave_document'
  | 'employee_document'
  | 'resume'
  | 'contract'
  | 'general';

export interface UploadOptions {
  tenantId: string;
  userId: string;
  kind: StorageKind;
  moduleName: string;
  entityType: string;
  entityId: string;
  accessLevel?: 'public' | 'restricted';
  ipAddress?: string;
  userAgent?: string;
}

interface UploadConfig {
  maxSize: number; // in bytes
  allowedMimeTypes: Set<string>;
  allowedExtensions: Set<string>;
  defaultAccessLevel: 'public' | 'restricted';
}

const UPLOAD_CONFIGS: Record<StorageKind, UploadConfig> = {
  avatar: {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedMimeTypes: new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    allowedExtensions: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']),
    defaultAccessLevel: 'public',
  },
  logo: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: new Set(['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']),
    allowedExtensions: new Set(['jpg', 'jpeg', 'png', 'svg', 'webp']),
    defaultAccessLevel: 'public',
  },
  payroll: {
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
    ]),
    allowedExtensions: new Set(['pdf', 'xls', 'xlsx']),
    defaultAccessLevel: 'restricted',
  },
  expense: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]),
    allowedExtensions: new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']),
    defaultAccessLevel: 'restricted',
  },
  project: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/csv',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed',
    ]),
    allowedExtensions: new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt', 'zip']),
    defaultAccessLevel: 'restricted',
  },
  leave_document: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    allowedExtensions: new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']),
    defaultAccessLevel: 'restricted',
  },
  employee_document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]),
    allowedExtensions: new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx']),
    defaultAccessLevel: 'restricted',
  },
  resume: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]),
    allowedExtensions: new Set(['pdf', 'doc', 'docx']),
    defaultAccessLevel: 'restricted',
  },
  contract: {
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: new Set(['application/pdf']),
    allowedExtensions: new Set(['pdf']),
    defaultAccessLevel: 'restricted',
  },
  general: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'text/plain',
    ]),
    allowedExtensions: new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'txt']),
    defaultAccessLevel: 'restricted',
  },
};

export class FileStorageService {
  /**
   * Helper to write audit logs to Supabase
   */
  private static async logAudit(input: {
    tenantId: string;
    userId: string;
    action: string;
    fileId?: string;
    filename?: string;
    ipAddress?: string;
    userAgent?: string;
    error?: string;
    durationMs?: number;
  }) {
    try {
      const supabase = getAdminRouteSupabase();
      await supabase.from('audit_logs').insert({
        tenant_id: input.tenantId,
        actor_user_id: input.userId,
        action: input.action,
        resource_type: 'file_storage',
        resource_id: input.fileId || 'N/A',
        method: 'SERVICE',
        path: '/server/services/file-storage',
        details: {
          filename: input.filename,
          ipAddress: input.ipAddress || '127.0.0.1',
          userAgent: input.userAgent || 'N/A',
          error: input.error,
          durationMs: input.durationMs,
        },
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log file storage audit:', err);
    }
  }

  /**
   * Check dynamic permissions based on RBAC roles and module permissions
   */
  static authorizeAccess(userRole: string, moduleName: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete'): boolean {
    const role = (userRole ?? '').toLowerCase();
    const mappedRole = (role === 'superadmin' || role === 'super_admin') 
      ? 'super_admin' 
      : (role === 'admin' ? 'admin' : (role === 'manager' ? 'manager' : (role === 'viewer' ? 'client' : 'employee')));

    // SuperAdmin or admin has full access bypass
    if (mappedRole === 'super_admin' || mappedRole === 'admin') {
      return true;
    }

    // Map general storage terms to existing permission modules
    let permissionModule = moduleName.toLowerCase() as any;
    if (permissionModule === 'leave_document') permissionModule = 'team';
    if (permissionModule === 'employee_document') permissionModule = 'team';
    if (permissionModule === 'payroll' || permissionModule === 'expense') permissionModule = 'finance';
    if (permissionModule === 'avatar') permissionModule = 'myAccount';

    try {
      return hasPermission(mappedRole as UserRole, permissionModule, action);
    } catch {
      return false;
    }
  }

  /**
   * Upload a file buffer to Cloudinary and register metadata
   */
  static async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<FileMetadata> {
    const startTime = Date.now();
    const { tenantId, userId, kind, moduleName, entityType, entityId } = options;

    const config = UPLOAD_CONFIGS[kind] || UPLOAD_CONFIGS.general;
    const accessLevel = options.accessLevel ?? config.defaultAccessLevel;

    // 1. File Size Validation
    if (fileBuffer.length > config.maxSize) {
      const errMsg = `File size exceeds the maximum limit of ${config.maxSize / (1024 * 1024)}MB for ${kind}`;
      await this.logAudit({ ...options, action: 'FILE_UPLOAD_FAILED', filename, error: errMsg });
      throw new BadRequestError(errMsg);
    }

    // 2. MIME Type & Extension Validation
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (!config.allowedMimeTypes.has(mimeType) || !config.allowedExtensions.has(ext)) {
      const errMsg = `Invalid file type: ${mimeType} (.${ext}). Supported types for ${kind}: ${Array.from(
        config.allowedExtensions
      ).join(', ')}`;
      await this.logAudit({ ...options, action: 'FILE_UPLOAD_FAILED', filename, error: errMsg });
      throw new BadRequestError(errMsg);
    }

    // 3. Filename Sanitization & Custom Unique Generation (Name + EmployeeID + Date)
    const sanitizedOriginalName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Fetch profile and employee details for filename prefix
    let employeeId = 'UNKNOWN';
    let employeeName = 'User_Name';
    
    try {
      const supabase = getAdminRouteSupabase();
      const { data: userProfile } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
        
      if (userProfile) {
        employeeName = `${userProfile.first_name || ''}_${userProfile.last_name || ''}`.trim() || 'User_Name';
      }
      
      const { data: employee } = await supabase
        .from('employees')
        .select('employee_id')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .maybeSingle();
        
      if (employee) {
        employeeId = employee.employee_id || 'UNKNOWN';
      }
    } catch (e) {
      console.warn('Failed to fetch user/employee info for custom filename:', e);
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const namePart = employeeName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const empIdPart = employeeId.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const uniqueName = `${namePart}_${empIdPart}_${today}_${crypto.randomUUID().substring(0, 8)}`;
    const storedFilename = `${uniqueName}.${ext}`;

    // 4. Duplicate Check using Checksum (SHA-256)
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const existingFile = await FileMetadataRepository.findByChecksum(tenantId, checksum, {
      moduleName,
      entityType,
      entityId,
    });
    
    if (existingFile) {
      // Reuse file metadata but create a reference for this entity if different
      await this.logAudit({
        ...options,
        action: 'FILE_UPLOAD_DUPLICATE_REUSED',
        fileId: existingFile.id,
        filename,
        durationMs: Date.now() - startTime,
      });

      // Update entity association details if requested for audit
      return existingFile;
    }

    // 5. Structure Folder Path
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    // Folder structure: tenant/[company-id]/[module]/[entity]/[year]/[month]
    const folderPath = `tenants/${tenantId}/${moduleName}/${entityType}/${year}/${month}`;

    // 6. Upload to Cloudinary via buffer upload stream
    let cloudinaryResult: any;
    try {
      cloudinaryResult = await new Promise((resolve, reject) => {
        const uploadOptions: any = {
          folder: folderPath,
          public_id: storedFilename.split('.')[0],
          resource_type: kind === 'payroll' || ext === 'pdf' || ext === 'xlsx' || ext === 'xls' ? 'raw' : 'auto',
          // Public delivery vs backend-authorized signing
          type: accessLevel === 'public' ? 'upload' : 'authenticated',
          // Quality optimizations & auto compression
          quality: 'auto',
          fetch_format: 'auto',
          tags: [moduleName, entityType, kind, `tenant_${tenantId}`],
        };

        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
        stream.write(fileBuffer);
        stream.end();
      });
    } catch (uploadError: any) {
      const errMsg = `Cloudinary upload stream failed: ${uploadError.message || uploadError}`;
      await this.logAudit({ ...options, action: 'FILE_UPLOAD_FAILED', filename, error: errMsg });
      throw new BadRequestError(errMsg);
    }

    // 7. Persist to PostgreSQL database
    try {
      const metadataInput: FileMetadataInput = {
        tenant_id: tenantId,
        module_name: moduleName,
        entity_type: entityType,
        entity_id: entityId,
        public_id: cloudinaryResult.public_id,
        secure_url: cloudinaryResult.secure_url,
        original_filename: sanitizedOriginalName,
        stored_filename: storedFilename,
        resource_type: cloudinaryResult.resource_type,
        format: cloudinaryResult.format || ext,
        mime_type: mimeType,
        size_bytes: fileBuffer.length,
        width: cloudinaryResult.width || null,
        height: cloudinaryResult.height || null,
        duration: cloudinaryResult.duration || null,
        folder_path: folderPath,
        tags: [moduleName, entityType, kind],
        checksum,
        uploaded_by: userId,
        access_level: accessLevel,
        version: 1,
        audit_info: {
          cloudinary_asset_id: cloudinaryResult.asset_id,
          ipAddress: options.ipAddress || '127.0.0.1',
          userAgent: options.userAgent || 'N/A',
        },
      };

      const record = await FileMetadataRepository.create(metadataInput);

      await this.logAudit({
        ...options,
        action: 'FILE_UPLOAD_SUCCESS',
        fileId: record.id,
        filename,
        durationMs: Date.now() - startTime,
      });

      return record;
    } catch (dbError: any) {
      // ROLLBACK: If DB save fails, delete the asset from Cloudinary to avoid orphans!
      console.error('Database write failed, starting Cloudinary rollback:', dbError);
      try {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id, {
          resource_type: cloudinaryResult.resource_type,
          type: accessLevel === 'public' ? 'upload' : 'authenticated',
        });
        console.log('Cloudinary rollback completed successfully for public_id:', cloudinaryResult.public_id);
      } catch (rollbackError) {
        console.error('Failed to rollback Cloudinary upload:', rollbackError);
      }

      const errMsg = `Database metadata registration failed: ${dbError.message || dbError}`;
      await this.logAudit({ ...options, action: 'FILE_UPLOAD_FAILED', filename, error: errMsg });
      throw dbError;
    }
  }

  /**
   * Retrieve a file metadata and check security before returning signed URL
   */
  static async getFile(
    fileId: string,
    actor: { tenantId: string; userId: string; role: UserRole; ipAddress?: string; userAgent?: string }
  ): Promise<{ metadata: FileMetadata; downloadUrl: string }> {
    const metadata = await FileMetadataRepository.findById(fileId);

    if (!metadata) {
      throw new NotFoundError('File not found');
    }

    // 1. Tenant Isolation check
    if (metadata.tenant_id !== actor.tenantId) {
      await this.logAudit({
        tenantId: actor.tenantId,
        userId: actor.userId,
        action: 'UNAUTHORIZED_FILE_ACCESS',
        fileId,
        filename: metadata.original_filename,
        error: `Tenant boundary breach. Owner tenant: ${metadata.tenant_id}, Requester tenant: ${actor.tenantId}`,
      });
      throw new ForbiddenError('Unauthorized: Access denied');
    }

    // 2. Access Level Check & RBAC Authorisation
    if (metadata.access_level === 'restricted') {
      const isAuthorized = this.authorizeAccess(actor.role, metadata.module_name, 'canView');
      const isOwner = metadata.uploaded_by === actor.userId || metadata.entity_id === actor.userId;

      if (!isAuthorized && !isOwner) {
        await this.logAudit({
          tenantId: actor.tenantId,
          userId: actor.userId,
          action: 'UNAUTHORIZED_FILE_ACCESS',
          fileId,
          filename: metadata.original_filename,
          error: `User role ${actor.role} does not have permissions for module ${metadata.module_name}`,
        });
        throw new ForbiddenError('Unauthorized: Insufficient permissions');
      }
    }

    // 3. Delivery URL Generation
    let downloadUrl = metadata.secure_url;

    if (metadata.access_level === 'restricted') {
      // Restricted files require generated signatures to fetch
      const resourceType = metadata.resource_type === 'raw' ? 'raw' : 'image';
      downloadUrl = cloudinary.utils.private_download_url(metadata.public_id, metadata.format, {
        resource_type: resourceType,
        type: 'authenticated',
        expires_at: Math.floor(Date.now() / 1000) + 60 * 10, // Valid for 10 minutes
      });
    }

    await this.logAudit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'FILE_DOWNLOAD_ACCESS_GRANTED',
      fileId,
      filename: metadata.original_filename,
    });

    return { metadata, downloadUrl };
  }

  /**
   * Replace an existing file with a new file
   */
  static async replaceFile(
    oldFileId: string,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<FileMetadata> {
    const oldMetadata = await FileMetadataRepository.findById(oldFileId);

    if (!oldMetadata) {
      throw new NotFoundError('Original file not found');
    }

    if (oldMetadata.tenant_id !== options.tenantId) {
      throw new ForbiddenError('Unauthorized: Tenant mismatch');
    }

    // Upload the new file
    const newRecord = await this.uploadFile(fileBuffer, filename, mimeType, options);

    // Soft delete old file in DB
    await FileMetadataRepository.softDelete(oldFileId);

    // Trigger cleanup of old asset from Cloudinary asynchronously to optimize response times
    this.deleteCloudinaryAsset(oldMetadata).catch((err) => {
      console.error(`Failed to delete replaced Cloudinary asset ${oldMetadata.public_id}:`, err);
    });

    await this.logAudit({
      ...options,
      action: 'FILE_REPLACED',
      fileId: newRecord.id,
      filename,
      error: `Replaced old file ${oldFileId}`,
    });

    return newRecord;
  }

  /**
   * Delete a file
   */
  static async deleteFile(
    fileId: string,
    actor: { tenantId: string; userId: string; role: UserRole },
    softDelete = true
  ): Promise<void> {
    const metadata = await FileMetadataRepository.findById(fileId);

    if (!metadata) {
      throw new NotFoundError('File not found');
    }

    if (metadata.tenant_id !== actor.tenantId) {
      throw new ForbiddenError('Unauthorized: Tenant mismatch');
    }

    const isAuthorized = this.authorizeAccess(actor.role, metadata.module_name, 'canDelete');
    const isOwner = metadata.uploaded_by === actor.userId;

    if (!isAuthorized && !isOwner) {
      throw new ForbiddenError('Unauthorized: Insufficient permissions to delete');
    }

    if (softDelete) {
      await FileMetadataRepository.softDelete(fileId);
      await this.logAudit({
        tenantId: actor.tenantId,
        userId: actor.userId,
        action: 'FILE_SOFT_DELETED',
        fileId,
        filename: metadata.original_filename,
      });
    } else {
      await FileMetadataRepository.hardDelete(fileId);
      await this.deleteCloudinaryAsset(metadata);
      await this.logAudit({
        tenantId: actor.tenantId,
        userId: actor.userId,
        action: 'FILE_HARD_DELETED',
        fileId,
        filename: metadata.original_filename,
      });
    }
  }

  /**
   * Delete helper for Cloudinary API
   */
  private static async deleteCloudinaryAsset(metadata: FileMetadata) {
    const type = metadata.access_level === 'public' ? 'upload' : 'authenticated';
    const resourceType = metadata.resource_type === 'raw' ? 'raw' : 'image';

    try {
      await cloudinary.uploader.destroy(metadata.public_id, {
        resource_type: resourceType,
        type: type,
      });
    } catch (err) {
      console.error(`Failed to delete asset ${metadata.public_id} from Cloudinary:`, err);
      throw err;
    }
  }

  /**
   * Background cleanup of expired soft-deleted files
   */
  static async cleanupExpiredSoftDeleted(daysOlderThan = 30): Promise<number> {
    const expiredFiles = await FileMetadataRepository.findSoftDeletedExpired(daysOlderThan);
    let deletedCount = 0;

    for (const file of expiredFiles) {
      try {
        await this.deleteCloudinaryAsset(file);
        await FileMetadataRepository.hardDelete(file.id);
        deletedCount++;

        await this.logAudit({
          tenantId: file.tenant_id,
          userId: '00000000-0000-0000-0000-000000000000', // System account
          action: 'FILE_CLEANUP_CRON',
          fileId: file.id,
          filename: file.original_filename,
        });
      } catch (err) {
        console.error(`Cleanup failed for file metadata ${file.id}:`, err);
      }
    }

    return deletedCount;
  }
}
