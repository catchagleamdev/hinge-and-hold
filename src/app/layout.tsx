import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hinge & Hold',
  description: 'Chipping practice tracker',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f5e6c8] text-[#1a1a1a] min-h-screen">
        {children}
      </body>
    </html>
  )
}
