// Local testing script for email notifications
// Run this with: node test-email-local.js

const testEmailNotification = async (submissionId, status, rejectionReason = null) => {
  try {
    const response = await fetch('http://localhost:3000/api/test-email', {
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

    const result = await response.json()
    console.log('📧 Test Result:', result)
  } catch (error) {
    console.error('❌ Test Error:', error)
  }
}

// Test different scenarios
console.log('🧪 Testing email notifications locally...\n')

// Test approval email
console.log('1. Testing APPROVED status:')
testEmailNotification('test-submission-1', 'approved')

setTimeout(() => {
  // Test rejection email
  console.log('\n2. Testing REJECTED status:')
  testEmailNotification('test-submission-2', 'rejected', 'Audio quality needs improvement')
}, 1000)

setTimeout(() => {
  // Test payment email
  console.log('\n3. Testing PAID status:')
  testEmailNotification('test-submission-3', 'paid')
}, 2000)

console.log('\n💡 Make sure your local dev server is running: bun run dev')
