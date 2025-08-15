import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Get the query parameters from the request URL
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const userId = searchParams.get('state');

  if (!code || !userId) {
    return NextResponse.redirect(new URL('/dashboard/profile?error=missing_params', request.url));
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Exchange the authorization code for tokens
    const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for tokens:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/dashboard/profile?error=token_exchange', request.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from PayPal
    const userInfoResponse = await fetch('https://api-m.paypal.com/v1/identity/openidconnect/userinfo?schema=openid', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info:', await userInfoResponse.text());
      return NextResponse.redirect(new URL('/dashboard/profile?error=user_info', request.url));
    }

    const userInfo = await userInfoResponse.json();
    
    // Update the user's profile with PayPal information
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        paypal_email: userInfo.email,
        paypal_verified: userInfo.verified_account === 'true',
        paypal_account_id: userInfo.payer_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.redirect(new URL('/dashboard/profile?error=db_update', request.url));
    }

    // Redirect back to the profile page with success message
    return NextResponse.redirect(new URL('/dashboard/profile?success=paypal_connected', request.url));
  } catch (error) {
    console.error('Error in PayPal callback:', error);
    return NextResponse.redirect(new URL('/dashboard/profile?error=server_error', request.url));
  }
}
