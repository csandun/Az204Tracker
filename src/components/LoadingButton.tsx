"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type LoadingButtonProps = {
  href: string
  children: React.ReactNode
  className?: string
}

export function LoadingButton({ href, children, className = "" }: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    setIsLoading(true)
    router.push(href)
  }

  return (
    <button 
      onClick={handleClick}
      disabled={isLoading}
      className={`relative inline-flex items-center gap-2 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      )}
      {children}
    </button>
  )
}
