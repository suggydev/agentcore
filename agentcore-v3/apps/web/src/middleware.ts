import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/agents', '/chat', '/onboarding', '/knowledge', '/settings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/agents', request.url));
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtected && token) {
    const response = NextResponse.next();
    response.headers.set('x-auth-token', token);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/agents/:path*', '/chat/:path*', '/onboarding/:path*', '/login', '/knowledge/:path*', '/settings/:path*'],
};
