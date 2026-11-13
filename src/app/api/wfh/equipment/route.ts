import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError, ForbiddenError } from '@/server/http/errors';
import { isEmployeeRole, type UserRole } from '@/lib/permissions';

export const POST = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;
  const userRole = (user.role || 'employee').toLowerCase().replace(/[\s-]+/g, '_') as UserRole;

  if (isEmployeeRole(userRole)) {
    throw new ForbiddenError('Only Administrators and Managers can assign hardware equipment.');
  }

  const body = await request.json();
  const { userId, assetName, assetType, serialNumber, condition, status } = body;

  if (!userId || !assetName || !serialNumber) {
    throw new BadRequestError('User, Asset Name, and Serial Number are required.');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('wfh_equipment_assignments')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      asset_name: assetName.trim(),
      asset_type: assetType?.trim() || 'Laptop',
      serial_number: serialNumber.trim(),
      condition: condition?.trim() || 'Good',
      assigned_date: new Date().toISOString().split('T')[0],
      status: status?.trim() || 'Assigned'
    })
    .select()
    .single();

  if (error) {
    console.error('Error assigning equipment:', error);
    throw new Error(error.message || 'Failed to assign hardware asset.');
  }

  return NextResponse.json({
    success: true,
    message: `Hardware asset '${assetName}' successfully assigned!`,
    equipment: data
  });
}, { requireAuth: true });
