'use client'

import React, { useState, useEffect, useCallback, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { User, Mail, Settings, Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  })


  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: profileData.full_name } })
      if (error) throw error

      await supabase.from('profiles').upsert({
        id: user?.id,
        full_name: profileData.full_name,
        email: profileData.email,
        updated_at: new Date().toISOString(),
      })

      updateProfile?.({ full_name: profileData.full_name })
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-6 max-w-[900px] mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-[#1a1a1a]">Profile</h1>
        <p className="text-sm text-[#6d6d6d]">Manage your account information</p>
      </div>

      {/* Single flat container with only dividers */}
      <div className="bg-white border border-gray-200 rounded-2xl">
        {/* Personal information */}
        <section className="px-5 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-[#FF6E35]" />
            <h2 className="text-sm font-semibold text-[#1a1a1a]">Personal information</h2>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Your name"
                value={profileData.full_name}
                onChange={(e) => setProfileData(p => ({ ...p, full_name: e.target.value }))}
                className="h-10 rounded-full"
              />
              <Input
                type="email"
                value={profileData.email}
                disabled
                className="h-10 rounded-full bg-gray-50"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-10 rounded-full bg-[#FF6E35] hover:bg-[#e55a2b] text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </section>

        {/* Account actions */}
        <section className="px-5 py-5 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-5 w-5 text-[#FF6E35]" />
            <h2 className="text-sm font-semibold text-[#1a1a1a]">Account</h2>
          </div>

          <div className="divide-y">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">Change password</p>
                <p className="text-xs text-[#6d6d6d]">Receive a reset link via email</p>
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-full border-gray-200"
                onClick={() => {
                  supabase.auth.resetPasswordForEmail(user?.email || '')
                  toast.success('Password reset email sent!')
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send link
              </Button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-red-900">Sign out</p>
                <p className="text-xs text-red-700">Log out of your account</p>
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-full border-red-200 text-red-700 hover:bg-red-100"
                onClick={async () => {
                  await supabase.auth.signOut()
                  toast.success('Signed out')
                  window.location.href = '/login'
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
