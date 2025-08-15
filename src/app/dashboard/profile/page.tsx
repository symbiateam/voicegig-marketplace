'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Script from 'next/script'
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


export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [paypalAccount, setPaypalAccount] = useState<{email: string, verified: boolean} | null>(null)
  const [profileData, setProfileData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  })

  console.log("👤 Profile page loaded", { user: user?.id, email: user?.email });

  // Fetch user's payment accounts status
  const fetchAccountStatus = async () => {
    if (!user) return

    try {
      console.log("🔍 Fetching account status...");

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('paypal_email, paypal_verified')
        .eq('id', user.id)
        .single()

      console.log("📊 User profile query result:", { profiles, error });

      if (error) {
        console.error("Error fetching profile:", error)
        return
      }

      // Handle PayPal account
      if (profiles?.paypal_email) {
        setPaypalAccount({
          email: profiles.paypal_email,
          verified: profiles.paypal_verified || false
        })
      } else {
        setPaypalAccount(null);
      }
    } catch (error) {
      console.error('Error fetching PayPal account:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAccountStatus()
    }
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
                  <Label htmlFor="full_name">Your Name</Label>
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

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Connect your PayPal account to receive earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* PayPal account connection */}
            </div>
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
