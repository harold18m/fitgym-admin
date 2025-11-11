"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function PerfilPage() {
  const { user } = useAuth();
  const meta = (user?.user_metadata as any) || {};
  const avatar = meta.avatar_url || meta.picture || "";
  const nombre = meta.full_name || meta.name || "Usuario";
  const email = user?.email ?? "";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatar} alt={email || nombre} />
              <AvatarFallback>{(email || nombre || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{nombre}</h2>
              <p className="text-muted-foreground">{email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">Google</Badge>
                <Badge>Authenticated</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ID de usuario</p>
              <p className="font-mono text-sm break-all">{user?.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Proveedor</p>
              <p>Google</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p>{nombre}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{email}</p>
            </div>
          </div>
          <div className="pt-4">
            <Button variant="outline">Editar perfil (próximamente)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}