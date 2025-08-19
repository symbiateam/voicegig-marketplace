'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LivaLogo } from './liva-logo'
import { 
  Home, 
  FileText, 
  Video, 
  Wallet, 
  Bell, 
  Settings,
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
            <div className={`flex items-center justify-center p-3 rounded-full ${isActive('/dashboard') && !isActive('/dashboard/jobs') && !isActive('/dashboard/earnings') && !isActive('/dashboard/profile') ? 'bg-[#f96f2f] shadow-sm ring-2 ring-[#ffbd9e] ring-opacity-50' : 'bg-gray-50'}`}>
              <Home className={`w-5 h-5 ${isActive('/dashboard') && !isActive('/dashboard/jobs') && !isActive('/dashboard/earnings') && !isActive('/dashboard/profile') ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </Link>
          
          {/* Tasks */}
          <Link href="/dashboard/jobs" className="block w-full px-4">
            <div className={`flex items-center justify-center p-3 rounded-full ${isActive('/dashboard/jobs') ? 'bg-[#f96f2f] shadow-sm ring-2 ring-[#ffbd9e] ring-opacity-50' : 'bg-gray-50'}`}>
              <FileText className={`w-5 h-5 ${isActive('/dashboard/jobs') ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </Link>
          
          {/* Videos */}
          <Link href="/dashboard/videos" className="block w-full px-4">
            <div className="flex items-center justify-center p-3 rounded-full bg-gray-50">
              <Video className="w-5 h-5 text-gray-700" />
            </div>
          </Link>
          
          {/* Earnings */}
          <Link href="/dashboard/earnings" className="block w-full px-4">
            <div className={`flex items-center justify-center p-3 rounded-full ${isActive('/dashboard/earnings') ? 'bg-[#f96f2f] shadow-sm ring-2 ring-[#ffbd9e] ring-opacity-50' : 'bg-gray-50'}`}>
              <Wallet className={`w-5 h-5 ${isActive('/dashboard/earnings') ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </Link>
          
          {/* Notifications */}
          <Link href="/dashboard/notifications" className="block w-full px-4">
            <div className="flex items-center justify-center p-3 rounded-full bg-gray-50">
              <Bell className="w-5 h-5 text-gray-700" />
            </div>
          </Link>
        </div>
      </div>
      
      <div className="mt-auto flex flex-col items-center gap-5 w-full">
        {/* Profile */}
        <Link href="/dashboard/profile" className="block w-full px-4">
          <div className={`flex items-center justify-center ${isActive('/dashboard/profile') ? 'bg-[#f96f2f] shadow-sm ring-2 ring-[#ffbd9e] ring-opacity-50' : 'bg-gray-50'} rounded-full p-1`}>
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </Link>
        
        {/* Settings */}
        <Link href="/dashboard/settings" className="block w-full px-4 mb-5">
          <div className="flex items-center justify-center p-3 rounded-full bg-gray-50">
            <Settings className="w-5 h-5 text-gray-700" />
          </div>
        </Link>
      </div>
    </div>
  )
}
