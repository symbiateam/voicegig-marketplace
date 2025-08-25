import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UpdateStatusRequest {
  submissionId: string
  status: 'approved' | 'rejected' | 'paid'
  rejectionReason?: string
}

async function sendNotificationEmail(
  userEmail: string,
  userName: string,
  jobTitle: string,
  template: 'submission_approved' | 'submission_rejected' | 'submission_paid',
  additionalData?: any
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userEmail,
        template,
        data: {
          userName,
          jobTitle,
          ...additionalData
        }
      })
    })

    if (!response.ok) {
      console.error('Failed to send notification email:', await response.text())
    }
  } catch (error) {
    console.error('Error sending notification email:', error)
  }
}

export async function POST(request: Request) {
  try {
    const { submissionId, status, rejectionReason }: UpdateStatusRequest = await request.json()

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get submission details with user and job info
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        user_id,
        status,
        jobs!inner (
          id,
          title,
          payment_amount
        ),
        profiles!inner (
          full_name,
          email
        )
      `)
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Update submission status
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        ...(rejectionReason && { rejection_reason: rejectionReason })
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Failed to update submission status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update submission status' },
        { status: 500 }
      )
    }

    // Handle different status updates
    const userEmail = (submission.profiles as any)?.email
    const userName = (submission.profiles as any)?.full_name
    const jobTitle = (submission.jobs as any)?.title
    const paymentAmount = (submission.jobs as any)?.payment_amount

    if (status === 'approved') {
      // Send approval email
      if (userEmail && userName && jobTitle) {
        await sendNotificationEmail(
          userEmail,
          userName,
          jobTitle,
          'submission_approved'
        )
      }
    } else if (status === 'rejected') {
      // Send rejection email
      if (userEmail && userName && jobTitle) {
        await sendNotificationEmail(
          userEmail,
          userName,
          jobTitle,
          'submission_rejected',
          { rejectionReason }
        )
      }
    } else if (status === 'paid') {
      // Add payment to ledger
      const { error: ledgerError } = await supabaseAdmin
        .from('ledger')
        .insert({
          user_id: submission.user_id,
          submission_id: submissionId,
          amount: paymentAmount,
          type: 'credit'
        })

      if (ledgerError) {
        console.error('Failed to add payment to ledger:', ledgerError)
        return NextResponse.json(
          { error: 'Failed to process payment' },
          { status: 500 }
        )
      }

      // Send payment confirmation email
      if (userEmail && userName && jobTitle) {
        await sendNotificationEmail(
          userEmail,
          userName,
          jobTitle,
          'submission_paid',
          { amount: paymentAmount }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Submission ${status} successfully`
    })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
