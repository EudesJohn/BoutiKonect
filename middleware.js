import { NextResponse } from 'next/server';

export function middleware(request) {
  const responseHeaders = new Headers(request.headers);
  // Security headers
  responseHeaders.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none';");
  responseHeaders.set('X-Frame-Options', 'DENY');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  responseHeaders.set('Permissions-Policy', 'fullscreen=(), camera=(), microphone=()');
  responseHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  return NextResponse.next({
    request: {
      // preserve original request
    },
    response: {
      headers: responseHeaders,
    },
  });
}

export const config = {
  matcher: '/:path*',
};