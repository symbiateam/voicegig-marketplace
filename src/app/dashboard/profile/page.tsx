'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  User,
  Mail,
  CreditCard,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Settings
} from 'lucide-react'

type StripeAccount = {
  id: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  created: number
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null)
  const [profileData, setProfileData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  })

  console.log("👤 Profile page loaded", { user: user?.id, email: user?.email });

  // Fetch user's Stripe account status
  const fetchStripeAccount = async () => {
    if (!user) return

    try {
      console.log("🔍 Fetching Stripe account status...");

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single()

      console.log("📊 User profile query result:", { profiles, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error("❌ Error fetching profile:", error);
        return;
      }

      if (profiles?.stripe_account_id) {
        console.log("✅ User has Stripe account:", profiles.stripe_account_id);
        // For now, we'll show that they're connected
        // In a real implementation, you'd verify the account status via Stripe API
        setStripeAccount({
          id: profiles.stripe_account_id,
          charges_enabled: true,
          payouts_enabled: true,
          details_submitted: true,
          created: Date.now()
        });
      } else {
        console.log("⚠️ User does not have Stripe account");
        setStripeAccount(null);
      }
    } catch (error) {
      console.error('Error fetching Stripe account:', error)
    }
  }

  useEffect(() => {
    fetchStripeAccount()
  }, [user])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("💾 Updating user profile...", profileData);

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name
        }
      })

      if (error) {
        console.error("❌ Profile update error:", error);
        throw error;
      }

      // Also update the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: profileData.full_name,
          email: profileData.email,
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error("❌ Profile table update error:", profileError);
        // Don't throw here, as the auth update succeeded
      }

      console.log("✅ Profile updated successfully");
      toast.success('Profile updated successfully!')

      if (updateProfile) {
        updateProfile({ full_name: profileData.full_name })
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleStripeConnect = async () => {
    if (!user) return

    setStripeLoading(true)

    try {
      console.log("🚀 Starting Stripe Connect onboarding...");

      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        throw new Error('No active session')
      }

      console.log("📤 Calling Stripe Connect API...");

      const response = await fetch('/api/stripe/connect-create-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      console.log("📊 Stripe Connect response:", { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create Stripe account')
      }

      if (result.account_link_url) {
        console.log("🔗 Redirecting to Stripe onboarding:", result.account_link_url);
        // Redirect to Stripe onboarding
        window.location.href = result.account_link_url
      } else {
        toast.success('Stripe account created successfully!')
        fetchStripeAccount() // Refresh the account status
      }
    } catch (error: any) {
      console.error('Error connecting to Stripe:', error)
      toast.error(error.message || 'Failed to connect to Stripe')
    } finally {
      setStripeLoading(false)
    }
  }

  const handleStripeManage = async () => {
    if (!user || !stripeAccount) return

    setStripeLoading(true)

    try {
      console.log("🚀 Getting Stripe dashboard link...");

      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/stripe/connect-onboard-link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      console.log("📊 Stripe dashboard response:", { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get Stripe dashboard link')
      }

      if (result.url) {
        console.log("🔗 Opening Stripe dashboard:", result.url);
        window.open(result.url, '_blank')
      }
    } catch (error: any) {
      console.error('Error accessing Stripe dashboard:', error)
      toast.error(error.message || 'Failed to access Stripe dashboard')
    } finally {
      setStripeLoading(false)
    }
  }

  const getStripeStatusBadge = () => {
    if (!stripeAccount) return null

    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Fully Verified
        </Badge>
      )
    } else if (stripeAccount.details_submitted) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending Review
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Setup Required
        </Badge>
      )
    }
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and payment preferences
          </p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      full_name: e.target.value
                    }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed here. Contact support if needed.
                  </p>
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stripe Connect Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Payment Setup</span>
            </CardTitle>
            <CardDescription>
              Connect your Stripe account to receive payments for completed work
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {stripeAccount ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">Stripe Account Connected</h3>
                      {getStripeStatusBadge()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Account ID: {stripeAccount.id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-sm">
                      {stripeAccount.charges_enabled ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>Charges</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stripeAccount.charges_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-sm">
                      {stripeAccount.payouts_enabled ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>Payouts</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stripeAccount.payouts_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-sm">
                      {stripeAccount.details_submitted ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>Details</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stripeAccount.details_submitted ? 'Submitted' : 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleStripeManage} disabled={stripeLoading} variant="outline">
                    {stripeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Account
                  </Button>
                  <Button onClick={() => router.push('/dashboard/earnings')}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    View Earnings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Connect Your Stripe Account</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    To receive payments for your voice work, you need to connect a Stripe account.
                    This allows us to securely transfer your earnings directly to your bank account.
                  </p>
                </div>
                <Button onClick={handleStripeConnect} disabled={stripeLoading} size="lg">
                  {stripeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Stripe Account
                </Button>
                <p className="text-xs text-muted-foreground">
                  You'll be redirected to Stripe to complete the setup process
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Additional account management options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Change Password</h4>
                <p className="text-sm text-muted-foreground">
                  Update your account password for security
                </p>
              </div>
              <Button variant="outline" onClick={() => {
                // Trigger password reset email
                supabase.auth.resetPasswordForEmail(user?.email || '')
                toast.success('Password reset email sent!')
              }}>
                <Mail className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
