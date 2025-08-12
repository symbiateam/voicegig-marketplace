'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur border-b border-[var(--border-color)]">
      <div className="container flex justify-between items-center py-4 max-w-[1200px] mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[var(--primary-color)] font-semibold text-lg">
          Liva AI
        </Link>

        <nav className="hidden md:flex gap-8 text-[var(--text-color)] font-medium">
          <Link href="#features" className="hover:text-[var(--primary-color)]">Features</Link>
          <Link href="#how-it-works" className="hover:text-[var(--primary-color)]">How It Works</Link>
          <Link href="#pricing" className="hover:text-[var(--primary-color)]">Pricing</Link>
        </nav>


        {/* Mobile */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="md:hidden p-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-[var(--background)]">
            <div className="flex flex-col gap-6 mt-6 text-[var(--text-color)]">
              <Link href="#features" onClick={() => setIsOpen(false)}>Features</Link>
              <Link href="#how-it-works" onClick={() => setIsOpen(false)}>How It Works</Link>
              <Link href="#pricing" onClick={() => setIsOpen(false)}>Pricing</Link>
              <Link href="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
              <Link href="/signup" onClick={() => setIsOpen(false)} className="cta-button text-center">Get Started</Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
