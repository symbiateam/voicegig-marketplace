import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    
    // Get the parameters from the URL
    const userId = url.searchParams.get('user_id')
    const email = url.searchParams.get('email')
    const verified = url.searchParams.get('verified') === 'true'
    
    if (!userId || !email) {
      console.error('Missing required parameters')
      return NextResponse.redirect(`${url.origin}/dashboard/profile?error=missing_params`)
    }
    
    // Update the user's profile with the PayPal email
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        paypal_email: email,
        paypal_verified: verified,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (updateError) {
      console.error('Failed to update profile with PayPal email:', updateError)
      return NextResponse.redirect(`${url.origin}/dashboard/profile?error=profile_update_failed`)
    }
    
    // Redirect back to the profile page with success message
    return NextResponse.redirect(`${url.origin}/dashboard/profile?paypal_connected=true`)
    
  } catch (error) {
    console.error('PayPal login callback error:', error)
    return NextResponse.redirect(`${new URL(request.url).origin}/dashboard/profile?error=login_processing_failed`)
  }
}
