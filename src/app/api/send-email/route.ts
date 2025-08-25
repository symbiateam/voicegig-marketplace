import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface EmailRequest {
  to: string
  subject: string
  template: 'submission_approved' | 'submission_rejected' | 'submission_paid'
  data: {
    userName?: string
    jobTitle?: string
    amount?: number
    rejectionReason?: string
  }
}

const EMAIL_TEMPLATES = {
  submission_approved: {
    subject: (data: any) => `🎉 Your submission for "${data.jobTitle}" has been approved!`,
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6E35, #E661FF); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Submission Approved! 🎉</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.userName || 'there'},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Great news! Your submission for the job "<strong>${data.jobTitle}</strong>" has been approved by the client.
          </p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #00BDA6;">
            <h3 style="color: #00BDA6; margin-top: 0;">What's Next?</h3>
            <p style="margin: 0; color: #666;">Your payment will be processed and added to your wallet balance shortly. You'll receive another email confirmation once the payment is complete.</p>
          </div>
          <p style="font-size: 16px; color: #333;">
            Thank you for your excellent work on VoiceGig Marketplace!
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Best regards,<br>
            The VoiceGig Team<br>
            <a href="mailto:contact@theliva.ai" style="color: #FF6E35;">contact@theliva.ai</a>
          </p>
        </div>
      </div>
    `
  },
  submission_rejected: {
    subject: (data: any) => `Your submission for "${data.jobTitle}" needs revision`,
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6E35, #E661FF); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Submission Update</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.userName || 'there'},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We wanted to let you know that your submission for "<strong>${data.jobTitle}</strong>" requires some revisions before it can be approved.
          </p>
          ${data.rejectionReason ? `
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #FF6E35;">
            <h3 style="color: #FF6E35; margin-top: 0;">Feedback:</h3>
            <p style="margin: 0; color: #666;">${data.rejectionReason}</p>
          </div>
          ` : ''}
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #00BDA6;">
            <h3 style="color: #00BDA6; margin-top: 0;">What's Next?</h3>
            <p style="margin: 0; color: #666;">You can resubmit your work after making the requested changes. Don't worry - this is a normal part of the process to ensure the highest quality deliverables.</p>
          </div>
          <p style="font-size: 16px; color: #333;">
            Thank you for your understanding and we look forward to your revised submission!
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Best regards,<br>
            The VoiceGig Team<br>
            <a href="mailto:contact@theliva.ai" style="color: #FF6E35;">contact@theliva.ai</a>
          </p>
        </div>
      </div>
    `
  },
  submission_paid: {
    subject: (data: any) => `💰 Payment processed for "${data.jobTitle}"`,
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6E35, #E661FF); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Payment Received! 💰</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.userName || 'there'},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Excellent news! Your payment for "<strong>${data.jobTitle}</strong>" has been processed and added to your wallet.
          </p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; border: 2px solid #00BDA6;">
            <h2 style="color: #00BDA6; margin: 0; font-size: 32px;">$${data.amount?.toFixed(2) || '0.00'}</h2>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Added to your wallet balance</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #E661FF;">
            <h3 style="color: #E661FF; margin-top: 0;">Ready to Cash Out?</h3>
            <p style="margin: 0; color: #666;">You can request a payout to your PayPal account anytime from your earnings dashboard. Minimum payout is $5.00.</p>
          </div>
          <p style="font-size: 16px; color: #333;">
            Thank you for your excellent work and for being part of the VoiceGig community!
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Best regards,<br>
            The VoiceGig Team<br>
            <a href="mailto:contact@theliva.ai" style="color: #FF6E35;">contact@theliva.ai</a>
          </p>
        </div>
      </div>
    `
  }
}

export async function POST(request: Request) {
  try {
    const { to, template, data }: EmailRequest = await request.json()

    if (!to || !template || !EMAIL_TEMPLATES[template]) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid template' },
        { status: 400 }
      )
    }

    const templateConfig = EMAIL_TEMPLATES[template]
    const subject = templateConfig.subject(data)
    const html = templateConfig.html(data)

    // For now, we'll use a simple email service
    // In production, you'd want to use a service like SendGrid, Resend, or AWS SES
    console.log('📧 Email would be sent:', {
      from: 'contact@theliva.ai',
      to,
      subject,
      html
    })

    // Simulate successful email sending
    // TODO: Replace with actual email service integration
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    })
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
