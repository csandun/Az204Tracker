import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const protectedPaths = ['/dashboard']
  const isProtected = protectedPaths.some((p) => url.pathname.startsWith(p))
  
  // Check for Supabase auth cookies - be more permissive
  const cookieNames = req.cookies.getAll().map(c => c.name)
  const hasAuthCookie = cookieNames.some(n => 
    n.includes('sb-') || 
    n.includes('supabase') || 
    n.includes('access-token') || 
    n.includes('refresh-token')
  )

  if (isProtected && !hasAuthCookie) {
    console.log('Middleware: No auth cookie found, redirecting to signin')
    console.log('Available cookies:', cookieNames)
    url.pathname = '/signin'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
