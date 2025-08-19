'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Mic2, Video, DollarSign, Clock } from 'lucide-react'

// Debug logs for component rendering
console.log('Rendering TaskDetailsContent component')

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

interface TaskDetailsContentProps {
  jobId: string
  onClose: () => void
}

export function TaskDetailsContent({ jobId, onClose }: TaskDetailsContentProps) {
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  // Debug logging
  console.log("🚀 TaskDetailsContent loaded", {
    jobId,
    user: user?.id,
    userEmail: user?.email
  });

  const fetchJob = useCallback(async () => {
    try {
      console.log("🔍 Fetching job details for ID:", jobId);

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('active', true)
        .single()

      console.log("📊 Job details query result:", { data, error });

      if (error) {
        console.error("❌ Supabase error:", error);
        throw error;
      }

      if (data) {
        console.log("✅ Successfully loaded job details:", data);
        setJob(data);
      } else {
        console.warn("⚠️ Job not found");
        toast.error('Job not found')
        onClose()
      }
    } catch (error) {
      console.error('Error fetching job:', error)
      toast.error('Failed to load job details')
      onClose()
    } finally {
      setLoading(false)
    }
  }, [jobId, onClose])

  useEffect(() => {
    if (jobId) {
      fetchJob()
    }
  }, [fetchJob, jobId])

  // Handle continue button click - will navigate to recording/upload page
  const handleContinue = () => {
    if (!job) return
    
    // Navigate to the job details page where recording/upload will happen
    window.location.href = `/dashboard/jobs/${jobId}`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-center text-muted-foreground">Loading task details...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-red-500 mb-4">Task not found</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Task Icon and Title */}
      <div className="flex flex-col items-center mb-8">
        <div className="text-5xl mb-4">
          {job?.category === 'vacation' ? '🌴' : 
           job?.category === 'nails' ? '💅' : 
           job?.category === 'food' ? '🍝' : 
           job?.category === 'skincare' ? '🧴' : 
           job?.category === 'skateboarding' ? '🛹' : 
           job?.category === 'furniture' ? '🪑' : 
           job?.type === 'audio' ? '🎙️' : '📹'}
        </div>
        <h1 className="text-2xl font-bold text-center">{job?.title}</h1>
      </div>
      
      {/* Task Description */}
      <div className="mb-8">
        <p className="text-gray-600 mb-6 text-center">{job?.description}</p>
        
        {job?.requirements_text && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Requirements Checklist</h3>
            <ul className="list-disc pl-6 space-y-1">
              {job.requirements_text.split('\n').map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Reward Info */}
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Reward Info</h3>
          <ul className="space-y-1">
            <li>💰 Payout: ${job?.payment_amount}</li>
          </ul>
        </div>
      </div>
      
      {/* Continue Button */}
      <Button 
        onClick={handleContinue}
        className="w-full bg-[#ff6b35] hover:bg-[#ff5a1f] text-white font-medium py-3 rounded-full"
        size="lg"
      >
        Continue recording
      </Button>
    </div>
  )
}
