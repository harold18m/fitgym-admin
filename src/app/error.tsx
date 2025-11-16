"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html>
            <body className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full space-y-4 text-center">
                    <h1 className="text-2xl font-bold">Algo salió mal</h1>
                    <p className="text-muted-foreground">{error.message || 'Error inesperado'}</p>
                    <div className="flex gap-2 justify-center">
                        <button className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={() => reset()}>Reintentar</button>
                        <button className="px-4 py-2 rounded border" onClick={() => location.assign('/')}>Ir al inicio</button>
                    </div>
                </div>
            </body>
        </html>
    );
}
