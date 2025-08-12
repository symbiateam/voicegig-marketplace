import React from 'react'
import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'Liva AI - Capturing Human Emotion and Experience',
  description: 'Building the world\'s richest dataset of real human expressions for next-generation AI.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
