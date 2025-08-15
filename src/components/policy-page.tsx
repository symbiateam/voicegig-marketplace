'use client'

import { useEffect } from 'react'
import { Navigation } from '@/components/navigation'

interface PolicyPageProps {
  policyId: string
  title: string
}

export function PolicyPage({ policyId, title }: PolicyPageProps) {
  useEffect(() => {
    // Create script element for Termly
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://app.termly.io/embed-policy.min.js'
    script.id = 'termly-jssdk'
    
    // Add the script to the document
    document.body.appendChild(script)
    
    return () => {
      // Clean up on unmount
      if (document.getElementById('termly-jssdk')) {
        document.getElementById('termly-jssdk')?.remove()
      }
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16 mt-10">
        <h1 className="text-3xl font-bold mb-8 text-center">{title}</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div name="termly-embed" data-id={policyId}></div>
        </div>
      </div>
    </div>
  )
}
