'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
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
  approvedSubmissions: number
  pendingSubmissions: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    approvedSubmissions: 0,
    pendingSubmissions: 0,
  })
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardStats = useCallback(async () => {
    try {
      if (!user?.id) return

      const { data: balanceData } = await supabase
        .from('balances')
        .select('total_earned')
        .eq('user_id', user.id)
        .single()

      const { data: submissions } = await supabase
        .from('submissions')
        .select(`
          status,
          jobs (
            payment_amount
          )
        `)
        .eq('user_id', user.id)

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, description, type, category, payment_amount, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(6)

      const totalEarnings = submissions?.reduce((total, submission: any) => {
        return submission.status === 'approved' 
          ? total + (submission.jobs?.payment_amount || 0)
          : total
      }, 0) || 0

      setStats({
        totalEarnings: totalEarnings,
        approvedSubmissions: submissions?.filter(s => s.status === 'approved').length || 0,
        pendingSubmissions: submissions?.filter(s => s.status === 'submitted').length || 0,
      })

      setJobs(jobsData || [])
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchDashboardStats()
  }, [user, fetchDashboardStats])

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const createdAt = new Date(dateString)
    const diffHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return `${Math.floor(diffDays / 7)}w ago`
  }

  if (loading) {
    return (
      <div className="py-8 max-w-[900px] mx-auto px-4 grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[140px] bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="py-6 max-w-[1000px] mx-auto px-4">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-[#1a1a1a]">
          Welcome back, {user?.user_metadata?.full_name || 'User'}
        </h1>
        <p className="text-sm text-[#6d6d6d]">Here's your progress</p>
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {/* Earnings */}
        <div className="bg-[#FF6E35] text-white rounded-3xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm opacity-90">Earnings so far</h3>
            <p className="text-3xl font-bold mt-1">${stats.totalEarnings.toFixed(2)}</p>
          </div>
          <Button
            asChild
            className="mt-3 bg-white text-[#FF6E35] hover:bg-gray-100 rounded-full text-sm font-medium"
          >
            <Link href="/dashboard/earnings">Withdraw</Link>
          </Button>
        </div>

        {/* Pending Review */}
        <div className="bg-[#E661FF] text-white rounded-3xl p-4 flex flex-col justify-center">
          <h3 className="text-sm opacity-90">Pending Review</h3>
          <p className="text-3xl font-bold mt-1">{stats.pendingSubmissions}</p>
          <p className="text-xs opacity-80 mt-1">submissions</p>
        </div>

        {/* Accepted */}
        <div className="bg-[#00BDA6] text-white rounded-3xl p-4 flex flex-col justify-center">
          <h3 className="text-sm opacity-90">Accepted</h3>
          <p className="text-3xl font-bold mt-1">{stats.approvedSubmissions}</p>
          <p className="text-xs opacity-80 mt-1">submissions</p>
        </div>
      </div>

      {/* Featured Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Featured Tasks</h2>
          <Button asChild variant="link" className="text-[#FF6E35] p-0 h-auto">
            <Link href="/dashboard/jobs">View all</Link>
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200">
          {jobs.map((job, idx) => (
            <Link key={job.id} href={`/dashboard/jobs`}>
              <div
                className={`px-5 py-4 hover:bg-gray-50 transition ${
                  idx !== jobs.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-[#1a1a1a] line-clamp-1">
                    {job.title}
                  </h3>
                  <span className="text-xs font-semibold bg-[#FF6E35] text-white px-2 py-0.5 rounded-full">
                    ${job.payment_amount}
                  </span>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between text-xs text-[#6d6d6d]">
                  <span className="capitalize">{job.type}</span>
                  <span>{getTimeAgo(job.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
