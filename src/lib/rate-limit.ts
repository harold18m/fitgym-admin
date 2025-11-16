import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Configurar rate limiter distribuido con Redis
// 100 requests por 1 minuto por IP
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: '@fitgym/ratelimit',
});

export async function checkRateLimit(request: Request): Promise<NextResponse | null> {
    try {
        const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || '127.0.0.1';
        const { success, limit, reset, remaining } = await ratelimit.limit(ip);

        if (!success) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    limit,
                    remaining: 0,
                    reset: new Date(reset).toISOString()
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': reset.toString(),
                    }
                }
            );
        }

        // Añadir headers informativos incluso cuando pasa
        return null; // null = request permitido
    } catch (error) {
        console.error('Error en rate limiter:', error);
        // En caso de fallo de Redis, permitir el request (fail open)
        return null;
    }
}
