'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Navigation } from '@/components/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, CheckCircle, Mail, ExternalLink } from 'lucide-react'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [signupComplete, setSignupComplete] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  })
  const [agreements, setAgreements] = useState({
    privacyPolicy: false,
    termsOfUse: false,
    eula: false,
    acceptableUse: false
  })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    // Check if all agreements are accepted
    if (!agreements.privacyPolicy || !agreements.termsOfUse || !agreements.eula || !agreements.acceptableUse) {
      toast.error('You must agree to all terms and policies to create an account')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        toast.success('Account created successfully!')
        setUserEmail(formData.email)
        setSignupComplete(true)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <div className="flex flex-1 items-center justify-center py-12 px-4">
        {signupComplete ? (
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center mb-4 text-green-500">
                <CheckCircle size={64} />
              </div>
              <h1 className="text-2xl font-semibold">Check Your Email</h1>
              <p className="text-base">
                We've sent a confirmation email to <span className="font-bold">{userEmail}</span>
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-2">Important:</h3>
                <p className="text-blue-700 text-sm">
                  Please check your inbox and click the confirmation link to activate your account. 
                  You won't be able to sign in until you confirm your email address.
                </p>
              </div>
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-500">
                  Didn't receive an email? Check your spam folder or try again.
                </p>
                <div className="space-x-3">
                  <Button variant="outline" onClick={() => setSignupComplete(false)}>
                    Go Back
                  </Button>
                  <Button onClick={() => router.push('/login')}>
                    Go to Login
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-4 text-center">
              <h1 className="text-2xl font-semibold">Create an account</h1>
              <p>
                Join Liva and start earning with your voice
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="text-sm font-medium">Legal Agreements</div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="privacy-policy" 
                      checked={agreements.privacyPolicy}
                      onCheckedChange={(checked: boolean) => 
                        setAgreements(prev => ({ ...prev, privacyPolicy: checked }))
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="privacy-policy"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                      >
                        I agree to the <Link href="https://app.termly.io/policy-viewer/policy.html?policyUUID=71d7e121-da10-46c9-b5f5-9397578a480b" target="_blank" className="text-primary hover:underline inline-flex items-center">Privacy Policy <ExternalLink className="h-3 w-3" /></Link>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms-of-use" 
                      checked={agreements.termsOfUse}
                      onCheckedChange={(checked: boolean) => 
                        setAgreements(prev => ({ ...prev, termsOfUse: checked }))
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="terms-of-use"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                      >
                        I agree to the <Link href="https://app.termly.io/policy-viewer/policy.html?policyUUID=1f9c2dc0-d885-46ac-8971-6a84adced52e" target="_blank" className="text-primary hover:underline inline-flex items-center">Terms of Use <ExternalLink className="h-3 w-3" /></Link>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="eula" 
                      checked={agreements.eula}
                      onCheckedChange={(checked: boolean) => 
                        setAgreements(prev => ({ ...prev, eula: checked }))
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="eula"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                      >
                        I agree to the <Link href="https://app.termly.io/policy-viewer/policy.html?policyUUID=6d297fad-15f6-4b9e-a83a-9d4466289824" target="_blank" className="text-primary hover:underline inline-flex items-center">End User License Agreement <ExternalLink className="h-3 w-3" /></Link>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="acceptable-use" 
                      checked={agreements.acceptableUse}
                      onCheckedChange={(checked: boolean) => 
                        setAgreements(prev => ({ ...prev, acceptableUse: checked }))
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="acceptable-use"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                      >
                        I agree to the <Link href="https://app.termly.io/policy-viewer/policy.html?policyUUID=1f8bce7b-f6c8-47ff-a4cd-e7d2708be99b" target="_blank" className="text-primary hover:underline inline-flex items-center">Acceptable Use Policy <ExternalLink className="h-3 w-3" /></Link>
                      </label>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full" variant="cta" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
        )}
      </div>
    </div>
  )
}
