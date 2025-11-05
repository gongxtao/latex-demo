import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Resume Editor',
  description: 'AI-powered HTML resume editor with real-time preview',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

