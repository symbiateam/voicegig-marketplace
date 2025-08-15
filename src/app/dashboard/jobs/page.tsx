'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { Mic2, Video, DollarSign, Search, Filter, ChevronRight, Briefcase } from 'lucide-react'

type Job = {
  id: string
  title: string
  description: string
  type: 'audio' | 'video'
  category?: string // Category field for Supabase
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
  const [sortBy, setSortBy] = useState<string>('newest')

  const fetchJobs = useCallback(async () => {
    try {
      if (!user) { setLoading(false); return }
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      
      // If jobs don't have a category yet, we'll need to add it to Supabase
      // This is temporary code to handle existing jobs without categories
      if (data && data.length > 0 && !data[0].category) {
        // For demo purposes, assign random categories to jobs that don't have one
        const categories = ['sad', 'skills', 'casual', 'audio', 'video'];
        const updatedJobs = await Promise.all(data.map(async (job) => {
          // Assign a random category if none exists
          const randomCategory = categories[Math.floor(Math.random() * categories.length)];
          
          // Update the job in Supabase with the new category
          const { error: updateError } = await supabase
            .from('jobs')
            .update({ category: randomCategory })
            .eq('id', job.id);
            
          if (updateError) console.error('Error updating job category:', updateError);
          
          // Return the job with the new category
          return { ...job, category: randomCategory };
        }));
        
        setJobs(updatedJobs);
      } else {
        setJobs(data ?? []);
      }
    } catch (e) {
      console.error(e)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) fetchJobs()
  }, [user, authLoading, fetchJobs])

  // We no longer need to assign categories as they come from Supabase
  const categorizedJobs = useMemo(() => {
    return jobs;
  }, [jobs]);
  
  const filteredJobs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const filtered = !q
      ? categorizedJobs
      : categorizedJobs.filter(j =>
          j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q)
        )
    filtered.sort((a, b) => {
      if (sortBy === 'newest') return +new Date(b.created_at) - +new Date(a.created_at)
      if (sortBy === 'highest-pay') return b.payment_amount - a.payment_amount
      if (sortBy === 'lowest-pay') return a.payment_amount - b.payment_amount
      return 0
    })
    return filtered
  }, [categorizedJobs, searchTerm, sortBy])

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-mono">Tasks</h1>
        <p className="text-muted-foreground font-mono text-sm">Browse available tasks</p>
      </div>

      {/* compact controls */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 mb-8 items-end bg-[#f0f2f5] p-4 rounded-lg border border-[#e0e3e7]">
        <div className="space-y-1">
          <Label htmlFor="search" className="font-mono text-xs uppercase tracking-wider">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 font-mono text-sm bg-white border-[#d0d3d7]"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="font-mono text-xs uppercase tracking-wider">Sort</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36 font-mono text-sm bg-white border-[#d0d3d7]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="font-mono text-sm">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="highest-pay">Highest pay</SelectItem>
              <SelectItem value="lowest-pay">Lowest pay</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex md:justify-end">
          <Button variant="outline" className="w-full md:w-auto font-mono text-sm bg-white border-[#d0d3d7] hover:bg-[#f0f2f5]">
            <Filter className="h-4 w-4 mr-2" /> Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-5 py-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-[var(--secondary-color)]/30" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-[var(--secondary-color)]/20 rounded-full mb-2" />
                <div className="h-3 w-1/2 bg-[var(--secondary-color)]/20 rounded-full" />
              </div>
              <div className="w-20 h-6 bg-[var(--secondary-color)]/20 rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-10 text-center">
          <Briefcase className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-color)]" />
          <div className="font-medium font-inter text-lg mb-2">No Tasks Found</div>
          <div className="text-sm text-[var(--light-text)] font-inter">Try adjusting your search parameters</div>
        </div>
      ) : (
        <div className="space-y-5 py-2">
          {filteredJobs.map(job => (
            <JobTile key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}



function JobTile({ job }: { job: Job }) {
  // Get the appropriate color based on job category
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'audio': return 'var(--category-audio)';
      case 'video': return 'var(--category-video)';
      case 'emotion': return 'var(--category-emotion)';
      case 'skills': return 'var(--category-skills)';
      case 'casual': return 'var(--category-casual)';
      default: return 'var(--category-default)';
    }
  };
  
  // Get the appropriate icon based on job type
  const getCategoryIcon = (type: string) => {
    if (type === 'audio') return <Mic2 className="w-4 h-4 text-white" />;
    return <Video className="w-4 h-4 text-white" />;
  };
  
  return (
    <Link
      href={`/dashboard/jobs/${job.id}`}
      className="group flex items-center gap-4 py-3 hover:bg-[var(--card-accent)]/30 px-3 rounded-xl transition-all"
    >
      {/* Colored circle for category */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: getCategoryColor(job.category) }}
      >
        {getCategoryIcon(job.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-inter font-medium text-base text-[var(--text-color)]">{job.title}</h3>
          <Badge variant="outline" className="border-[var(--secondary-color)] bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] px-2 py-0 h-5 text-[10px] font-inter">
            {job.category || job.type}
          </Badge>
        </div>
        <p className="font-inter text-xs text-[var(--light-text)] line-clamp-1">{job.description}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center text-lg font-inter font-medium text-[var(--primary-color)]">
          <DollarSign className="w-5 h-5 mr-0.5" />
          {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(job.payment_amount)}
        </div>
        <div className="bg-[var(--secondary-color)]/10 p-2 rounded-full group-hover:bg-[var(--secondary-color)]/20 transition-colors">
          <ChevronRight className="w-5 h-5 text-[var(--secondary-color)]" />
        </div>
      </div>
    </Link>
  );
}
