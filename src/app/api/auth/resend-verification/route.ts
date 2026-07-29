import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/server/supabase/admin';
import { sendVerificationEmail } from '@/server/mail/verification';
import crypto from 'crypto';

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid email address' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const supabase = getSupabaseAdminClient();

    // Find the user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, is_email_verified')
      .eq('email', email)
      .maybeSingle();

    if (findError) {
      console.error('Resend verification find user error:', findError);
      return NextResponse.json({ message: 'Database query failed' }, { status: 500 });
    }

    if (!user) {
      // Return 200 to prevent user enumeration, but in custom admin flow we can be friendly
      return NextResponse.json({
        success: true,
        message: 'If the account exists, a new verification link has been sent.',
      });
    }

    if (user.is_email_verified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: 'This email is already verified. Please sign in.',
      });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_token: verificationToken,
        verification_token_expires_at: tokenExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update verification token:', updateError);
      return NextResponse.json({ message: 'Failed to update token' }, { status: 500 });
    }

    // Dispatch verification email
    try {
      await sendVerificationEmail({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        token: verificationToken,
      });
    } catch (mailErr) {
      console.error('Resend verification email SMTP failure:', mailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'A new verification link has been sent to your email.',
    });
  } catch (error: any) {
    console.error('Resend verification route error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
