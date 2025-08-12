'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  ArrowUpRight
} from 'lucide-react'

type WalletBalance = {
  available: number
  pending: number
  total_earned: number
}

type Payout = {
  id: string
  amount: number
  status: 'processing' | 'paid' | 'failed'
  created_at: string
  processed_at: string | null
}

export default function EarningsPage() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [stripeConnected, setStripeConnected] = useState(false)

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

  const checkStripeConnection = useCallback(async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user?.id)
        .single()

      setStripeConnected(!!profile?.stripe_account_id)
    } catch (error) {
      console.error('Error checking Stripe connection:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchEarningsData()
      checkStripeConnection()
    }
  }, [user, fetchEarningsData, checkStripeConnection])

  const connectStripe = async () => {
    setConnectingStripe(true)

    try {
      // Call edge function to create Stripe Connect account
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/stripe/connect-create-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create Stripe account')
      }

      // Get onboarding link
      const onboardResponse = await fetch('/api/stripe/connect-onboard-link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!onboardResponse.ok) {
        throw new Error('Failed to get onboarding link')
      }

      const { url } = await onboardResponse.json()

      // Redirect to Stripe onboarding
      window.open(url, '_blank')

      toast.success('Redirecting to Stripe setup...')
    } catch (error) {
      console.error('Error connecting Stripe:', error)
      toast.error('Failed to connect Stripe account')
    } finally {
      setConnectingStripe(false)
    }
  }

  const requestPayout = async () => {
    const amount = parseFloat(payoutAmount)

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!balance || amount > balance.available) {
      toast.error('Insufficient available balance')
      return
    }

    if (!stripeConnected) {
      toast.error('Please connect your Stripe account first')
      return
    }

    setRequestingPayout(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/stripe/cashout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_dollars: amount
        }),
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
    } finally {
      setRequestingPayout(false)
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
              Transfer your available balance to your bank account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!stripeConnected ? (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-lg font-medium mb-2">Connect Your Bank Account</h3>
                <p className="text-muted-foreground mb-4">
                  You need to connect your Stripe account to receive payouts.
                </p>
                <Button onClick={connectStripe} disabled={connectingStripe}>
                  {connectingStripe ? (
                    <>Connecting...</>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Connect Stripe Account
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center text-green-600 mb-4">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Stripe account connected</span>
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

                <Button
                  onClick={requestPayout}
                  disabled={requestingPayout || !payoutAmount || parseFloat(payoutAmount) <= 0}
                  className="w-full"
                >
                  {requestingPayout ? (
                    'Processing...'
                  ) : (
                    <>
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Request Payout
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>
              Track your payout requests and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payouts yet.</p>
                <p className="text-sm">Your payout history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between border rounded-lg p-4">
                    <div>
                      <div className="font-medium">${payout.amount.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      variant={
                        payout.status === 'paid' ? 'default' :
                        payout.status === 'processing' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {payout.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
// Clean file marker Tue Aug 12 03:03:15 UTC 2025
