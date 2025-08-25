'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LivaLogo } from './liva-logo'
import { 
  Home, 
  FileText, 
  Video, 
  Wallet, 
  User
} from 'lucide-react'

// Debug logs for component rendering
console.log('Rendering SidebarNavigation component')

export function SidebarNavigation() {
  const pathname = usePathname()
  
  // Debug log for current path
  console.log('Current pathname:', pathname)
  
  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }
  
  return (
    <div className="fixed left-0 top-0 h-full w-[80px] bg-white flex flex-col items-center py-8 z-10">
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Logo */}
        <Link href="/dashboard" className="block">
          <LivaLogo />
        </Link>
        
        {/* Navigation Icons */}
        <div className="flex flex-col gap-5 items-center w-full">
          {/* Home */}
          <Link href="/dashboard" className="block w-full px-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isActive('/dashboard') && !isActive('/dashboard/jobs') && !isActive('/dashboard/earnings') && !isActive('/dashboard/profile') ? 'bg-[#f96f2f] shadow-sm ring-2 ring-[#ffbd9e] ring-opacity-50' : ''}`}>
              <Home className={`w-5 h-5 ${isActive('/dashboard') && !isActive('/dashboard/jobs') && !isActive('/dashboard/earnings') && !isActive('/dashboard/profile') ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </Link>
          
          {/* Tasks */}
          <Link href="/dashboard/jobs" className="block w-full px-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isActive('/dashboard/jobs') ? 'bg-[#f96f2f] shadow-sm ring-2 ring-[#ffbd9e] ring-opacity-50' : ''}`}>
              <FileText className={`w-5 h-5 ${isActive('/dashboard/jobs') ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </Link>
          
          {/* Submissions */}
          <Link href="/dashboard/submissions" className="block w-full px-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isActive('/dashboard/submissions') ? 'bg-[#f96f2f] shadow-sm ring-2 ring-[#ffbd9e] ring-opacity-50' : ''}`}>
              <Video className={`w-5 h-5 ${isActive('/dashboard/submissions') ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </Link>
          
          {/* Earnings */}
          <Link href="/dashboard/earnings" className="block w-full px-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isActive('/dashboard/earnings') ? 'bg-[#f96f2f] shadow-sm ring-2 ring-[#ffbd9e] ring-opacity-50' : ''}`}>
              <Wallet className={`w-5 h-5 ${isActive('/dashboard/earnings') ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </Link>
          
        </div>
      </div>
      
      <div className="mt-auto flex flex-col items-center gap-5 w-full">
        {/* Profile */}
        <Link href="/dashboard/profile" className="block w-full px-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isActive('/dashboard/profile') ? 'bg-[#f96f2f] shadow-sm ring-2 ring-[#ffbd9e] ring-opacity-50' : ''}`}>
            <User className={`w-5 h-5 ${isActive('/dashboard/profile') ? 'text-white' : 'text-gray-700'}`} />
          </div>
        </Link>
        
      </div>
    </div>
  )
}
