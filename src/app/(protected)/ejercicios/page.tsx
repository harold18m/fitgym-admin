"use client";

import { useEffect, useState } from "react";
import { authenticatedGet, authenticatedPost, authenticatedFetch } from "@/lib/fetch-utils";
import {
  Dumbbell,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  PlayCircle,
  Heart,
  Scan,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// Tipos para los ejercicios
interface Ejercicio {
  id: string;
  nombre: string;
  categoria: string | null;
  dificultad: string | null;
  musculos: string[] | null;
  descripcion: string | null;
  imagen_url?: string | null;
}

// Datos de ejemplo
const ejerciciosIniciales: Ejercicio[] = [];

const coloresCategorias: { [key: string]: string } = {
  fuerza: "bg-blue-100 text-blue-800",
  cardio: "bg-red-100 text-red-800",
  flexibilidad: "bg-green-100 text-green-800",
  core: "bg-purple-100 text-purple-800",
  equilibrio: "bg-yellow-100 text-yellow-800",
};

const coloresDificultad: { [key: string]: string } = {
  principiante: "bg-green-100 text-green-800",
  intermedio: "bg-yellow-100 text-yellow-800",
  avanzado: "bg-red-100 text-red-800",
};

export default function Ejercicios() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [ejercicioActual, setEjercicioActual] = useState<Ejercicio | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [formNombre, setFormNombre] = useState("");
  const [formCategoria, setFormCategoria] = useState<string | null>(null);
  const [formDificultad, setFormDificultad] = useState<string | null>(null);
  const [formMusculosStr, setFormMusculosStr] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const json = await authenticatedGet<{ ejercicios: Ejercicio[] }>('/api/ejercicios');
        setEjercicios(json.ejercicios || []);
      } catch (e) {
        console.error('Error cargando ejercicios', e);
      }
    };
    load();
  }, []);

  const openNuevo = () => {
    setEjercicioActual(null);
    setFormNombre("");
    setFormCategoria(null);
    setFormDificultad(null);
    setFormMusculosStr("");
    setFormDescripcion("");
    setDialogoAbierto(true);
  };

  const openEditar = (ejercicio: Ejercicio) => {
    setEjercicioActual(ejercicio);
    setFormNombre(ejercicio.nombre || "");
    setFormCategoria(ejercicio.categoria || null);
    setFormDificultad(ejercicio.dificultad || null);
    setFormMusculosStr((ejercicio.musculos || []).join(", "));
    setFormDescripcion(ejercicio.descripcion || "");
    setDialogoAbierto(true);
  };

  const guardarEjercicio = async () => {
    try {
      setGuardando(true);
      const payload = {
        nombre: formNombre,
        categoria: formCategoria,
        dificultad: formDificultad,
        musculos: formMusculosStr,
        descripcion: formDescripcion,
      };
      let saved: any = null;
      if (ejercicioActual) {
        saved = await authenticatedFetch(`/api/ejercicios/${ejercicioActual.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }).then(r => r.json());
        setEjercicios(prev => prev.map(e => e.id === saved.id ? saved : e));
      } else {
        saved = await authenticatedPost('/api/ejercicios', payload);
        setEjercicios(prev => [saved, ...prev]);
      }
      setDialogoAbierto(false);
    } catch (e) {
      console.error(e);
      alert('Error guardando ejercicio');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarEjercicio = async (id: string) => {
    try {
      await authenticatedFetch(`/api/ejercicios/${id}`, { method: 'DELETE' });
      setEjercicios(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      console.error(e);
      alert('Error eliminando ejercicio');
    }
  };

  // Filtrado de ejercicios
  const ejerciciosFiltrados = ejercicios.filter((ejercicio) =>
    (ejercicio.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (ejercicio.categoria || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (ejercicio.musculos || []).some(musculo =>
      (musculo || '').toLowerCase().includes(busqueda.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ejercicios</h2>
          <p className="text-muted-foreground">
            Gestiona tu biblioteca de ejercicios
          </p>
        </div>
        <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openNuevo}>
              <Plus className="h-4 w-4" />
              Nuevo Ejercicio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {ejercicioActual ? "Editar Ejercicio" : "Crear Nuevo Ejercicio"}
              </DialogTitle>
              <DialogDescription>
                Completa los detalles del ejercicio a continuación.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" placeholder="Nombre del ejercicio" value={formNombre} onChange={e => setFormNombre(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select value={formCategoria || undefined} onValueChange={setFormCategoria as any}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fuerza">Fuerza</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="flexibilidad">Flexibilidad</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="equilibrio">Equilibrio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dificultad">Dificultad</Label>
                  <Select value={formDificultad || undefined} onValueChange={setFormDificultad as any}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="principiante">Principiante</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="musculos">Músculos trabajados</Label>
                <Input id="musculos" placeholder="pecho, brazos, etc." value={formMusculosStr} onChange={e => setFormMusculosStr(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" placeholder="Describe el ejercicio y cómo realizarlo correctamente" value={formDescripcion} onChange={e => setFormDescripcion(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogoAbierto(false)}>
                Cancelar
              </Button>
              <Button onClick={guardarEjercicio} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4" />
        <Input placeholder="Buscar por nombre, categoría o músculo" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ejerciciosFiltrados.map((ej) => (
          <Card key={ej.id}>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Dumbbell className="h-4 w-4" />{ej.nombre}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditar(ej)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => eliminarEjercicio(ej.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{ej.descripcion || 'Sin descripción'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {ej.categoria && <Badge variant="outline">{ej.categoria}</Badge>}
                {ej.dificultad && <Badge variant="outline">{ej.dificultad}</Badge>}
                {(ej.musculos || []).map((m, idx) => (
                  <Badge key={idx} variant="secondary">{m}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
