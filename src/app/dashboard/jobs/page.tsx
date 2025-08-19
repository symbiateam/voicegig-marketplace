'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import { TaskDetailsModal } from '@/components/task-details-modal'
import { TaskDetailsContent } from '@/components/task-details-content'

type Job = {
  id: string
  title: string
  description: string
  type: 'audio' | 'video'
  category?: string
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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Debug log for modal state
  console.log('Modal state:', { isModalOpen, selectedJobId: selectedJob?.id })
  
  // Open modal with selected job
  const openJobModal = useCallback((job: Job) => {
    console.log('Opening modal for job:', job.id)
    setSelectedJob(job)
    setIsModalOpen(true)
  }, [])
  
  // Close modal
  const closeJobModal = useCallback(() => {
    console.log('Closing job modal')
    setIsModalOpen(false)
    // Keep the selected job for a moment to prevent UI flicker during close animation
    setTimeout(() => setSelectedJob(null), 300)
  }, [])
  
  // Debug log
  console.log('Rendering JobsPage component with Figma design')

  const fetchJobs = useCallback(async () => {
    try {
      // Debug log
      console.log('Fetching jobs data')
      
      if (!user) { 
        console.log('No user found, skipping fetch')
        setLoading(false)
        return 
      }
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        
      if (error) {
        console.error('Error fetching jobs:', error)
        throw error
      }
      
      console.log('Jobs data fetched:', data?.length || 0, 'jobs')
      
      // If jobs don't have a category yet, we'll need to add it to Supabase
      // This is temporary code to handle existing jobs without categories
      if (data && data.length > 0 && !data[0].category) {
        console.log('Adding categories to jobs')
        // For demo purposes, assign random categories to jobs that don't have one
        const categories = ['vacation', 'nails', 'food', 'skincare', 'skateboarding', 'furniture'];
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
      console.error('Error in fetchJobs:', e)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    console.log('Auth loading:', authLoading, 'User:', !!user)
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
    console.log('Filtered jobs:', filtered.length)
    return filtered
  }, [categorizedJobs, searchTerm, sortBy])

  return (
    <div className="py-4 max-w-[1300px] mx-auto px-4">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold mb-1 text-[#1a1a1a]">Ready to earn today?</h1>
        <p className="text-[#6d6d6d] text-sm">Hot right now!! Grab these before they're gone</p>
      </div>
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-grow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search for task..."
              className="pl-9 h-10 border-[#e0e0e0] rounded-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger className="w-[150px] h-10 border-[#e0e0e0] rounded-full text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Paying</SelectItem>
              <SelectItem value="lowest">Lowest Paying</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10 border-[#e0e0e0] rounded-full text-sm px-4">
            <SlidersHorizontal size={16} className="mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="animate-pulse rounded-xl border border-[#d1d1d1] border-dashed h-[150px]">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 mb-2" />
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-1/2 bg-gray-200 rounded mb-4" />
                <div className="h-5 w-14 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <div className="font-medium text-lg mb-2 text-[#1a1a1a]">No Tasks Found</div>
          <div className="text-sm text-[#6d6d6d]">Try adjusting your search parameters</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredJobs.map(job => (
            <JobCard key={job.id} job={job} onClick={() => openJobModal(job)} />
          ))}
        </div>
      )}
      
      {/* Task Details Modal */}
      {selectedJob && (
        <TaskDetailsModal isOpen={isModalOpen} onClose={closeJobModal}>
          <TaskDetailsContent jobId={selectedJob.id} onClose={closeJobModal} />
        </TaskDetailsModal>
      )}
    </div>
  )
}



function JobCard({ job, onClick }: { job: Job, onClick: () => void }) {
  // Get the appropriate emoji based on job category
  const getCategoryEmoji = (category?: string) => {
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
        return job.type === 'audio' ? '🎙️' : '📹';
    }
  };
  
  // Format the job title to match the Figma design
  const formatJobTitle = (title: string, category?: string) => {
    // If title already starts with "Talk about" or "Video of", return as is
    if (title.startsWith('Talk about') || title.startsWith('Video of') || title.startsWith('Show your')) {
      return title;
    }
    
    // Otherwise, format based on category and type
    if (job.type === 'video') {
      return `Video of you ${category || 'talking'}`;
    } else {
      return `Talk about your ${category || 'experience'}`;
    }
  };
  
  // Calculate time ago
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

  // Debug log
  console.log('Rendering JobCard:', job.id, job.title, job.category)
  
  return (
    <div onClick={onClick}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow rounded-xl border border-[#d1d1d1] border-dashed h-[150px] cursor-pointer">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">
              {getCategoryEmoji(job.category)}
            </div>
          </div>
          
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-[#1a1a1a]">
            {formatJobTitle(job.title, job.category)}
          </h3>
          
          <div className="flex items-center justify-between mt-3">
            <div className="bg-[#00b286] flex items-center gap-1 px-2 py-0.5 rounded-lg text-white text-xs font-medium">
              ${job.payment_amount}
            </div>
            <span className="text-[10px] text-[#6d6d6d]">{getTimeAgo(job.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
