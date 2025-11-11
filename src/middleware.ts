import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSupabaseToken, validateSupabaseToken, isAdmin } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    try {
        // Obtener el token de autenticación
        const token = getSupabaseToken(request);

        const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
        const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
            request.nextUrl.pathname.startsWith('/registro');
        const isPublicFile = request.nextUrl.pathname.startsWith('/_next') ||
            request.nextUrl.pathname.startsWith('/favicon') ||
            request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/);

        // Permitir archivos públicos y Next.js internos
        if (isPublicFile) {
            return NextResponse.next();
        }

        // Rutas API públicas (no requieren autenticación)
        const publicApiRoutes = [
            '/api/auth/verificar-admin',
            '/api/auth/registrar-primer-admin',
        ];

        const isPublicApiRoute = publicApiRoutes.some(route =>
            request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
        );

        // Si es una ruta API pública, permitir acceso inmediato
        if (isPublicApiRoute) {
            console.log('✅ [Middleware] Permitiendo acceso a ruta pública:', request.nextUrl.pathname);
            return NextResponse.next();
        }

        // Proteger rutas API (excepto las públicas)
        if (isApiRoute && !isPublicApiRoute) {
            if (!token) {
                return NextResponse.json(
                    {
                        error: 'No autenticado',
                        message: 'Debes iniciar sesión para acceder a este recurso.'
                    },
                    { status: 401 }
                );
            }

            // Validar el token
            const validation = await validateSupabaseToken(token);

            if (!validation.valid) {
                return NextResponse.json(
                    {
                        error: 'Token inválido',
                        message: validation.error || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
                    },
                    { status: 401 }
                );
            }

            // Verificar rol de admin
            if (!isAdmin(validation.user)) {
                return NextResponse.json(
                    {
                        error: 'Acceso denegado',
                        message: 'Se requiere rol de administrador para acceder a este recurso.'
                    },
                    { status: 403 }
                );
            }
        }

        // Proteger rutas de página (excepto login, registro, home)
        const isProtectedRoute = !isAuthRoute &&
            request.nextUrl.pathname !== '/' &&
            !isPublicFile;

        if (isProtectedRoute && !token) {
            const loginUrl = new URL('/login', request.url);
            // Guardar la URL a la que intentaba acceder
            loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Si el usuario está autenticado y intenta acceder a login/registro, redirigir al dashboard
        if (token && isAuthRoute) {
            // Verificar si hay un redirect query param
            const redirectUrl = request.nextUrl.searchParams.get('redirect');
            if (redirectUrl && redirectUrl.startsWith('/')) {
                return NextResponse.redirect(new URL(redirectUrl, request.url));
            }
            return NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);

        // En caso de error, permitir continuar pero loggear el error
        // Para rutas API, retornar error 500
        if (request.nextUrl.pathname.startsWith('/api/')) {
            return NextResponse.json(
                {
                    error: 'Error interno',
                    message: 'Hubo un problema procesando tu solicitud.'
                },
                { status: 500 }
            );
        }

        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
