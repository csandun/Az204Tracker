"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type NavigationCardProps = {
  href: string
  title: string
  children: React.ReactNode
  className?: string
}

export function NavigationCard({ href, title, children, className = "" }: NavigationCardProps) {
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
      className={`relative flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:cursor-not-allowed ${className}`}
    >
      <span className="font-medium text-gray-900 truncate">{title}</span>
      {children}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 rounded-lg bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
    </button>
  )
}
