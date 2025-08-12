'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import {
  DollarSign,
  Briefcase,
  Upload,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

type DashboardStats = {
  totalEarnings: number
  availableBalance: number
  totalSubmissions: number
  approvedSubmissions: number
  rejectedSubmissions: number
  pendingSubmissions: number
  activeJobs: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    availableBalance: 0,
    totalSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
    pendingSubmissions: 0,
    activeJobs: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboardStats = useCallback(async () => {
    try {
      // Fetch wallet balance
      const { data: walletData } = await supabase
        .from('wallet_balances')
        .select('available, total_earned')
        .eq('user_id', user?.id)
        .single()

      // Fetch submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('status')
        .eq('user_id', user?.id)

      // Fetch active jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('status', 'open')

      // Calculate stats
      const totalEarnings = walletData?.total_earned || 0
      const availableBalance = walletData?.available || 0

      const totalSubmissions = submissions?.length || 0
      const approvedSubmissions = submissions?.filter(s => s.status === 'approved').length || 0
      const rejectedSubmissions = submissions?.filter(s => s.status === 'rejected').length || 0
      const pendingSubmissions = submissions?.filter(s => s.status === 'submitted').length || 0

      const activeJobs = jobs?.length || 0

      setStats({
        totalEarnings,
        availableBalance,
        totalSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        pendingSubmissions,
        activeJobs
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchDashboardStats()
    }
  }, [user, fetchDashboardStats])

  const completionRate = stats.totalSubmissions > 0
    ? Math.round((stats.approvedSubmissions / stats.totalSubmissions) * 100)
    : 0

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back {user?.user_metadata?.full_name }!
        </h1>
        <p className="text-muted-foreground">
          Here's your earnings and activity overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All-time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.availableBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Ready for payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Work submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              Available opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Your submission completion rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Completion Rate</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{stats.approvedSubmissions}</span>
                </div>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{stats.pendingSubmissions}</span>
                </div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">{stats.rejectedSubmissions}</span>
                </div>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your next task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/dashboard/jobs">
                <Briefcase className="mr-2 h-4 w-4" />
                Browse Available Jobs
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/submissions">
                <Upload className="mr-2 h-4 w-4" />
                View My Submissions
              </Link>
            </Button>

            {stats.availableBalance > 0 && (
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/earnings">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Request Payout
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest submissions and earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity yet.</p>
            <p className="text-sm">Start by browsing available jobs!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
