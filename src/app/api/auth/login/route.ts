import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { loginSchema } from '@/server/validation/auth';
import { loginUser } from '@/server/auth/service';

export const POST = withApiHandler(async (request, context) => {
  const payload = loginSchema.parse(await request.json());
  
  try {
    const result = await loginUser({
      ...payload,
      request,
      requestId: context.requestId,
    });

    return NextResponse.json({
      message: 'Login successful',
      token: result.accessToken,
      accessToken: result.accessToken,
      user: result.user,
      requiresOnboarding: result.requiresOnboarding ?? false,
    });
  } catch (error: any) {
    if (error.message === 'EMAIL_NOT_VERIFIED') {
      return NextResponse.json({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Your email address has not been verified yet.',
      }, { status: 401 });
    }
    throw error;
  }
});
