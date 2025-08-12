'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import {
  Upload,
  Mic2,
  Video,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileAudio,
  FileVideo,
  ExternalLink
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

export default function SubmissionsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubmissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          jobs (
            title,
            type,
            payment_amount
          )
        `)
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
    if (user) {
      fetchSubmissions()
    }
  }, [user, fetchSubmissions])

  const displaySubmissions = submissions

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'
      case 'rejected':
        return 'destructive'
      case 'submitted':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-3/4 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded"></div>
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Submissions</h1>
        <p className="text-muted-foreground">
          Track the status of your submitted work and feedback from clients.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displaySubmissions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displaySubmissions.filter(s => s.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displaySubmissions.filter(s => s.status === 'submitted').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displaySubmissions.length > 0
                ? Math.round((displaySubmissions.filter(s => s.status === 'approved').length / displaySubmissions.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      {displaySubmissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by browsing available jobs and submitting your work.
            </p>
            <Button asChild>
              <Link href="/dashboard/jobs">Browse Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displaySubmissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {submission.jobs?.title || 'Unknown Job'}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <Badge variant={submission.jobs?.type === 'audio' ? 'default' : 'secondary'}>
                        {submission.jobs?.type === 'audio' ? (
                          <Mic2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Video className="w-3 h-3 mr-1" />
                        )}
                        {submission.jobs?.type}
                      </Badge>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ${submission.jobs?.payment_amount}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(submission.status)}>
                    {getStatusIcon(submission.status)}
                    {submission.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Info */}
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  {submission.file_type.startsWith('audio/') ? (
                    <FileAudio className="h-5 w-5 text-primary" />
                  ) : (
                    <FileVideo className="h-5 w-5 text-primary" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">Submitted File</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.file_type}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                </div>

                {/* Notes/Feedback */}
                {submission.notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-1">
                      {submission.status === 'approved' ? 'Feedback' : 'Review Notes'}
                    </p>
                    <p className="text-sm text-muted-foreground">{submission.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(submission.updated_at).toLocaleString()}
                  </div>
                  {submission.status === 'rejected' && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/jobs/${submission.job_id}`}>
                        Resubmit Work
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
