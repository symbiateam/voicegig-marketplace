'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Mic2,
  Video,
  DollarSign,
  Clock,
  Upload,
  CheckCircle,
  ArrowLeft,
  FileAudio,
  FileVideo,
  X
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

export default function JobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')

  // Debug logging
  console.log("🚀 JobDetailsPage loaded", {
    paramsId: params.id,
    user: user?.id,
    userEmail: user?.email
  });

  useEffect(() => {
    console.log("🔄 JobDetailsPage useEffect triggered", {
      paramsId: params.id,
      hasUser: !!user,
      userId: user?.id
    });
  }, [params.id, user]);

  const fetchJob = useCallback(async () => {
    try {
      console.log("🔍 Fetching job details for ID:", params.id);

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', params.id)
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
        router.push('/dashboard/jobs')
      }
    } catch (error) {
      console.error('Error fetching job:', error)
      toast.error('Failed to load job details')
      router.push('/dashboard/jobs')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    if (params.id) {
      fetchJob()
    }
  }, [fetchJob, params.id])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const isAudio = file.type.startsWith('audio/')
    const isVideo = file.type.startsWith('video/')

    if (job?.type === 'audio' && !isAudio) {
      toast.error('Please select an audio file for this job')
      return
    }

    if (job?.type === 'video' && !isVideo) {
      toast.error('Please select a video file for this job')
      return
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be less than 100MB')
      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async () => {
    if (!selectedFile || !job || !user) return

    setUploading(true)

    try {
      console.log("🚀 Starting file submission...", {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        jobType: job.type,
        jobId: job.id,
        userId: user.id
      });

      // Determine storage bucket based on job type
      const storageBucket = job.type === 'audio' ? 'audio' : 'video';

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${job.id}-${Date.now()}.${fileExt}`

      console.log("📤 Uploading to bucket:", storageBucket, "with filename:", fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(fileName, selectedFile)

      console.log("📊 Upload result:", { uploadData, uploadError });

      if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(fileName)

      console.log("🔗 Public URL generated:", publicUrl);

      // Create submission record
      const submissionData = {
        job_id: job.id,
        user_id: user.id,
        file_url: publicUrl,
        file_type: selectedFile.type,
        notes: notes.trim() || null,
        status: 'submitted'
      };

      console.log("💾 Creating submission record:", submissionData);

      const { data: submissionResult, error: submissionError } = await supabase
        .from('submissions')
        .insert(submissionData)
        .select()

      console.log("📊 Submission result:", { submissionResult, submissionError });

      if (submissionError) {
        console.error("❌ Submission error:", submissionError);
        throw submissionError;
      }

      console.log("✅ Submission successful!");
      toast.success('Submission uploaded successfully!')
      router.push('/dashboard/submissions')
    } catch (error) {
      console.error('Error submitting work:', error)
      toast.error('Failed to submit your work. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8"></div>
          <Card>
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted animate-pulse rounded mb-4"></div>
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-5/6 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-4/6 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <Button onClick={() => router.push('/dashboard/jobs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/jobs')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>

        {/* Job Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                  <Badge variant={job.type === 'audio' ? 'default' : 'secondary'}>
                    {job.type === 'audio' ? (
                      <Mic2 className="w-3 h-3 mr-1" />
                    ) : (
                      <Video className="w-3 h-3 mr-1" />
                    )}
                    {job.type}
                  </Badge>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    ${job.payment_amount}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{job.description}</p>
            </div>

            {job.requirements_text && (
              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <p className="text-muted-foreground">{job.requirements_text}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Work</CardTitle>
            <CardDescription>
              Upload your {job.type} file and any additional notes for this job.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-4">
              <Label htmlFor="file-upload">
                Upload {job.type === 'audio' ? 'Audio' : 'Video'} File
              </Label>

              {!selectedFile ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <input
                    id="file-upload"
                    type="file"
                    accept={job.type === 'audio' ? 'audio/*' : 'video/*'}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {job.type === 'audio' ? (
                      <FileAudio className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    ) : (
                      <FileVideo className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    )}
                    <h3 className="text-lg font-medium mb-2">
                      Drop your {job.type} file here, or click to browse
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {job.type === 'audio' ? 'MP3, WAV, M4A' : 'MP4, MOV, AVI'} up to 100MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    {job.type === 'audio' ? (
                      <FileAudio className="h-8 w-8 text-primary" />
                    ) : (
                      <FileVideo className="h-8 w-8 text-primary" />
                    )}
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about your submission..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Work
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
