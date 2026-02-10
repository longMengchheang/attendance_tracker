import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Determine the redirect URL
    // In production, this should be your production URL
    // In development, it's localhost:3000
    // Determine the redirect URL
    const origin = request.headers.get('origin');
    const redirectTo = `${origin}/reset-password`;

    // =========================================================================
    // DUMMY RESET PASSWORD (FOR TESTING) - USES ADMIN API & LOGS CODE
    // =========================================================================
    /* 
       NOTES:
       - This block uses `supabaseAdmin.auth.admin.generateLink` with `magiclink` type.
       - It logs the 6-8 digit OTP (email_otp) to the terminal.
       - The user enters this code in the same tab.
       - DELETE or COMMENT OUT this block when moving to production.
    */

    // Using 'magiclink' because it returns a 6-8 digit OTP (email_otp) which supports the "Enter Code" flow better than 'recovery'
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Log the Recovery Code to the console
    console.log('GenerateLink (MagicLink) Response Data:', JSON.stringify(data, null, 2));

    if (data.properties?.email_otp) {
        console.log('\n================================================================');
        console.log(`🔐 DUMMY RECOVERY CODE FOR ${email}: ${data.properties.email_otp}`);
        console.log('================================================================\n');
    } else if (data.properties?.action_link) {
        // Fallback if no OTP is returned (though magiclink usually does)
        console.log('\n================================================================');
        console.log(`🔐 DUMMY RECOVERY LINK FOR ${email}:`);
        console.log(data.properties.action_link);
        console.log('================================================================\n');
    }

    // =========================================================================
    // END DUMMY RESET PASSWORD
    // =========================================================================


    // =========================================================================
    // PRODUCTION RESET PASSWORD (UNCOMMENT WHEN READY FOR PRODUCTION)
    // =========================================================================
    /*
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    */
    // =========================================================================
    // END PRODUCTION RESET PASSWORD
    // =========================================================================

    return NextResponse.json({
      message: 'Password reset link sent to your email (Check terminal for dummy link)',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
