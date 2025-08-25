'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { DollarSign, Clock, TrendingUp, ArrowUpRight, Mail } from 'lucide-react'

type WalletBalance = {
  available: number
  pending: number
  total_earned: number
}

type PayPalPayoutBody = {
  amount: number
  email: string
  user_id: string
}

export default function EarningsPage() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [paypalEmail, setPaypalEmail] = useState('')

  const fetchEarningsData = useCallback(async () => {
    try {
      // Get wallet balance (available and total_earned)
      const { data: walletData } = await supabase
        .from('wallet_balances')
        .select('available, total_earned')
        .eq('user_id', user?.id)
        .single()

      // Calculate pending from submissions directly
      const { data: pendingSubmissions } = await supabase
        .from('submissions')
        .select(`
          jobs (
            payment_amount
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'submitted')

      const pendingAmount = pendingSubmissions?.reduce((total, submission: any) => {
        return total + (submission.jobs?.payment_amount || 0)
      }, 0) || 0

      setBalance({
        available: walletData?.available || 0,
        pending: pendingAmount,
        total_earned: walletData?.total_earned || 0
      })
    } catch (error) {
      console.error('Error fetching earnings data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const checkPayPalConnection = useCallback(async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('paypal_email')
        .eq('id', user?.id)
        .single()
      if (profile?.paypal_email) setPaypalEmail(profile.paypal_email)
    } catch (error) {
      console.error('Error checking PayPal connection:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchEarningsData()
      checkPayPalConnection()
    }
  }, [user, fetchEarningsData])

  const requestPayout = async () => {
    const amount = parseFloat(payoutAmount)
    if (!amount || amount <= 0) return toast.error('Please enter a valid amount')
    if (!paypalEmail) return toast.error('Please enter your PayPal email')
    if (!balance || amount > balance.available) return toast.error('Insufficient available balance')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const body: PayPalPayoutBody = { amount, email: paypalEmail, user_id: user?.id || '' }
      await supabase.from('profiles').update({ paypal_email: paypalEmail }).eq('id', user?.id)

      const response = await fetch('/api/paypal/payout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error('Payout request failed')

      toast.success('Payout request submitted successfully!')
      setPayoutAmount('')
      fetchEarningsData()
    } catch (error) {
      console.error('Error requesting payout:', error)
      toast.error('Failed to request payout')
    }
  }

  if (loading) {
    return (
      <div className="py-8 max-w-[1000px] mx-auto px-4">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-8"></div>
        <div className="bg-white rounded-2xl border border-gray-200">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`px-5 py-4 animate-pulse ${i !== 2 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
                <div className="text-right">
                  <div className="h-4 w-16 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 max-w-[1000px] mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-[#1a1a1a]">
          ${balance?.total_earned?.toFixed(2) || '0.00'}
        </h1>
        <p className="text-sm text-[#6d6d6d]">Total Earnings</p>
      </div>

      {/* Earnings Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 mb-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#00BDA6]" />
            <span className="text-sm font-medium text-[#1a1a1a]">Available Balance</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#1a1a1a]">
              ${balance?.available?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-[#6d6d6d]">Ready for payout</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#E661FF]" />
            <span className="text-sm font-medium text-[#1a1a1a]">Pending</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#1a1a1a]">
              ${balance?.pending?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-[#6d6d6d]">Under review</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#FF6E35]" />
            <span className="text-sm font-medium text-[#1a1a1a]">Total Earned</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#1a1a1a]">
              ${balance?.total_earned?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-[#6d6d6d]">All-time</p>
          </div>
        </div>
      </div>

      {/* Payout Request */}
      <div className="max-w-sm mx-auto space-y-3">
        <h3 className="text-sm font-medium text-center text-[#1a1a1a]">Request Payout</h3>
        
        <Input
          type="email"
          placeholder="PayPal email"
          value={paypalEmail}
          onChange={(e) => setPaypalEmail(e.target.value)}
          className="rounded-full text-sm border-gray-200"
        />
        
        <Input
          type="number"
          placeholder="Amount"
          value={payoutAmount}
          onChange={(e) => setPayoutAmount(e.target.value)}
          className="rounded-full text-sm border-gray-200 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          max={balance?.available || 0}
          step="0.01"
          min="0"
        />
        
        <p className="text-xs text-[#6d6d6d] text-center">
          Available: ${balance?.available?.toFixed(2) || '0.00'}
        </p>

        <Button
          onClick={requestPayout}
          disabled={!payoutAmount || parseFloat(payoutAmount) <= 0}
          className="w-full rounded-full bg-[#FF6E35] hover:bg-[#e55a2b] text-white"
        >
          Request Payout
        </Button>
      </div>
    </div>
  )
}
