import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('rifasonfire_access_token');
  const { pathname } = request.nextUrl;

  // Protect dashboard and admin routes
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect from login to dashboard if already authenticated
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard/rifas', request.url));
  }

  // Redirect root to dashboard/rifas
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard/rifas', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
