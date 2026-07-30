import { getSupabaseAdminClient } from '@/server/supabase/admin';

export interface FileMetadataInput {
  tenant_id: string;
  module_name: string;
  entity_type: string;
  entity_id: string;
  public_id: string;
  secure_url: string;
  original_filename: string;
  stored_filename: string;
  resource_type: string;
  format: string;
  mime_type: string;
  size_bytes: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  folder_path: string;
  tags?: string[];
  checksum?: string | null;
  uploaded_by?: string | null;
  access_level?: 'public' | 'restricted';
  version?: number;
  audit_info?: Record<string, any>;
}

export interface FileMetadata extends FileMetadataInput {
  id: string;
  uploaded_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export class FileMetadataRepository {
  private static getClient() {
    return getSupabaseAdminClient();
  }

  /**
   * Create a new file metadata record
   */
  static async create(input: FileMetadataInput): Promise<FileMetadata> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('file_metadata')
      .insert({
        ...input,
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error in FileMetadataRepository.create:', error);
      throw error;
    }

    return data as FileMetadata;
  }

  /**
   * Find a file metadata record by its ID
   */
  static async findById(id: string): Promise<FileMetadata | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('Error in FileMetadataRepository.findById:', error);
      throw error;
    }

    return data as FileMetadata | null;
  }

  /**
   * Find a file by its checksum (to prevent duplicate uploads for a tenant)
   */
  static async findByChecksum(tenantId: string, checksum: string): Promise<FileMetadata | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('checksum', checksum)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error in FileMetadataRepository.findByChecksum:', error);
      throw error;
    }

    return data as FileMetadata | null;
  }

  /**
   * Update file metadata
   */
  static async update(id: string, updates: Partial<FileMetadataInput>): Promise<FileMetadata> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('file_metadata')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error in FileMetadataRepository.update:', error);
      throw error;
    }

    return data as FileMetadata;
  }

  /**
   * Soft delete a file metadata record by ID
   */
  static async softDelete(id: string): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase
      .from('file_metadata')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error in FileMetadataRepository.softDelete:', error);
      throw error;
    }
  }

  /**
   * Hard delete a file metadata record (cleanup)
   */
  static async hardDelete(id: string): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase
      .from('file_metadata')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error in FileMetadataRepository.hardDelete:', error);
      throw error;
    }
  }

  /**
   * List files for a tenant with filters
   */
  static async list(
    tenantId: string,
    filters: {
      module_name?: string;
      entity_type?: string;
      entity_id?: string;
      access_level?: 'public' | 'restricted';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ data: FileMetadata[]; count: number }> {
    const supabase = this.getClient();
    let query = supabase
      .from('file_metadata')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (filters.module_name) {
      query = query.eq('module_name', filters.module_name);
    }
    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }
    if (filters.entity_id) {
      query = query.eq('entity_id', filters.entity_id);
    }
    if (filters.access_level) {
      query = query.eq('access_level', filters.access_level);
    }

    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    query = query
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error in FileMetadataRepository.list:', error);
      throw error;
    }

    return {
      data: (data || []) as FileMetadata[],
      count: count || 0,
    };
  }

  /**
   * Find soft deleted records that are expired (e.g. soft-deleted more than 30 days ago)
   */
  static async findSoftDeletedExpired(daysOlderThan = 30): Promise<FileMetadata[]> {
    const supabase = this.getClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOlderThan);

    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error in FileMetadataRepository.findSoftDeletedExpired:', error);
      throw error;
    }

    return (data || []) as FileMetadata[];
  }
}
