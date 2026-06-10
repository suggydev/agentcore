import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/agents', request.url));
  }

  if (pathname !== '/login' && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/agents/:path*', '/chat/:path*', '/onboarding/:path*', '/login', '/knowledge/:path*', '/settings/:path*'],
};
