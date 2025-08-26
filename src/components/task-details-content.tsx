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
  estimated_time: number | null
}

interface TaskDetailsContentProps {
  jobId: string
  onClose: () => void
}

export function TaskDetailsContent({ jobId, onClose }: TaskDetailsContentProps) {
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'details' | 'options' | 'upload' | 'record' | 'success'>('details')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  
  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const videoChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

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

      // Show success view instead of closing modal
      setView('success')
      
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
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
        setVideoUrl(null)
      }
      setAudioBlob(null)
      setVideoBlob(null)
      audioChunksRef.current = []
      videoChunksRef.current = []
      setRecordingTime(0)
      
      // Request media access based on job type
      const constraints = job?.type === 'video' 
        ? { 
            audio: true, 
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            }
          }
        : { audio: true }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      // For video recording, show preview
      if (job?.type === 'video' && videoRef.current) {
        console.log('Setting up video preview', stream)
        videoRef.current.srcObject = stream
        
        // Wait for metadata to load before playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error)
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          if (job?.type === 'video') {
            videoChunksRef.current.push(event.data)
          } else {
            audioChunksRef.current.push(event.data)
          }
        }
      }
      
      mediaRecorder.onstop = () => {
        if (job?.type === 'video') {
          const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' })
          const url = URL.createObjectURL(videoBlob)
          setVideoBlob(videoBlob)
          setVideoUrl(url)
        } else {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
          const url = URL.createObjectURL(audioBlob)
          setAudioBlob(audioBlob)
          setAudioUrl(url)
        }
        setIsRecording(false)
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null
        
        // Clear video preview
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
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
      const errorMessage = job?.type === 'video' 
        ? 'Could not access camera and microphone. Please check permissions.'
        : 'Could not access microphone. Please check permissions.'
      toast.error(errorMessage)
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
    const recordingBlob = job?.type === 'video' ? videoBlob : audioBlob
    if (!recordingBlob || !job || !user) return
    
    setUploading(true)
    
    try {
      // Convert blob to file
      const fileExtension = job.type === 'video' ? 'webm' : 'wav'
      const mimeType = job.type === 'video' ? 'video/webm' : 'audio/wav'
      const file = new File([recordingBlob], `recording-${Date.now()}.${fileExtension}`, { type: mimeType })
      
      console.log("🚀 Starting recording submission...", {
        fileSize: file.size,
        fileType: file.type,
        jobType: job.type,
        jobId: job.id,
        userId: user.id
      })
      
      // Determine storage bucket based on job type
      const storageBucket = job.type === 'video' ? 'video' : 'audio'
      
      // Upload to Supabase Storage
      const fileName = `${user.id}/${job.id}-${Date.now()}.${fileExtension}`
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from(storageBucket)
        .upload(fileName, file)
        
      if (uploadError) {
        console.error("❌ Upload error:", uploadError)
        throw uploadError
      }
      
      console.log("✅ Recording uploaded successfully:", uploadData)
      
      // Get the public URL
      const { data: urlData } = supabase
        .storage
        .from(storageBucket)
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
            file_type: job.type,
            notes: notes,
            status: 'submitted'
          }
        ])
        .select()
        
      if (submissionError) {
        console.error("❌ Submission error:", submissionError)
        throw submissionError
      }
      
      console.log("✅ Submission created:", submissionData);
      
      // Show success view instead of closing modal
      setView('success')
      
    } catch (error) {
      console.error('Error submitting recording:', error)
      toast.error(`Failed to submit your ${job?.type} recording. Please try again.`)
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
              <h3 className="font-semibold mb-2">Requirements</h3>
              <div className="space-y-1">
                {job.requirements_text.split('\n').map((req, index) => (
                  <p key={index} className="text-gray-600">{req}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Reward Info */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Reward Info</h3>
            <div className="space-y-1">
              <p className="text-gray-600">Payout: ${job?.payment_amount} per minute</p>
              {job?.estimated_time && (
                <p className="text-gray-600">Maximum time per submission: {
                  job.estimated_time < 1 
                    ? `${Math.round(job.estimated_time * 60)} seconds`
                    : job.estimated_time % 1 === 0
                      ? `${job.estimated_time} minute${job.estimated_time !== 1 ? 's' : ''}`
                      : `${Math.floor(job.estimated_time)} minute${Math.floor(job.estimated_time) !== 1 ? 's' : ''} and ${Math.round((job.estimated_time % 1) * 60)} seconds`
                }</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Continue Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleContinue}
            className="bg-[#ff6b35] hover:bg-[#ff5a1f] text-white font-medium py-3 px-8 rounded-full"
            size="lg"
          >
            Continue
          </Button>
        </div>
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
        
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-8">How would you like to submit?</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Upload Option */}
          <div 
            onClick={() => setView('upload')}
            className="bg-[#FF6E35] text-white rounded-xl p-4 hover:bg-[#ff5a1f] transition cursor-pointer"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <Upload className="h-8 w-8" />
              <div>
                <h3 className="font-medium mb-1">Upload File</h3>
                <p className="text-xs opacity-90">
                  Upload existing {job.type}
                </p>
              </div>
            </div>
          </div>
          
          {/* Record Option */}
          <div 
            onClick={() => setView('record')}
            className="bg-[#FF6E35] text-white rounded-xl p-4 hover:bg-[#ff5a1f] transition cursor-pointer"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <Mic2 className="h-8 w-8" />
              <div>
                <h3 className="font-medium mb-1">Record Now</h3>
                <p className="text-xs opacity-90">
                  Record in browser
                </p>
              </div>
            </div>
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
        
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-8">Upload {job.type === 'audio' ? 'Audio' : 'Video'}</h2>
        
        {/* File Upload */}
        <div className="space-y-8">
          {!selectedFile ? (
            <div className="bg-gray-100 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors">
              <input
                id="file-upload"
                type="file"
                accept={job.type === 'audio' ? 'audio/*' : 'video/*'}
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                {job.type === 'audio' ? (
                  <FileAudio className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                ) : (
                  <FileVideo className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                )}
                <p className="text-lg text-gray-600 mb-2">
                  Drop your {job.type} file here, or click to browse
                </p>
                <p className="text-sm text-gray-400">
                  {job.type === 'audio' ? 'MP3, WAV, M4A' : 'MP4, MOV, AVI'} up to 100MB
                </p>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl bg-gray-50">
              <div className="flex items-center space-x-4">
                {job.type === 'audio' ? (
                  <FileAudio className="h-10 w-10 text-[#ff6b35]" />
                ) : (
                  <FileVideo className="h-10 w-10 text-[#ff6b35]" />
                )}
                <div>
                  <p className="font-medium text-[#1a1a1a]">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleUploadSubmit}
              disabled={!selectedFile || uploading}
              className="bg-[#ff6b35] hover:bg-[#ff5a1f] text-white font-medium py-3 px-12 rounded-full"
              size="lg"
            >
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
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
        
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-8">Record {job.type === 'audio' ? 'Audio' : 'Video'}</h2>
        
        {/* Recording Interface */}
        <div className="space-y-8">
          {/* Recording Controls */}
          <div className="flex flex-col items-center justify-center p-12 bg-gray-100 rounded-lg">
            {(!audioUrl && !videoUrl) ? (
              <>
                {/* Video Preview for Video Tasks */}
                {job?.type === 'video' && (
                  <div className="mb-6 w-full max-w-md">
                    <video 
                      ref={videoRef}
                      className="w-full h-auto rounded-lg bg-black"
                      muted
                      autoPlay
                      playsInline
                      style={{ display: isRecording ? 'block' : 'none' }}
                    />
                  </div>
                )}
                
                <div className="mb-6 text-center">
                  {isRecording ? (
                    <div className="text-2xl font-bold text-red-500">{formatTime(recordingTime)}</div>
                  ) : (
                    <>
                      {job?.type === 'video' ? (
                        <Video className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      ) : (
                        <Mic2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex justify-center">
                  {!isRecording ? (
                    <Button 
                      onClick={startRecording}
                      className="bg-[#ff6b35] hover:bg-[#ff5a1f] text-white font-medium py-3 px-12 rounded-full"
                    >
                      Start Recording
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopRecording}
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-12 rounded-full"
                    >
                      Stop Recording
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-full mb-6">
                  {job?.type === 'video' && videoUrl ? (
                    <video src={videoUrl} controls className="w-full max-w-md mx-auto rounded-lg" />
                  ) : audioUrl ? (
                    <audio src={audioUrl} controls className="w-full" />
                  ) : null}
                </div>
                <div className="flex gap-4">
                  <Button 
                    onClick={() => {
                      if (audioUrl) {
                        URL.revokeObjectURL(audioUrl)
                        setAudioUrl(null)
                        setAudioBlob(null)
                      }
                      if (videoUrl) {
                        URL.revokeObjectURL(videoUrl)
                        setVideoUrl(null)
                        setVideoBlob(null)
                      }
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
          
          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleRecordingSubmit}
              disabled={(!audioBlob && !videoBlob) || uploading}
              className="bg-[#ff6b35] hover:bg-[#ff5a1f] text-white font-medium py-3 px-12 rounded-full"
              size="lg"
            >
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // Success View
  if (view === 'success') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-12">
          {/* Success Icon */}
          <div className="mb-6"></div>
          
          {/* Success Message */}
          <h2 className="text-2xl font-bold text-center mb-4">Submission sent!</h2>
          <p className="text-center text-gray-600 mb-8 max-w-md">
            We'll review in 24 hrs. Keep an eye on your dashboard for updates.
          </p>
          
          {/* Go Home Button */}
          <Button
            onClick={onClose}
            className="bg-[#ff6b35] hover:bg-[#ff5a1f] text-white font-medium py-3 px-8 rounded-full"
            size="lg"
          >
            Go Home
          </Button>
        </div>
      </div>
    )
  }
  
  return null
}
