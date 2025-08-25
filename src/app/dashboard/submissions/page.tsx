'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  Mic2,
  XCircle,
  Upload,
  Video,
  DollarSign
} from 'lucide-react'

type Submission = {
  id: string
  job_id: string
  file_url: string
  file_type: string
  status: 'submitted' | 'approved' | 'rejected'
  notes: string | null
  created_at: string
  updated_at: string
  jobs: {
    title: string
    type: 'audio' | 'video'
    payment_amount: number
  } | null
}

const STATUS_META: Record<Submission['status'], { label: string; tint: string; pill: string; icon: JSX.Element }> = {
  approved: {
    label: 'Accepted',
    tint: 'text-[var(--category-video)]',
    pill: 'bg-[var(--category-video)]/10 text-[var(--category-video)]',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  submitted: {
    label: 'Pending Review',
    tint: 'text-[var(--category-casual)]',
    pill: 'bg-[var(--category-casual)]/20 text-[var(--category-casual)]',
    icon: <Clock className="h-4 w-4" />,
  },
  rejected: {
    label: 'Rejected',
    tint: 'text-[var(--category-emotion)]',
    pill: 'bg-[var(--category-emotion)]/10 text-[var(--category-emotion)]',
    icon: <XCircle className="h-4 w-4" />,
  },
}

export default function SubmissionsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState<'all' | Submission['status']>('all')

  const fetchSubmissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`*, jobs ( title, type, payment_amount )`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchSubmissions()
  }, [user, fetchSubmissions])

  const counts = useMemo(() => ({
    approved: submissions.filter(s => s.status === 'approved').length,
    submitted: submissions.filter(s => s.status === 'submitted').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }), [submissions])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return submissions.filter(s => {
      const matchesTab = tab === 'all' ? true : s.status === tab
      const title = s.jobs?.title?.toLowerCase() || ''
      const statusTxt = s.status.toLowerCase()
      const typeTxt = s.jobs?.type || ''
      const matchesSearch = !q || title.includes(q) || statusTxt.includes(q) || typeTxt.includes(q)
      return matchesTab && matchesSearch
    })
  }, [submissions, searchQuery, tab])

  if (loading) {
    return (
      <div className="py-4 max-w-[900px] mx-auto px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg mb-3" />
        ))}
      </div>
    )
  }

  return (
    <div className="py-4 max-w-[900px] mx-auto px-4">
      <div className="mb-5 text-center">
        <h1 className="text-[28px] font-bold mb-1 text-[#1a1a1a]">Your submissions</h1>
        <p className="text-[#6d6d6d] text-sm">Hot right now!! Grab these before they're gone</p>
      </div>

      {/* Tabs styled with category colors */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-6">
        <TabsList className="flex gap-2 w-full justify-center bg-[var(--light-background)] p-1 rounded-full">
          <TabsTrigger value="all" className="px-4 py-1.5 rounded-full text-sm font-medium data-[state=active]:bg-[var(--category-default)] data-[state=active]:text-white text-[var(--light-text)]">
            All ({submissions.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="px-4 py-1.5 rounded-full text-sm font-medium data-[state=active]:bg-[var(--category-video)] data-[state=active]:text-white text-[var(--light-text)]">
            Accepted ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="submitted" className="px-4 py-1.5 rounded-full text-sm font-medium data-[state=active]:bg-[var(--category-casual)] data-[state=active]:text-white text-[var(--light-text)]">
            Pending ({counts.submitted})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="px-4 py-1.5 rounded-full text-sm font-medium data-[state=active]:bg-[var(--category-emotion)] data-[state=active]:text-white text-[var(--light-text)]">
            Rejected ({counts.rejected})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-[#1a1a1a] mb-1">No submissions yet</h3>
          <p className="text-sm text-[#6d6d6d] mb-4">Start by browsing available jobs and submitting your work.</p>
          <Button asChild className="rounded-full bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white">
            <Link href="/dashboard/jobs">Browse Jobs</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const meta = STATUS_META[s.status]
            return (
              <div
                key={s.id}
                className="flex items-center justify-between bg-white border border-[var(--border-color)] rounded-lg px-4 py-3 hover:bg-[var(--card-hover)] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">
                    {s.jobs?.type === 'audio' ? <Mic2 className="h-5 w-5 text-[var(--category-audio)]" /> : <Video className="h-5 w-5 text-[var(--category-video)]" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#1a1a1a]">{s.jobs?.title || 'Untitled job'}</h3>
                    <div className="text-xs text-[var(--light-text)] flex gap-2">
                      <span>${s.jobs?.payment_amount ?? '-'}</span>
                      <span>•</span>
                      <span>1 min</span>
                      <span>•</span>
                      <span className="capitalize">{s.jobs?.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${meta.pill}`}>
                    {meta.icon}
                    {meta.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}