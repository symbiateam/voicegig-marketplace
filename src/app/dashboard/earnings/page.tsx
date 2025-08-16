'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Mail
} from 'lucide-react'

type WalletBalance = {
  available: number
  pending: number
  total_earned: number
}

type Payout = {
  id: string
  user_id: string
  amount: number
  status: string
  created_at: string
  payout_method?: string
  payout_email?: string
  payout_id?: string
}



type PayPalPayoutBody = {
  amount: number
  email: string
  user_id: string
}

export default function EarningsPage() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [paypalEmail, setPaypalEmail] = useState('')

  const fetchEarningsData = useCallback(async () => {
    try {
      // Fetch wallet balance
      const { data: walletData } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      // Fetch payouts
      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      setBalance(walletData)
      setPayouts(payoutsData || [])
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

      if (profile?.paypal_email) {
        setPaypalEmail(profile.paypal_email)
      }
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

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!paypalEmail) {
      toast.error('Please enter your PayPal email')
      return
    }

    if (!balance || amount > balance.available) {
      toast.error('Insufficient available balance')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const endpoint = '/api/paypal/payout'
      const body: PayPalPayoutBody = {
        amount: amount,
        email: paypalEmail,
        user_id: user?.id || ''
      }

      // Save PayPal email to profile if it's new or changed
      await supabase
        .from('profiles')
        .update({ paypal_email: paypalEmail })
        .eq('id', user?.id)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Payout request failed')
      }

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
      <div className="container py-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8"></div>
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Earnings</h1>
        <p className="text-muted-foreground">
          Track your earnings and request payouts.
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${balance?.available?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Ready for payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${balance?.pending?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Under review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${balance?.total_earned?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              All-time earnings
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Payout Request */}
        <Card>
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
            <CardDescription>
              Transfer your available balance to your PayPal account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 mb-4">
              <div>
                <div className="space-y-2 mb-4">
                  <Label>Payout Method</Label>
                  <div className="flex items-center space-x-2 p-2 border rounded-md">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>PayPal</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal-email">PayPal Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="paypal-email"
                      type="email"
                      placeholder="your-email@example.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Payout Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="pl-9"
                    max={balance?.available || 0}
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Available: ${balance?.available?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            <Button
              onClick={requestPayout}
              disabled={!payoutAmount || parseFloat(payoutAmount) <= 0}
              className="w-full"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </CardContent>
        </Card>

        {/* Payout History section removed as requested */}
      </div>
    </div>
  )
}
