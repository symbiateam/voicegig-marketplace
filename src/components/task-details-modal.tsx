'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { LivaLogo } from './liva-logo'

// Debug logs for component rendering
console.log('Rendering TaskDetailsModal component')

interface TaskDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function TaskDetailsModal({ isOpen, onClose, children }: TaskDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      // Restore scrolling when modal is closed
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center">
           
            <h2 className="ml-3 text-xl font-semibold">Task Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
