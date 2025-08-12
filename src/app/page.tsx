import { redirect } from 'next/navigation'

export default function LandingPage() {
  // Redirect to login page immediately
  redirect('/login')
  
  // This code won't run due to the redirect, but is needed for TypeScript
  return null
}