import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, token, type = 'email' } = await request.json();

    // Validation
    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Verify OTP with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: type === 'signup' ? 'signup' : 'email',
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return NextResponse.json({
      message: 'Verification successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name,
        role: profile?.role || data.user.user_metadata?.role,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
