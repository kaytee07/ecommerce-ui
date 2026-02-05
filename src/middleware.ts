import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedPaths = ['/account'];

// Routes that require admin role
const adminPaths = ['/admin'];

function shouldEnforceCookieGuard(request: NextRequest): boolean {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return true;

  try {
    const apiOrigin = new URL(apiUrl).origin;
    const appOrigin = request.nextUrl.origin;
    // In cross-origin deployments (e.g. Vercel + Render), auth cookies live on the API domain.
    return apiOrigin === appOrigin;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth token in HttpOnly cookies set by the backend
  // Cookie name is 'access_token' as set by the backend
  const token = request.cookies.get('access_token')?.value;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdmin = adminPaths.some((p) => pathname.startsWith(p));

  if ((isProtected || isAdmin) && !shouldEnforceCookieGuard(request)) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login for protected routes
  if ((isProtected || isAdmin) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes
    '/account/:path*',
    '/admin/:path*',
    // Auth routes
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};
