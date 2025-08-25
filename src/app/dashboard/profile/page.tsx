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
    <div className="py-6 max-w-[1000px] mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-[#1a1a1a]">Profile Settings</h1>
        <p className="text-sm text-[#6d6d6d]">Manage your account settings and payment preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#FF6E35]" />
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Personal Information</h2>
          </div>
          <p className="text-sm text-[#6d6d6d] mb-6">Update your personal details and contact information</p>
          
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium text-[#1a1a1a]">Your Name</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    full_name: e.target.value
                  }))}
                  placeholder="Enter your full name"
                  className="rounded-full border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#1a1a1a]">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="rounded-full border-gray-200 bg-gray-50"
                />
                <p className="text-xs text-[#6d6d6d]">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="rounded-full bg-[#FF6E35] hover:bg-[#e55a2b] text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Profile
            </Button>
          </form>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-[#FF6E35]" />
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Payment Methods</h2>
          </div>
          <p className="text-sm text-[#6d6d6d] mb-6">Connect your PayPal account to receive earnings</p>
          
          <div className="space-y-4">
            {paypalAccount ? (
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">PayPal Account</p>
                    <p className="text-xs text-[#6d6d6d]">{paypalAccount.email}</p>
                  </div>
                </div>
                <Badge variant={paypalAccount.verified ? "default" : "secondary"} className="rounded-full">
                  {paypalAccount.verified ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[#6d6d6d] mb-4">No payment method connected</p>
                <p className="text-xs text-[#6d6d6d]">Add your PayPal email in the earnings section to receive payments</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-[#FF6E35]" />
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Account Actions</h2>
          </div>
          <p className="text-sm text-[#6d6d6d] mb-6">Additional account management options</p>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl">
            <div>
              <h4 className="text-sm font-medium text-[#1a1a1a]">Change Password</h4>
              <p className="text-xs text-[#6d6d6d]">Update your account password for security</p>
            </div>
            <Button 
              variant="outline" 
              className="rounded-full border-gray-200"
              onClick={() => {
                supabase.auth.resetPasswordForEmail(user?.email || '')
                toast.success('Password reset email sent!')
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Reset Password
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
