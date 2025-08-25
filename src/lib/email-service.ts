// Email service utility for sending notifications
export async function sendSubmissionNotification(
  submissionId: string,
  status: 'approved' | 'rejected' | 'paid',
  rejectionReason?: string
) {
  try {
    const response = await fetch('/api/submissions/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submissionId,
        status,
        rejectionReason
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to update submission status: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating submission status:', error)
    throw error
  }
}

// Helper function to trigger email when submission status changes
export async function notifySubmissionStatusChange(
  submissionId: string,
  newStatus: 'approved' | 'rejected' | 'paid',
  rejectionReason?: string
) {
  return sendSubmissionNotification(submissionId, newStatus, rejectionReason)
}
