import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError } from '@/server/http/errors';
import crypto from 'crypto';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();

  // Fetch API Keys
  const { data: apiKeys, error: keysError } = await supabase
    .from('tenant_api_keys')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (keysError) throw keysError;

  // Fetch Webhooks
  const { data: webhooks, error: webhooksError } = await supabase
    .from('tenant_webhooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (webhooksError) throw webhooksError;

  // Fetch API access logs
  const { data: apiLogs, error: logsError } = await supabase
    .from('tenant_api_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (logsError) throw logsError;

  // Mock OAuth apps
  const oauthApps = [
    { id: 'oauth-1', name: 'Workforce Portal Integrator', clientId: 'ts_client_28dsa92u9as2', clientSecret: '••••••••••••••••••••••••', redirectUri: 'https://workforce.externalapp.com/callback', enabled: true },
    { id: 'oauth-2', name: 'Slack Custom App Sync', clientId: 'ts_client_11ha8h28hs91', clientSecret: '••••••••••••••••••••••••', redirectUri: 'https://slack-sync.externalapp.com/oauth', enabled: true }
  ];

  return NextResponse.json({
    success: true,
    data: {
      apiKeys: apiKeys || [],
      webhooks: webhooks || [],
      oauthApps,
      apiLogs: apiLogs || []
    }
  });
}, { requireAuth: true, roles: ['Admin', 'Manager'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const { action, keyName, url, events, keyId, webhookId, playgroundPath, playgroundMethod, playgroundBody } = await request.json();

  if (action === 'create-key') {
    if (!keyName) throw new BadRequestError('keyName is required');

    // Generate a random string as API Key
    const rawKey = 'ts_live_' + crypto.randomBytes(24).toString('hex');
    const prefix = rawKey.substring(0, 12); // "ts_live_abcd"
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    const { data, error } = await supabase
      .from('tenant_api_keys')
      .insert({
        tenant_id: tenantId,
        key_name: keyName,
        prefix,
        hashed_key: hashedKey,
        permissions: ['read', 'write'],
        rate_limit: 60,
        enabled: true
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Developer API key generated!', rawKey, data });
  }

  if (action === 'delete-key') {
    if (!keyId) throw new BadRequestError('keyId is required');

    const { error } = await supabase
      .from('tenant_api_keys')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', keyId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'API key successfully deleted!' });
  }

  if (action === 'create-webhook') {
    if (!url) throw new BadRequestError('Webhook url is required');

    const secret = 'whsec_' + crypto.randomBytes(16).toString('hex');
    const { data, error } = await supabase
      .from('tenant_webhooks')
      .insert({
        tenant_id: tenantId,
        url,
        secret,
        events: events || ['employee.created', 'employee.updated'],
        enabled: true
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Webhook endpoint registered!', data });
  }

  if (action === 'delete-webhook') {
    if (!webhookId) throw new BadRequestError('webhookId is required');

    const { error } = await supabase
      .from('tenant_webhooks')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', webhookId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Webhook endpoint deleted!' });
  }

  if (action === 'send-playground') {
    if (!playgroundPath || !playgroundMethod) throw new BadRequestError('path and method are required');

    const startTime = Date.now();
    // Simulate execution
    const mockResponse = {
      timestamp: new Date().toISOString(),
      status: 'success',
      data: {
        endpoint: playgroundPath,
        method: playgroundMethod,
        message: 'Mock response executed in playground environment.',
        parsedBody: playgroundBody || {}
      }
    };
    const duration = Date.now() - startTime;

    // Log the request
    const { error } = await supabase
      .from('tenant_api_logs')
      .insert({
        tenant_id: tenantId,
        path: playgroundPath,
        method: playgroundMethod,
        status_code: 200,
        ip_address: '127.0.0.1',
        duration_ms: duration
      });

    if (error) throw error;
    return NextResponse.json({ success: true, response: mockResponse });
  }

  throw new BadRequestError('Invalid developer actions.');
}, { requireAuth: true, roles: ['Admin'] });
