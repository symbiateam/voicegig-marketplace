import React from 'react'
import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const nunito = Nunito({ 
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
      <head>
        <script src="https://www.paypalobjects.com/js/external/api.js"></script>
      </head>
      <body className={nunito.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
