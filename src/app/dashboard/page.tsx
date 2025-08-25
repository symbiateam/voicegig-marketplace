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

type Job = {
  id: string
  title: string
  description: string
  type: 'audio' | 'video'
  category?: string
  payment_amount: number
  created_at: string
}

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
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardStats = useCallback(async () => {
    try {
      if (!user?.id) return

      // Fetch user balance
      const { data: balanceData } = await supabase
        .from('balances')
        .select('available, total_earned')
        .eq('user_id', user.id)
        .single()

      // Fetch submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('status')
        .eq('user_id', user.id)

      // Fetch active jobs with full details
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, description, type, category, payment_amount, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(6)

      // Calculate stats
      const totalEarnings = balanceData?.total_earned || 0
      const availableBalance = balanceData?.available || 0

      const totalSubmissions = submissions?.length || 0
      const approvedSubmissions = submissions?.filter(s => s.status === 'approved').length || 0
      const rejectedSubmissions = submissions?.filter(s => s.status === 'rejected').length || 0
      const pendingSubmissions = submissions?.filter(s => s.status === 'submitted').length || 0

      const activeJobs = jobsData?.length || 0

      setStats({
        totalEarnings,
        availableBalance,
        totalSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        pendingSubmissions,
        activeJobs
      })
      
      setJobs(jobsData || [])
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

  // Helper functions
  const getCategoryEmoji = (category?: string, type?: string) => {
    switch (category) {
      case 'vacation':
        return '🌴';
      case 'nails':
        return '💅';
      case 'food':
        return '🍝';
      case 'skincare':
        return '🧴';
      case 'skateboarding':
        return '🛹';
      case 'furniture':
        return '🪑';
      case 'makeup':
        return '💄';
      case 'fitness':
        return '🏋️‍♀️';
      case 'tech':
        return '💻';
      default:
        return type === 'audio' ? '🎙️' : '📹';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const createdAt = new Date(dateString);
    const diffHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        const diffWeeks = Math.floor(diffDays / 7);
        return `${diffWeeks}w ago`;
      }
    }
  };

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
    <div className="py-4 max-w-[1300px] mx-auto px-4">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold mb-1 text-[#1a1a1a]">
          Welcome back, {user?.user_metadata?.full_name || 'User'}!
        </h1>
        <p className="text-[#6d6d6d] text-sm">
          Here's how your creative space is doing today
        </p>
      </div>

      {/* Main Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Earnings Card */}
        <div className="bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] rounded-2xl p-6 text-white">
          <div className="text-sm opacity-90 mb-2">All-time earnings</div>
          <div className="text-3xl font-bold mb-4">${stats.totalEarnings.toFixed(2)}</div>
          <Button 
            className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full px-6"
            size="sm"
          >
            Withdraw
          </Button>
        </div>

        {/* Ongoing Tasks */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="text-3xl font-bold text-[#1a1a1a] mb-2">{stats.activeJobs} ongoing</div>
          <Button 
            variant="link" 
            className="text-[#ff6b35] p-0 h-auto font-medium"
            asChild
          >
            <Link href="/dashboard/jobs">View new tasks</Link>
          </Button>
        </div>

        {/* Submissions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="text-3xl font-bold text-[#1a1a1a] mb-2">{stats.totalSubmissions} submissions</div>
          <Button 
            variant="link" 
            className="text-[#ff6b35] p-0 h-auto font-medium"
            asChild
          >
            <Link href="/dashboard/submissions">View submissions</Link>
          </Button>
        </div>
      </div>

      {/* Ready to earn today section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">Ready to earn today?</h2>
            <p className="text-sm text-[#6d6d6d]">Hot right now!! Grab these before they're gone</p>
          </div>
          <Button 
            variant="link" 
            className="text-[#ff6b35] p-0 h-auto font-medium"
            asChild
          >
            <Link href="/dashboard/jobs">View all tasks</Link>
          </Button>
        </div>
        
        {/* Featured Jobs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/dashboard/jobs`}>
              <div className="bg-white rounded-xl border border-[#d1d1d1] border-dashed p-3 h-[150px] cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">{getCategoryEmoji(job.category, job.type)}</div>
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-[#1a1a1a]">
                  {job.title.trim()}
                </h3>
                <div className="flex items-center justify-between mt-3">
                  <div className="bg-[#00b286] flex items-center gap-1 px-2 py-0.5 rounded-lg text-white text-xs font-medium">
                    ${job.payment_amount}
                  </div>
                  <span className="text-[10px] text-[#6d6d6d]">{getTimeAgo(job.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
