import { NextResponse } from 'next/server'
import { notifySubmissionStatusChange } from '@/lib/email-service'

export async function POST(request: Request) {
  try {
    const { submissionId, status, rejectionReason } = await request.json()

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: 'Missing submissionId or status' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing email notification:', { submissionId, status, rejectionReason })

    // Call the email service directly for local testing
    const result = await notifySubmissionStatusChange(submissionId, status, rejectionReason)

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      result
    })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
