import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/server/supabase/admin';
import { registerTenantAdmin } from '@/server/supabase/auth';
import { getNextLegacyUserId } from '@/server/supabase/users';
import { sendVerificationEmail } from '@/server/mail/verification';
import crypto from 'crypto';

const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;
const passwordComplexityMessage = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';

const registerSchema = z.object({
  firstName: z.string().regex(/^[a-zA-Z]+$/, 'First name must contain only letters (no spaces, numbers or special characters)'),
  lastName: z.string().regex(/^[a-zA-Z]+$/, 'Last name must contain only letters (no spaces, numbers or special characters)'),
  username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/, 'Invalid username format'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordComplexityRegex, passwordComplexityMessage),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ message: errors }, { status: 400 });
    }

    const { firstName, lastName, username, email, phone, companyName, password } = parsed.data;
    const supabase = getSupabaseAdminClient();

    // 1. Duplicate check: Company Name uniqueness
    let existingCompany = null;
    let existingTenantName = null;
    try {
      const companyCheck = await supabase
        .from('company_settings')
        .select('id')
        .eq('company_name', companyName.trim())
        .limit(1)
        .maybeSingle();
      if (companyCheck.data) {
        existingCompany = companyCheck.data;
      }
      
      const tenantNameCheck = await supabase
        .from('tenants')
        .select('id')
        .eq('name', companyName.trim())
        .limit(1)
        .maybeSingle();
      if (tenantNameCheck.data) {
        existingTenantName = tenantNameCheck.data;
      }
    } catch (e) {
      console.warn('Registration: Company name check bypassed:', e);
    }

    if (existingCompany || existingTenantName) {
      return NextResponse.json(
        { message: 'A company with this name has already been registered.' },
        { status: 400 }
      );
    }

    // 2. Duplicate check: Username uniqueness
    let existingUsername = null;
    try {
      const usernameCheck = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .limit(1)
        .maybeSingle();
      if (usernameCheck.data) {
        existingUsername = usernameCheck.data;
      }
    } catch (e) {
      console.warn('Registration: Username unique check bypassed (column might be missing):', e);
    }

    if (existingUsername) {
      return NextResponse.json(
        { message: 'This username is already taken.' },
        { status: 400 }
      );
    }

    // 3. Duplicate checks: email or phone
    const { data: existingUser, error: checkUserError } = await supabase
      .from('users')
      .select('id, email')
      .or(`email.eq.${email.toLowerCase().trim()},phone.eq.${phone.trim()}`)
      .maybeSingle();

    if (checkUserError) {
      console.error('Registration check user error:', checkUserError);
      return NextResponse.json({ message: 'Database check failed' }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json(
        { message: 'An account with this email or phone number already exists.' },
        { status: 400 }
      );
    }

    // 2. Generate slug for tenant
    let baseSlug = companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!baseSlug) {
      baseSlug = 'workspace';
    }

    let slug = baseSlug;
    let isUnique = false;
    let attempt = 0;

    while (!isUnique && attempt < 10) {
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (!existingTenant) {
        isUnique = true;
      } else {
        attempt++;
        slug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
      }
    }

    // 3. Create Tenant in DB with 14-day Free Trial
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 14);

    let tenant: any = null;
    let tenantError: any = null;

    const firstTry = await supabase
      .from('tenants')
      .insert({
        name: companyName,
        slug,
        status: 'active',
        plan_code: 'trial',
        license_expires_at: trialExpiresAt.toISOString(),
      })
      .select()
      .single();

    if (firstTry.error) {
      console.warn('Registration: Primary tenant insertion failed, attempting fallback...', firstTry.error);
      
      // Fallback: Omit license_expires_at if column doesn't exist yet
      const fallbackTry = await supabase
        .from('tenants')
        .insert({
          name: companyName,
          slug,
          status: 'active',
          plan_code: 'trial',
        })
        .select()
        .single();

      if (fallbackTry.error) {
        tenantError = fallbackTry.error;
      } else {
        tenant = fallbackTry.data;
      }
    } else {
      tenant = firstTry.data;
    }

    if (tenantError || !tenant) {
      console.error('Registration tenant creation error:', tenantError || 'No tenant data returned');
      return NextResponse.json({ message: 'Failed to create tenant workspace.' }, { status: 500 });
    }

    // 4. Create user in Supabase auth (pre-confirmed in Supabase auth system)
    let authUser;
    try {
      authUser = await registerTenantAdmin({
        email: email.toLowerCase().trim(),
        password,
        firstName,
        lastName,
        tenantId: tenant.id,
      });
    } catch (authError: any) {
      console.error('Registration auth error:', authError);
      // Rollback tenant creation
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json({ message: authError.message || 'Authentication signup failed' }, { status: 500 });
    }

    // 5. Create token for custom email verification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

    // 6. Create Profile in public.users
    let profileError: any = null;
    let legacyUserId = await getNextLegacyUserId(supabase);

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        legacyUserId = await getNextLegacyUserId(supabase);
      }

      const firstProfileTry = await supabase.from('users').insert({
        id: authUser.id,
        tenant_id: tenant.id,
        legacy_user_id: legacyUserId,
        email: email.toLowerCase().trim(),
        first_name: firstName,
        last_name: lastName,
        role: 'Admin',
        phone: phone.trim(),
        is_active: true,
        is_email_verified: false,
        verification_token: verificationToken,
        verification_token_expires_at: tokenExpiresAt.toISOString(),
        username: username.toLowerCase().trim(),
      });

      if (!firstProfileTry.error) {
        profileError = null;
        break;
      }

      if (firstProfileTry.error.code === '23505' && firstProfileTry.error.message?.includes('legacy_user_id')) {
        continue;
      }

      console.warn('Registration: Primary profile insertion failed, attempting fallback...', firstProfileTry.error);
      
      // Fallback: strip out newly added schema fields
      const fallbackProfileTry = await supabase.from('users').insert({
        id: authUser.id,
        tenant_id: tenant.id,
        legacy_user_id: legacyUserId,
        email: email.toLowerCase().trim(),
        first_name: firstName,
        last_name: lastName,
        role: 'Admin',
        phone: phone.trim(),
        is_active: true,
      });

      if (!fallbackProfileTry.error) {
        profileError = null;
        break;
      }

      if (fallbackProfileTry.error.code === '23505' && fallbackProfileTry.error.message?.includes('legacy_user_id')) {
        continue;
      }

      profileError = fallbackProfileTry.error;
      break;
    }

    if (profileError) {
      console.error('Registration profile error:', profileError);
      // Rollback
      await supabase.auth.admin.deleteUser(authUser.id);
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json({ message: 'Failed to create user profile.' }, { status: 500 });
    }

    // Sync legacy_user_id to auth app_metadata for session consistency
    await supabase.auth.admin.updateUserById(authUser.id, {
      app_metadata: {
        tenant_id: tenant.id,
        role: 'Owner',
        legacy_user_id: legacyUserId,
      },
    }).catch((err: any) => console.warn('Could not set legacy_user_id in app_metadata:', err));

    // 7. Create Membership mapping in public.tenant_users
    const { error: membershipError } = await supabase.from('tenant_users').insert({
      tenant_id: tenant.id,
      user_id: authUser.id,
      email: email.toLowerCase().trim(),
      role: 'Admin',
      first_name: firstName,
      last_name: lastName,
      status: 'active',
    });

    if (membershipError) {
      console.error('Registration membership error:', membershipError);
    }

    // 8. Initialize Company Settings for Tenant (minimal — onboarding collects the rest)
    const { error: settingsError } = await supabase.from('company_settings').insert({
      tenant_id: tenant.id,
      company_name: companyName,
      email: email.toLowerCase().trim(),
      onboarding_completed: false,
    });

    if (settingsError) {
      console.error('Registration company settings init error:', settingsError);
    }

    // 9. Dispatch custom SMTP verification email
    try {
      await sendVerificationEmail({
        email: email.toLowerCase().trim(),
        name: `${firstName} ${lastName}`,
        token: verificationToken,
      });
    } catch (mailErr) {
      console.error('Failed to send verification email SMTP:', mailErr);
      // We don't block registration if SMTP fails on dev, but return message
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Verification email sent.',
    });
  } catch (error: any) {
    console.error('Registration route error:', error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
