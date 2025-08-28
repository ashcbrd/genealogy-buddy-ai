import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Public routes that don't require any authentication
    const publicRoutes = [
      '/api/auth',
      '/login',
      '/register', 
      '/',
      '/_next',
      '/favicon',
      '/robots.txt',
      '/sitemap.xml'
    ];
    
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Protected routes that require authentication
    const protectedRoutes = [
      '/dashboard',
      '/profile',
      '/subscription',
      '/tools',
      '/api/dashboard',
      '/api/profile',
      '/api/upload',
      '/api/documents',
      '/api/photos',
      '/api/tools'
    ];
    
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    
    if (isProtectedRoute) {
      // These routes require authentication, handled by withAuth
      return NextResponse.next();
    }

    // All other routes are accessible to both authenticated and anonymous users
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes that don't require authentication
        const publicRoutes = [
          '/api/auth',
          '/login',
          '/register',
          '/',
          '/_next',
          '/favicon',
          '/robots.txt',
          '/sitemap.xml'
        ];
        
        const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
        if (isPublicRoute) {
          return true;
        }

        // Protected routes require a valid token
        const protectedRoutes = [
          '/dashboard',
          '/profile', 
          '/subscription',
          '/tools',
          '/api/dashboard',
          '/api/profile',
          '/api/upload',
          '/api/documents',
          '/api/photos',
          '/api/tools'
        ];
        
        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
        
        if (isProtectedRoute) {
          return !!token; // Require authentication token
        }

        // All other routes are accessible
        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};