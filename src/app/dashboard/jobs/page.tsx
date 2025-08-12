'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from "@/components/auth-provider"
import { supabase } from '@/lib/supabase'
import {
  Mic2,
  Video,
  DollarSign,
  Clock,
  Search,
  Filter,
  ChevronRight,
  Briefcase
} from 'lucide-react'

type Job = {
  id: string
  title: string
  description: string
  type: 'audio' | 'video'
  payment_amount: number
  requirements_text: string | null
  active: boolean
  created_at: string
}

export default function JobsPage() {
  const { user, loading: authLoading } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')

  const fetchJobs = useCallback(async () => {
    try {
      console.log("🔍 Starting to fetch jobs...", { user: user?.id, authLoading });
      if (!user) {
        console.log("❌ No authenticated user, skipping job fetch");
        setLoading(false);
        return;
      }
      console.log("✅ User authenticated, proceeding with job fetch");
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })

      console.log("📊 Query result:", { data, error, count: data?.length });
      if (error) {
        console.error("❌ Supabase error:", error);
        throw error;
      }
      if (data && data.length > 0) {
        console.log("✅ Successfully loaded", data.length, "jobs");
        console.log("📋 First job sample:", data[0]);
        setJobs(data);
      } else {
        console.warn("⚠️ No jobs returned from query");
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    if (!authLoading && user) {
    fetchJobs()
    }
  }, [user, authLoading, fetchJobs])

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || job.type === typeFilter

    return matchesSearch && matchesType
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === 'highest-pay') {
      return b.payment_amount - a.payment_amount
    } else if (sortBy === 'lowest-pay') {
      return a.payment_amount - b.payment_amount
    }
    return 0
  })

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Available Jobs</h1>
        <p className="text-muted-foreground">
          Find voice work opportunities from our database of {jobs.length} real jobs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="space-y-2">
          <Label htmlFor="search">Search Jobs</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Job Type</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="audio">Audio Only</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="highest-pay">Highest Pay</SelectItem>
              <SelectItem value="lowest-pay">Lowest Pay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button variant="outline" className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-5/6 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-4/6 bg-muted animate-pulse rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No jobs found</h3>
            <p className="text-muted-foreground">
              {searchTerm || typeFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No jobs are currently available. Check back later!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{job.title}</CardTitle>
                  <Badge variant={job.type === 'audio' ? 'default' : 'secondary'}>
                    {job.type === 'audio' ? (
                      <Mic2 className="w-3 h-3 mr-1" />
                    ) : (
                      <Video className="w-3 h-3 mr-1" />
                    )}
                    {job.type}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    ${job.payment_amount}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-3 mb-4">
                  {job.description}
                </CardDescription>

                {job.requirements_text && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Requirements:</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.requirements_text}
                    </p>
                  </div>
                )}

                <Button asChild className="w-full">
                  <Link href={`/dashboard/jobs/${job.id}`}>
                    View Details
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
