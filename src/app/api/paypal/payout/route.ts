import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import fetch from 'node-fetch'

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PayPal SDK setup
const base = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com'

// Get PayPal access token
async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64')

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  const data = await response.json()
  return data.access_token
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const { amount, email, user_id } = await request.json()
    
    // Validate required fields
    if (!amount || !email || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique IDs for this payout
    const batchId = `PAYOUT_${uuidv4()}_${Date.now()}`
    const itemId = `ITEM_${uuidv4()}_${Date.now()}`

    // Calculate balance directly from ledger table to bypass RLS on wallet_balances view
    const { data: ledgerData, error: balanceError } = await supabaseAdmin
      .from('ledger')
      .select('amount, type')
      .eq('user_id', user_id)

    if (balanceError) {
      console.error('Failed to get wallet balance:', balanceError)
      return NextResponse.json(
        { error: 'Failed to access wallet' },
        { status: 500 }
      )
    }

    // Calculate available balance from ledger entries
    const credits = ledgerData?.filter(entry => entry.type === 'credit')
      .reduce((sum, entry) => sum + parseFloat(entry.amount), 0) || 0
    const debits = ledgerData?.filter(entry => entry.type === 'debit')
      .reduce((sum, entry) => sum + parseFloat(entry.amount), 0) || 0
    const availableBalance = credits - debits

    // Check if sufficient funds
    if (availableBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      )
    }

    // Record debit transaction in ledger instead of updating balances table
    const { error: deductionError } = await supabaseAdmin
      .from('ledger')
      .insert({
        user_id: user_id,
        amount: amount,
        type: 'debit'
      })

    if (deductionError) {
      console.error('Failed to update wallet balance:', deductionError)
      return NextResponse.json(
        { error: 'Failed to update wallet balance' },
        { status: 500 }
      )
    }

    // Get PayPal access token
    const accessToken = await getAccessToken()

    // Create PayPal payout
    const payoutResponse = await fetch(`${base}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: batchId,
          email_subject: 'You have a payout from VoiceGig Marketplace',
          email_message: 'Your earnings have been sent to your PayPal account',
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: amount.toString(),
              currency: 'USD',
            },
            receiver: email,
            note: 'Thanks for your work on VoiceGig Marketplace!',
            sender_item_id: itemId,
          },
        ],
      }),
    })

    const payoutData = await payoutResponse.json()

    // Check if payout was successful
    if (!payoutResponse.ok) {
      console.error('PayPal payout error:', payoutData)
      // If PayPal payout failed, refund by adding credit back to ledger
      const { error: refundError } = await supabaseAdmin
        .from('ledger')
        .insert({
          user_id: user_id,
          amount: amount,
          type: 'credit'
        })

      if (refundError) {
        console.error('Failed to refund wallet after PayPal error:', refundError)
      }
      return NextResponse.json(
        { error: payoutData.message || 'PayPal payout failed' },
        { status: payoutResponse.status }
      )
    }

    // Record payout in database
    const { error: payoutRecordError } = await supabaseAdmin
      .from('payouts')
      .insert({
        user_id: user_id,
        amount: amount,
        status: 'processing',
        payout_method: 'paypal',
        payout_email: email,
        payout_id: payoutData.batch_header?.payout_batch_id,
        external_id: batchId,
      })

    if (payoutRecordError) {
      console.error('Failed to record payout:', payoutRecordError)
      // Continue since money is already sent
    }

    return NextResponse.json({
      success: true,
      payout_id: payoutData.batch_header?.payout_batch_id,
      status: payoutData.batch_header?.batch_status,
    })
  } catch (error) {
    console.error('Payout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
