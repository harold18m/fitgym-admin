'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
type Cliente = {
  id: string | number;
  nombre: string;
  email: string;
  telefono: string;
  dni: string | null;
  fecha_nacimiento: string | null;
  membresia_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  avatar_url?: string | null;
};
import { format, addMonths, parse } from "date-fns";
import QRCode from "react-qr-code";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
// Usamos el datepicker nativo del navegador con Input type="date"


export const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
  telefono: z.string().min(9, { message: "El teléfono debe tener al menos 9 caracteres" }),
  dni: z
    .string()
    .min(1, { message: "El DNI es requerido" })
    .refine((val) => /^\d{7,20}$/.test(val), {
      message: "El DNI debe contener entre 7 y 20 dígitos",
    }),
  fecha_nacimiento: z.string().min(1, { message: "La fecha de nacimiento es requerida" }),
  membresia_id: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

interface ClienteFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
  clienteActual: Cliente | null;
  membresiasDisponibles: { id: string; nombre: string; precio: number; tipo: string; modalidad: string; duracion?: number }[];
  saveCliente?: (values: FormValues, options?: { closeDialog?: boolean }) => Promise<any>;
  onValidateDni?: (dni: string, excludeId?: string | number | null) => Promise<{ ok: boolean; exists: boolean; error?: string }>;
  onCreateAccount?: (email: string, password: string, values: FormValues) => Promise<void>;
  autoCreateAccount?: boolean;
  dniEmailDomain?: string;
  onPhotoUpload?: (clientId: string | number, file: File) => Promise<string>;
}

export function ClienteForm({
  isOpen,
  onOpenChange,
  onSubmit,
  clienteActual,
  membresiasDisponibles,
  saveCliente,
  onValidateDni,
  onCreateAccount,
  autoCreateAccount = true,
  dniEmailDomain = 'fitgym.com.pe',
  onPhotoUpload,
}: ClienteFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      dni: "",
      fecha_nacimiento: "",
      membresia_id: "",
      fecha_inicio: format(new Date(), "yyyy-MM-dd"), // Fecha de hoy por defecto
      fecha_fin: "",
    },
  });

  const [tempPassword, setTempPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  };

  const uploadPhotoForClient = async (clientId: string | number) => {
    if (!photoFile) return;
    try {
      setIsUploadingPhoto(true);
      const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const clientIdStr = String(clientId);
      const path = `clientes/${clientIdStr}/avatar-${Date.now()}.${ext}`;
      if (onPhotoUpload) {
        const publicUrl = await onPhotoUpload(clientId, photoFile);
        const { error: updateError } = await supabase
          .from('clientes')
          .update({ avatar_url: publicUrl })
          .eq('id', clientId);
        if (updateError) throw updateError;
        setPhotoPreview(publicUrl);
      } else {
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
        const publicUrl = pub.publicUrl;
        const { error: updateError } = await supabase
          .from('clientes')
          .update({ avatar_url: publicUrl })
          .eq('id', clientId);
        if (updateError) throw updateError;
        setPhotoPreview(publicUrl);
      }
    } catch (err) {
      console.error('Error subiendo foto:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!clienteActual?.id || !photoFile) return;
    await uploadPhotoForClient(clienteActual.id);
  };

  // Generar contraseña temporal amigable
  const generatePassword = (): string => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const pass = Array.from({ length: 10 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join("");
    setTempPassword(pass);
    return pass;
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
    } catch (err) {
      console.warn("No se pudo copiar la contraseña", err);
    }
  };

  // Función para calcular fecha de vencimiento
  const calcularFechaVencimiento = (membresiaId: string) => {
    const membresiaSeleccionada = membresiasDisponibles.find(m => m.id === membresiaId);
    if (membresiaSeleccionada && membresiaSeleccionada.duracion) {
      const fechaInicioStr = form.getValues("fecha_inicio") || format(new Date(), "yyyy-MM-dd");
      const fechaInicio = parse(fechaInicioStr, "yyyy-MM-dd", new Date());
      const fechaVencimiento = addMonths(fechaInicio, membresiaSeleccionada.duracion);
      return format(fechaVencimiento, "yyyy-MM-dd");
    }
    return "";
  };

  // Efecto para actualizar fecha de vencimiento cuando cambia la membresía o fecha de inicio
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "membresia_id" || name === "fecha_inicio") {
        if (value.membresia_id && value.fecha_inicio) {
          const fechaVencimiento = calcularFechaVencimiento(value.membresia_id);
          if (fechaVencimiento) {
            form.setValue("fecha_fin", fechaVencimiento);
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, membresiasDisponibles]);

  useEffect(() => {
    if (clienteActual) {
      form.reset({
        nombre: clienteActual.nombre,
        email: clienteActual.email,
        telefono: clienteActual.telefono,
        dni: clienteActual.dni || "",
        fecha_nacimiento: clienteActual.fecha_nacimiento || "",
        membresia_id: clienteActual.membresia_id || "",
        fecha_inicio: clienteActual.fecha_inicio ? clienteActual.fecha_inicio.split('T')[0] : "",
        fecha_fin: clienteActual.fecha_fin ? clienteActual.fecha_fin.split('T')[0] : "",
      });
    } else {
      form.reset({
        nombre: "",
        email: "",
        telefono: "",
        fecha_nacimiento: "",
        membresia_id: "",
        fecha_inicio: format(new Date(), "yyyy-MM-dd"), // Fecha de hoy por defecto
        fecha_fin: "",
      });
    }
  }, [clienteActual, form]);

  // Sincroniza el email con el DNI para crear cuenta (dni@fitgym.com.pe)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "dni") {
        const dniVal = (value.dni || "").trim();
        if (dniVal) {
          const generatedEmail = `${dniVal}@${dniEmailDomain}`;
          form.setValue("email", generatedEmail, { shouldValidate: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, dniEmailDomain]);


  const handleSubmit = form.handleSubmit(async (values) => {
    const dni = (values.dni || "").trim();
    if (dni) {
      try {
        if (onValidateDni) {
          const result = await onValidateDni(dni, clienteActual?.id ?? null);
          if (!result.ok) {
            form.setError('dni', {
              type: 'manual',
              message: `Error verificando DNI: ${result.error || 'Desconocido'}`
            })
            return
          }
          if (result.exists) {
            form.setError('dni', {
              type: 'manual',
              message: 'El DNI ya está registrado'
            })
            return
          }
        } else {
          const resp = await fetch('/api/clientes/validar-dni', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dni, excludeId: clienteActual?.id ?? null })
          })
          const json = await resp.json()
          if (!resp.ok || !json.ok) {
            form.setError('dni', {
              type: 'manual',
              message: `Error verificando DNI: ${json.error || resp.statusText}`
            })
            return
          }
          if (json.exists) {
            form.setError('dni', {
              type: 'manual',
              message: 'El DNI ya está registrado'
            })
            return
          }
        }
      } catch (err: any) {
        form.setError('dni', {
          type: 'manual',
          message: `Error de conexión al validar DNI: ${err?.message || 'desconocido'}`
        })
        return
      }
    }
    // Guardar y subir foto si corresponde
    try {
      if (saveCliente) {
        const saved = await saveCliente(values, { closeDialog: false });
        if (photoFile && saved?.id) {
          await uploadPhotoForClient(saved.id);
        }
        // Crear cuenta en Supabase Auth usando email generado y contraseña temporal (configurable)
        const finalEmail = values.email;
        const finalPassword = tempPassword || (typeof generatePassword === 'function' ? generatePassword() : '');
        if (autoCreateAccount && finalEmail && finalPassword) {
          try {
            if (onCreateAccount) {
              await onCreateAccount(finalEmail, finalPassword, values);
            } else {
              await supabase.auth.signUp({
                email: finalEmail,
                password: finalPassword,
                options: {
                  data: { role: 'cliente', dni: values.dni || null, nombre: values.nombre }
                }
              });
            }
          } catch (authErr) {
            console.warn('No se pudo crear la cuenta en Auth:', authErr);
          }
        }
        onOpenChange(false);
      } else {
        await onSubmit(values);
        if (photoFile && clienteActual?.id) {
          await uploadPhotoForClient(clienteActual.id);
        }
        // Crear cuenta en Supabase Auth para flujo onSubmit directo (configurable)
        const finalEmail = values.email;
        const finalPassword = tempPassword || (typeof generatePassword === 'function' ? generatePassword() : '');
        if (autoCreateAccount && finalEmail && finalPassword) {
          try {
            if (onCreateAccount) {
              await onCreateAccount(finalEmail, finalPassword, values);
            } else {
              await supabase.auth.signUp({
                email: finalEmail,
                password: finalPassword,
                options: {
                  data: { role: 'cliente', dni: values.dni || null, nombre: values.nombre }
                }
              });
            }
          } catch (authErr) {
            console.warn('No se pudo crear la cuenta en Auth:', authErr);
          }
        }
        onOpenChange(false);
      }
    } catch (e) {
      console.warn('Error al guardar cliente o subir foto:', e);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {clienteActual ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {clienteActual
              ? "Modifica los datos del cliente"
              : "Completa los datos para registrar un nuevo cliente"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <Tabs defaultValue="datos" className="space-y-6">
              <TabsList>
                <TabsTrigger value="datos">Datos personales</TabsTrigger>
                <TabsTrigger value="membresia">Membresía</TabsTrigger>
                <TabsTrigger value="acceso">Acceso</TabsTrigger>
              </TabsList>

              <TabsContent value="datos" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Datos personales</CardTitle>
                    <CardDescription>Foto, nombre, contacto y documento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={photoPreview || clienteActual?.avatar_url || undefined} />
                        <AvatarFallback>
                          {form.getValues('nombre')
                            ? form.getValues('nombre').split(' ').map(n => n[0]).join('')
                            : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Label className="text-sm" htmlFor="foto">Foto de perfil</Label>
                        <Input id="foto" type="file" accept="image/*" className="text-sm" onChange={handlePhotoChange} />
                        <div className="flex gap-2">
                          <Button type="button" onClick={handleUploadPhoto} disabled={!clienteActual || !photoFile || isUploadingPhoto} aria-label="Subir foto" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleUploadPhoto(); } }}>
                            {isUploadingPhoto ? 'Subiendo...' : 'Subir foto'}
                          </Button>
                          {!clienteActual && (
                            <span className="text-xs text-muted-foreground">Guarda el cliente para habilitar la subida de foto.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* campos de datos personales existentes */}
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Nombre completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Juan Pérez" className="text-sm" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Celular o teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="999 999 999" className="text-sm" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dni"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">DNI</FormLabel>
                            <FormControl>
                              <Input placeholder="12345678" className="text-sm" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fecha_nacimiento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Fecha de nacimiento</FormLabel>
                            <FormControl>
                              <Input type="date" className="text-sm" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="membresia" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Membresía</CardTitle>
                    <CardDescription>Selecciona la membresía y fecha de inicio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="membresia_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Membresía</FormLabel>
                            <Select onValueChange={(val) => {
                              field.onChange(val);
                              const start = form.getValues("fecha_inicio");
                              const mem = membresiasDisponibles.find((m) => m.id === val);
                              if (start && mem?.duracion) {
                                const dt = parse(start, "yyyy-MM-dd", new Date());
                                const fin = format(addMonths(dt, mem.duracion), "yyyy-MM-dd");
                                form.setValue("fecha_fin", fin);
                              }
                            }} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Selecciona una membresía" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {membresiasDisponibles.map((membresia) => (
                                  <SelectItem key={membresia.id} value={membresia.id}>
                                    <div className="flex flex-col">
                                      <div className="font-medium text-sm">{membresia.nombre}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {membresia.tipo.charAt(0).toUpperCase() + membresia.tipo.slice(1)} • {membresia.modalidad.charAt(0).toUpperCase() + membresia.modalidad.slice(1)} • S/ {membresia.precio}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fecha_inicio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Fecha de inicio</FormLabel>
                            <FormControl>
                              <Input type="date" className="text-sm" {...field} onChange={(e) => {
                                field.onChange(e.target.value);
                                const memId = form.getValues("membresia_id");
                                const mem = membresiasDisponibles.find((m) => m.id === memId);
                                const val = e.target.value;
                                if (val && mem?.duracion) {
                                  const dt = parse(val, "yyyy-MM-dd", new Date());
                                  const fin = format(addMonths(dt, mem.duracion), "yyyy-MM-dd");
                                  form.setValue("fecha_fin", fin);
                                }
                              }} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fecha_fin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Fecha de vencimiento</FormLabel>
                            <FormControl>
                              <Input type="date" className="text-sm" {...field} readOnly disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="acceso" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Acceso</CardTitle>
                    <CardDescription>Cuenta, contraseña y código QR</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-rows-2 gap-4">
                      <div className="space-y-3">
                        <FormItem>
                          <FormLabel className="text-sm">DNI (para cuenta)</FormLabel>
                          <FormControl>
                            <Input className="text-sm" value={form.getValues("dni")} readOnly />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormLabel className="text-sm">Contraseña temporal</FormLabel>
                          <div className="flex gap-2">
                            <Input className="text-sm" type={showPassword ? "text" : "password"} value={tempPassword} readOnly />
                            <Button type="button" variant="secondary" onClick={() => setShowPassword((s) => !s)}>
                              {showPassword ? "Ocultar" : "Mostrar"}
                            </Button>
                            <Button type="button" variant="outline" onClick={copyPassword}>
                              Copiar
                            </Button>
                            <Button type="button" onClick={generatePassword}>
                              Generar
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Comparte esta contraseña temporal por WhatsApp o email. No se almacena en el sistema.</p>
                        </FormItem>
                      </div>
                      <div>
                        <p className="font-medium text-sm mb-2">Código QR de asistencia</p>
                        {clienteActual ? (
                          <div className="mt-1 flex items-center gap-4">
                            <div className="bg-white p-3 rounded-md inline-block">
                              <QRCode value={`CLIENT:${clienteActual.id}`} size={128} />
                            </div>
                            <p className="text-xs text-muted-foreground max-w-[220px]">
                              Escanea este QR en la pantalla de Asistencia para registrar la entrada.
                            </p>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Guarda el cliente para generar su QR.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="w-full sm:w-auto text-sm">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto text-sm" disabled={form.formState.isSubmitting}>
                  {clienteActual ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
