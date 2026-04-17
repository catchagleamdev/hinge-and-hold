'use client'
import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="text-[#f5e6c8] text-base min-h-[44px] flex items-center"
    >
      ← Back
    </button>
  )
}
