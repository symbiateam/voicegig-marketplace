'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Navigation } from '@/components/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, CheckCircle, Mail } from 'lucide-react'

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
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4 text-green-500">
                <CheckCircle size={64} />
              </div>
              <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
              <CardDescription className="text-center text-base">
                We've sent a confirmation email to <span className="font-bold">{userEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
              </div>
              <CardTitle className="text-2xl text-center">Create an account</CardTitle>
              <CardDescription className="text-center">
                Join Liva and start earning with your voice
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
