import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AsistenciaLoading() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header skeleton */}
            <div className="flex flex-col gap-2">
                <Skeleton className="h-9 w-80" />
                <Skeleton className="h-5 w-96" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Registro Card skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>

                {/* Lista asistencias skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
