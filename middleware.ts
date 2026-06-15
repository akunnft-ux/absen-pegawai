import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  const { supabaseResponse, user, supabase } = await updateSession(request)

  const path = request.nextUrl.pathname

  const isPublicPath = path === '/login' || path.startsWith('/auth/callback')

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && path === '/login') {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'grand_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/attendance', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
