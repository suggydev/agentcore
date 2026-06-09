import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/privacy', '/terms', '/pricing', '/offer', '/payment', '/refund', '/delivery', '/requisites', '/contacts', '/checkout', '/support'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/team/invite/')) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/agents/:path*', '/chat/:path*', '/onboarding/:path*', '/login', '/knowledge/:path*', '/settings/:path*', '/admin/:path*', '/billing/:path*', '/team/:path*', '/support/:path*'],
};
