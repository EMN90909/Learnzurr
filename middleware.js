import { NextResponse } from 'next/server';

export function middleware(request) {
  if (request.headers.get('x-forwarded-proto') === 'http') {
    const url = request.url.replace('http://', 'https://');
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
