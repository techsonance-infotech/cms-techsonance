import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const searchParams = new URL(request.url).searchParams;
  const resource = searchParams.get('resource') || 'all';

  const supabase = getAdminRouteSupabase();
  const results: any = {};

  if (resource === 'coa' || resource === 'all') {
    const { data: coa, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('account_code', { ascending: true });
    if (error) throw error;
    results.coa = coa || [];
  }

  if (resource === 'cost_centers' || resource === 'all') {
    const { data: cc, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('code', { ascending: true });
    if (error) throw error;
    results.costCenters = cc || [];
  }

  if (resource === 'journal' || resource === 'all') {
    const { data: journal, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    results.journalEntries = journal || [];
  }

  if (resource === 'ledger' || resource === 'all') {
    const { data: ledger, error } = await supabase
      .from('general_ledger')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('posting_date', { ascending: false });
    if (error) throw error;
    results.ledger = ledger || [];
  }

  return NextResponse.json({ success: true, data: results });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { action } = body;
  if (!action) throw new BadRequestError('action is required');

  const supabase = getAdminRouteSupabase();

  if (action === 'create_coa') {
    const { code, name, type, currency } = body;
    if (!code || !name || !type) throw new BadRequestError('Missing Chart of Account required fields');

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .insert({
        tenant_id: tenantId,
        account_code: code,
        account_name: name,
        account_type: type,
        currency: currency || 'INR'
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  }

  if (action === 'create_cost_center') {
    const { code, name, budgetLimit } = body;
    if (!code || !name) throw new BadRequestError('Missing Cost Center required fields');

    const { data, error } = await supabase
      .from('cost_centers')
      .insert({
        tenant_id: tenantId,
        code,
        name,
        budget_limit: parseFloat(budgetLimit) || 0
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  }

  if (action === 'post_journal') {
    const { entryNumber, debitAccount, creditAccount, amount, notes } = body;
    if (!entryNumber || !debitAccount || !creditAccount || !amount) {
      throw new BadRequestError('Missing Journal required fields');
    }

    const postingAmount = parseFloat(amount);

    // Start database transaction simulation using sequence insert
    const { data: journal, error: journalErr } = await supabase
      .from('journal_entries')
      .insert({
        tenant_id: tenantId,
        entry_number: entryNumber,
        debit_account_code: debitAccount,
        credit_account_code: creditAccount,
        amount: postingAmount,
        notes,
        status: 'Posted'
      })
      .select()
      .single();

    if (journalErr) throw journalErr;

    // Post debits & credits in the General Ledger
    const { error: ledgerErr } = await supabase
      .from('general_ledger')
      .insert([
        {
          tenant_id: tenantId,
          account_code: debitAccount,
          debit: postingAmount,
          credit: 0.0000,
          ref_transaction_type: 'Journal',
          ref_transaction_id: journal.id.toString(),
          notes
        },
        {
          tenant_id: tenantId,
          account_code: creditAccount,
          debit: 0.0000,
          credit: postingAmount,
          ref_transaction_type: 'Journal',
          ref_transaction_id: journal.id.toString(),
          notes
        }
      ]);

    if (ledgerErr) throw ledgerErr;

    return NextResponse.json({ success: true, data: journal });
  }

  throw new BadRequestError('Unsupported action: ' + action);
}, { requireAuth: true, roles: ['Employee'] });
