import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, UserCheck } from "lucide-react";

interface RutinaTemplate {
  id: string;
  nombre: string;
  descripcion: string | null;
}

interface TemplateEjercicio {
  id: string;
  rutina_template_id: string;
  ejercicio_id?: string | null;
  nombre: string;
  series?: number | null;
  repeticiones?: number | null;
  dia?: string | null;
  peso_sugerido?: number | null;
  notas?: string | null;
  orden?: number | null;
}

interface Cliente {
  id: string;
  nombre: string;
  avatar_url?: string | null;
  nombre_membresia?: string | null;
}

export default function Rutinas() {
  const [templates, setTemplates] = useState<RutinaTemplate[]>([]);
  const [q, setQ] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [selected, setSelected] = useState<RutinaTemplate | null>(null);
  const [ejercicios, setEjercicios] = useState<TemplateEjercicio[]>([]);
  const [loadingEjercicios, setLoadingEjercicios] = useState(false);

  const [formNombre, setFormNombre] = useState("");
  const [formSeries, setFormSeries] = useState<string>("");
  const [formReps, setFormReps] = useState<string>("");
  const [formDia, setFormDia] = useState<string>("");
  const [formPeso, setFormPeso] = useState<string>("");
  const [formNotas, setFormNotas] = useState<string>("");
  const [formOrden, setFormOrden] = useState<string>("");
  const [addingEjercicio, setAddingEjercicio] = useState(false);

  const [clienteQ, setClienteQ] = useState("");
  const [clienteResultados, setClienteResultados] = useState<Cliente[]>([]);
  const [searchingCliente, setSearchingCliente] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const res = await fetch(`/api/rutina-templates${q ? `?q=${encodeURIComponent(q)}` : ""}`);
        const json = await res.json();
        setTemplates(json.templates || []);
      } catch (e) {
        console.error("Error cargando plantillas", e);
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, [q]);

  const openNew = () => {
    setNewNombre("");
    setNewDescripcion("");
    setIsNewOpen(true);
  };

  const createTemplate = async () => {
    try {
      if (!newNombre.trim()) return;
      setSavingTemplate(true);
      const res = await fetch("/api/rutina-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newNombre.trim(), descripcion: newDescripcion.trim() || null }),
      });
      const json = await res.json();
      if (json?.id) {
        setTemplates((prev) => [{ id: json.id, nombre: json.nombre, descripcion: json.descripcion ?? null }, ...prev]);
        setSelected({ id: json.id, nombre: json.nombre, descripcion: json.descripcion ?? null });
        setIsNewOpen(false);
      }
    } catch (e) {
      console.error("Error creando plantilla", e);
    } finally {
      setSavingTemplate(false);
    }
  };

  const selectTemplate = async (t: RutinaTemplate) => {
    setSelected(t);
    setLoadingEjercicios(true);
    try {
      const res = await fetch(`/api/rutina-templates/${t.id}`);
      const json = await res.json();
      setEjercicios(json.ejercicios || []);
    } catch (e) {
      console.error("Error cargando ejercicios de plantilla", e);
    } finally {
      setLoadingEjercicios(false);
    }
  };

  const addEjercicio = async () => {
    if (!selected) return;
    if (!formNombre.trim()) return;
    setAddingEjercicio(true);
    try {
      const payload: any = {
        nombre: formNombre.trim(),
        series: formSeries ? Number(formSeries) : null,
        repeticiones: formReps ? Number(formReps) : null,
        dia: formDia || null,
        peso_sugerido: formPeso ? Number(formPeso) : null,
        notas: formNotas || null,
        orden: formOrden ? Number(formOrden) : null,
      };
      const res = await fetch(`/api/rutina-templates/${selected.id}/ejercicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json?.id) {
        setEjercicios((prev) => [...prev, json]);
        setFormNombre("");
        setFormSeries("");
        setFormReps("");
        setFormDia("");
        setFormPeso("");
        setFormNotas("");
        setFormOrden("");
      }
    } catch (e) {
      console.error("Error agregando ejercicio", e);
    } finally {
      setAddingEjercicio(false);
    }
  };

  const deleteEjercicio = async (eid: string) => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/rutina-templates/${selected.id}/ejercicios/${eid}`, { method: "DELETE" });
      if (res.ok) {
        setEjercicios((prev) => prev.filter((e) => e.id !== eid));
      }
    } catch (e) {
      console.error("Error eliminando ejercicio", e);
    }
  };

  const buscarClientes = async () => {
    setSearchingCliente(true);
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(clienteQ)}`);
      const json = await res.json();
      setClienteResultados(json || []);
    } catch (e) {
      console.error("Error buscando clientes", e);
    } finally {
      setSearchingCliente(false);
    }
  };

  const asignarACliente = async (cliente_id: string) => {
    if (!selected) return;
    setAssigning(cliente_id);
    try {
      const res = await fetch(`/api/rutina-templates/${selected.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id }),
      });
      const json = await res.json();
      if (json?.ok) {
        // Simple feedback visual
        setClienteResultados((prev) => prev.map((c) => (c.id === cliente_id ? { ...c } : c)));
      }
    } catch (e) {
      console.error("Error asignando rutina", e);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Rutinas</h2>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Plantilla
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Plantillas</CardTitle>
            <CardDescription>Busca y selecciona una plantilla</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Buscar por nombre"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button variant="secondary" disabled={loadingTemplates}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin plantillas</p>
              ) : (
                templates.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded border cursor-pointer ${selected?.id === t.id ? "border-primary" : "border-muted"}`}
                    onClick={() => selectTemplate(t)}
                  >
                    <div className="font-medium">{t.nombre}</div>
                    {t.descripcion && (
                      <div className="text-sm text-muted-foreground">{t.descripcion}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalle de Plantilla</CardTitle>
            <CardDescription>Agrega ejercicios y asigna a clientes</CardDescription>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground">Selecciona una plantilla para editar</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="font-semibold mb-2">Ejercicios</div>
                  {loadingEjercicios ? (
                    <p className="text-sm text-muted-foreground">Cargando...</p>
                  ) : ejercicios.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin ejercicios</p>
                  ) : (
                    <div className="space-y-2">
                      {ejercicios.map((e) => (
                        <div key={e.id} className="flex items-center justify-between border rounded p-2">
                          <div className="space-y-1">
                            <div className="font-medium">{e.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {e.dia ? <Badge variant="outline">{e.dia}</Badge> : null}
                              {e.series ? <Badge variant="outline" className="ml-2">{e.series} series</Badge> : null}
                              {e.repeticiones ? <Badge variant="outline" className="ml-2">{e.repeticiones} reps</Badge> : null}
                              {e.peso_sugerido ? <Badge variant="outline" className="ml-2">{e.peso_sugerido} kg</Badge> : null}
                              {e.orden ? <Badge variant="outline" className="ml-2">Orden {e.orden}</Badge> : null}
                            </div>
                            {e.notas && (
                              <div className="text-xs text-muted-foreground">Notas: {e.notas}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {/* Edición posterior */}
                            <Button variant="secondary" disabled>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" onClick={() => deleteEjercicio(e.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="font-semibold">Agregar ejercicio</div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                    <Input placeholder="Nombre" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />
                    <Input placeholder="Series" value={formSeries} onChange={(e) => setFormSeries(e.target.value)} />
                    <Input placeholder="Reps" value={formReps} onChange={(e) => setFormReps(e.target.value)} />
                    <Input placeholder="Día" value={formDia} onChange={(e) => setFormDia(e.target.value)} />
                    <Input placeholder="Peso (kg)" value={formPeso} onChange={(e) => setFormPeso(e.target.value)} />
                    <Input placeholder="Orden" value={formOrden} onChange={(e) => setFormOrden(e.target.value)} />
                    <Input className="md:col-span-6" placeholder="Notas" value={formNotas} onChange={(e) => setFormNotas(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={addEjercicio} disabled={addingEjercicio}>
                      <Plus className="mr-2 h-4 w-4" /> Agregar
                    </Button>
                    <Link href="/ejercicios">Ver biblioteca de ejercicios</Link>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold">Asignar a cliente</div>
                  <div className="flex gap-2">
                    <Input placeholder="Buscar cliente (nombre/email/DNI)" value={clienteQ} onChange={(e) => setClienteQ(e.target.value)} />
                    <Button onClick={buscarClientes} disabled={searchingCliente}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {clienteResultados.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin resultados</p>
                    ) : (
                      clienteResultados.map((c) => (
                        <div key={c.id} className="flex items-center justify-between border rounded p-2">
                          <div>
                            <div className="font-medium">{c.nombre}</div>
                            {c.nombre_membresia && (
                              <div className="text-xs text-muted-foreground">{c.nombre_membresia}</div>
                            )}
                          </div>
                          <Button onClick={() => asignarACliente(c.id)} disabled={assigning === c.id}>
                            <UserCheck className="mr-2 h-4 w-4" /> Asignar
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Plantilla</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={newNombre} onChange={(e) => setNewNombre(e.target.value)} placeholder="Ej: Día 1: Pecho y Tríceps" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={newDescripcion} onChange={(e) => setNewDescripcion(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createTemplate} disabled={savingTemplate}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}