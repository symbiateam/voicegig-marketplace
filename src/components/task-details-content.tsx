'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Mic2, Video, DollarSign, Clock, Upload, CheckCircle, FileAudio, FileVideo, X, ArrowLeft } from 'lucide-react'

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
  const [view, setView] = useState<'details' | 'options' | 'upload' | 'record'>('details')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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

  // Handle continue button click - show options
  const handleContinue = () => {
    if (!job) return
    setView('options')
  }
  
  // Handle file selection
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
  
  // Handle file upload submission
  const handleUploadSubmit = async () => {
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

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from(storageBucket)
        .upload(fileName, selectedFile)

      if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        throw uploadError;
      }

      console.log("✅ File uploaded successfully:", uploadData);

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase
        .storage
        .from(storageBucket)
        .getPublicUrl(fileName)

      const fileUrl = urlData?.publicUrl

      console.log("🔗 File public URL:", fileUrl);

      // Create submission record in database
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .insert([
          {
            job_id: job.id,
            user_id: user.id,
            file_path: fileName,
            file_url: fileUrl,
            file_type: job.type,
            notes: notes,
            status: 'submitted'
          }
        ])
        .select()

      if (submissionError) {
        console.error("❌ Submission error:", submissionError);
        throw submissionError;
      }

      console.log("✅ Submission created:", submissionData);

      toast.success('Your work has been submitted successfully!')
      
      // Close modal after successful submission
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Error submitting work:', error)
      toast.error('Failed to submit your work. Please try again.')
    } finally {
      setUploading(false)
    }
  }
  
  // Handle recording functions
  const startRecording = async () => {
    try {
      // Reset previous recording if any
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
      setAudioBlob(null)
      audioChunksRef.current = []
      setRecordingTime(0)
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const url = URL.createObjectURL(audioBlob)
        setAudioBlob(audioBlob)
        setAudioUrl(url)
        setIsRecording(false)
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop())
      }
      
      // Start recording
      mediaRecorder.start()
      setIsRecording(true)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Could not access microphone. Please check permissions.')
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }
  
  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Handle recording submission
  const handleRecordingSubmit = async () => {
    if (!audioBlob || !job || !user) return
    
    setUploading(true)
    
    try {
      // Convert blob to file
      const file = new File([audioBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' })
      
      console.log("🚀 Starting recording submission...", {
        fileSize: file.size,
        fileType: file.type,
        jobId: job.id,
        userId: user.id
      })
      
      // Upload to Supabase Storage
      const fileName = `${user.id}/${job.id}-${Date.now()}.wav`
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('audio')
        .upload(fileName, file)
        
      if (uploadError) {
        console.error("❌ Upload error:", uploadError)
        throw uploadError
      }
      
      console.log("✅ Recording uploaded successfully:", uploadData)
      
      // Get the public URL
      const { data: urlData } = supabase
        .storage
        .from('audio')
        .getPublicUrl(fileName)
        
      const fileUrl = urlData?.publicUrl
      
      // Create submission record
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .insert([
          {
            job_id: job.id,
            user_id: user.id,
            file_path: fileName,
            file_url: fileUrl,
            file_type: 'audio',
            notes: notes,
            status: 'submitted'
          }
        ])
        .select()
        
      if (submissionError) {
        console.error("❌ Submission error:", submissionError)
        throw submissionError
      }
      
      console.log("✅ Submission created:", submissionData)
      
      toast.success('Your recording has been submitted successfully!')
      
      // Close modal after successful submission
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Error submitting recording:', error)
      toast.error('Failed to submit your recording. Please try again.')
    } finally {
      setUploading(false)
    }
  }
  
  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null)
  }
  
  // Go back to previous view
  const goBack = () => {
    if (view === 'options') {
      setView('details')
    } else if (view === 'upload' || view === 'record') {
      setView('options')
      // Clean up recording if needed
      if (isRecording) {
        stopRecording()
      }
    }
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

  // Render different views based on state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-6 text-center">
        <p>Job not found or no longer available.</p>
        <Button onClick={onClose} className="mt-4">Close</Button>
      </div>
    )
  }
  
  // Details View
  if (view === 'details') {
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
              <li>Payout: ${job?.payment_amount}</li>
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
  
  // Options View
  if (view === 'options') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goBack}
            className="flex items-center gap-1 text-gray-500"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-8">How would you like to submit?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Option */}
          <div 
            onClick={() => setView('upload')}
            className="border rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Upload File</h3>
            <p className="text-center text-gray-500">
              Upload an existing {job.type === 'audio' ? 'audio' : 'video'} file from your device
            </p>
          </div>
          
          {/* Record Option */}
          <div 
            onClick={() => setView('record')}
            className="border rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mic2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Record Now</h3>
            <p className="text-center text-gray-500">
              Record {job.type === 'audio' ? 'audio' : 'video'} directly in your browser
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  // Upload View
  if (view === 'upload') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goBack}
            className="flex items-center gap-1 text-gray-500"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Upload Your {job.type === 'audio' ? 'Audio' : 'Video'}</h2>
        
        {/* File Upload */}
        <div className="space-y-6">
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
            onClick={handleUploadSubmit}
            disabled={!selectedFile || uploading}
            className="w-full bg-[#ff6b35] hover:bg-[#ff5a1f] text-white"
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
        </div>
      </div>
    )
  }
  
  // Record View
  if (view === 'record') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goBack}
            className="flex items-center gap-1 text-gray-500"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Record Your {job.type === 'audio' ? 'Audio' : 'Video'}</h2>
        
        {/* Recording Interface */}
        <div className="space-y-8">
          {/* Recording Controls */}
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            {!audioUrl ? (
              <>
                <div className="mb-6 text-center">
                  {isRecording ? (
                    <div className="text-2xl font-bold text-red-500">{formatTime(recordingTime)}</div>
                  ) : (
                    <Mic2 className="mx-auto h-16 w-16 text-muted-foreground mb-2" />
                  )}
                  <p className="text-muted-foreground">
                    {isRecording ? 'Recording in progress...' : 'Ready to record'}
                  </p>
                </div>
                
                <div className="flex gap-4">
                  {!isRecording ? (
                    <Button 
                      onClick={startRecording}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full px-8"
                    >
                      Start Recording
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopRecording}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-50 rounded-full px-8"
                    >
                      Stop Recording
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-full mb-6">
                  <audio src={audioUrl} controls className="w-full" />
                </div>
                <div className="flex gap-4">
                  <Button 
                    onClick={() => {
                      URL.revokeObjectURL(audioUrl)
                      setAudioUrl(null)
                      setAudioBlob(null)
                    }}
                    variant="outline"
                    className="rounded-full px-6"
                  >
                    Record Again
                  </Button>
                </div>
              </>
            )}
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about your recording..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          
          {/* Submit Button */}
          <Button
            onClick={handleRecordingSubmit}
            disabled={!audioBlob || uploading}
            className="w-full bg-[#ff6b35] hover:bg-[#ff5a1f] text-white"
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
                Submit Recording
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }
  
  return null
}
