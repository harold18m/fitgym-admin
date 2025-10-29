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
import type { clientes } from "@prisma/client";
import { supabase } from "@/lib/supabase";
import { format, addMonths, parse } from "date-fns";
import QRCode from "react-qr-code";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { CheckCircle2, User, CreditCard, FileCheck, ChevronRight, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  clienteActual: clientes | null;
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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      dni: "",
      fecha_nacimiento: "",
      membresia_id: "",
      fecha_inicio: format(new Date(), "yyyy-MM-dd"),
      fecha_fin: "",
    },
  });

  const [tempPassword, setTempPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Reset step when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(clienteActual ? 1 : 1);
    }
  }, [isOpen, clienteActual]);

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
      // Helper para convertir Date | null a string
      const formatDate = (date: Date | null) => {
        if (!date) return "";
        return date instanceof Date ? format(date, "yyyy-MM-dd") : date;
      };

      form.reset({
        nombre: clienteActual.nombre,
        email: clienteActual.email,
        telefono: clienteActual.telefono,
        dni: clienteActual.dni || "",
        fecha_nacimiento: formatDate(clienteActual.fecha_nacimiento),
        membresia_id: clienteActual.membresia_id || "",
        fecha_inicio: formatDate(clienteActual.fecha_inicio),
        fecha_fin: formatDate(clienteActual.fecha_fin),
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
            setCurrentStep(1); // Volver al paso 1
            return
          }
          if (result.exists) {
            form.setError('dni', {
              type: 'manual',
              message: 'El DNI ya está registrado'
            })
            setCurrentStep(1); // Volver al paso 1
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
            setCurrentStep(1);
            return
          }
          if (json.exists) {
            form.setError('dni', {
              type: 'manual',
              message: 'El DNI ya está registrado'
            })
            setCurrentStep(1);
            return
          }
        }
      } catch (err: any) {
        form.setError('dni', {
          type: 'manual',
          message: `Error de conexión al validar DNI: ${err?.message || 'desconocido'}`
        })
        setCurrentStep(1);
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
        const finalEmail = values.email;
        const finalPassword = tempPassword || generatePassword();
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
        setCurrentStep(1); // Reset para próxima vez
      } else {
        await onSubmit(values);
        if (photoFile && clienteActual?.id) {
          await uploadPhotoForClient(clienteActual.id);
        }
        const finalEmail = values.email;
        const finalPassword = tempPassword || generatePassword();
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
        setCurrentStep(1);
      }
    } catch (e) {
      console.warn('Error al guardar cliente o subir foto:', e);
    }
  });

  // Validar paso actual antes de avanzar
  const validateCurrentStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      // Validar campos del paso 1
      isValid = await form.trigger(['nombre', 'telefono', 'dni', 'fecha_nacimiento']);
    } else if (currentStep === 2) {
      // Validar campos del paso 2
      isValid = await form.trigger(['membresia_id', 'fecha_inicio']);
    } else if (currentStep === 3) {
      // Paso 3 es solo revisión
      isValid = true;
    }

    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepIcon = (step: number) => {
    if (step === 1) return <User className="h-5 w-5" />;
    if (step === 2) return <CreditCard className="h-5 w-5" />;
    if (step === 3) return <FileCheck className="h-5 w-5" />;
    return null;
  };

  const getStepTitle = (step: number) => {
    if (step === 1) return "Información Personal";
    if (step === 2) return "Membresía";
    if (step === 3) return "Revisión";
    return "";
  };

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
              : `Paso ${currentStep} de ${totalSteps}: ${getStepTitle(currentStep)}`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        {!clienteActual && (
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${step === currentStep
                        ? "border-primary bg-primary text-primary-foreground"
                        : step < currentStep
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted bg-muted text-muted-foreground"
                      }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      getStepIcon(step)
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium hidden sm:block">
                    {getStepTitle(step)}
                  </span>
                </div>
                {step < totalSteps && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${step < currentStep ? "bg-primary" : "bg-muted"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Paso 1: Información Personal */}
            {(clienteActual || currentStep === 1) && (
              <div className={currentStep === 1 || clienteActual ? "block" : "hidden"}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Información Personal
                    </CardTitle>
                    <CardDescription>
                      Datos básicos del cliente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Foto de perfil */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage
                          src={photoPreview || clienteActual?.avatar_url || undefined}
                        />
                        <AvatarFallback className="text-lg">
                          {form.getValues("nombre")
                            ? form
                              .getValues("nombre")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="foto">Foto de perfil (opcional)</Label>
                        <Input
                          id="foto"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                        />
                      </div>
                    </div>

                    {/* Campos del formulario */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre completo *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Juan Pérez García"
                                {...field}
                              />
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
                            <FormLabel>DNI *</FormLabel>
                            <FormControl>
                              <Input placeholder="12345678" {...field} />
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
                            <FormLabel>Teléfono *</FormLabel>
                            <FormControl>
                              <Input placeholder="999 999 999" {...field} />
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
                            <FormLabel>Fecha de nacimiento *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (generado automáticamente)</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-muted" />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Se genera automáticamente como: dni@{dniEmailDomain}
                          </p>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Paso 2: Membresía */}
            {(clienteActual || currentStep === 2) && (
              <div className={currentStep === 2 || clienteActual ? "block" : "hidden"}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Membresía
                    </CardTitle>
                    <CardDescription>
                      Selecciona el plan y fechas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="membresia_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan de membresía *</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              const start = form.getValues("fecha_inicio");
                              const mem = membresiasDisponibles.find(
                                (m) => m.id === val
                              );
                              if (start && mem?.duracion) {
                                const dt = parse(start, "yyyy-MM-dd", new Date());
                                const fin = format(
                                  addMonths(dt, mem.duracion),
                                  "yyyy-MM-dd"
                                );
                                form.setValue("fecha_fin", fin);
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una membresía" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {membresiasDisponibles.map((membresia) => (
                                <SelectItem key={membresia.id} value={membresia.id}>
                                  <div className="flex flex-col py-1">
                                    <div className="font-medium">
                                      {membresia.nombre}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      S/ {membresia.precio} •{" "}
                                      {membresia.duracion
                                        ? `${membresia.duracion} ${membresia.duracion === 1 ? "mes" : "meses"
                                        }`
                                        : membresia.tipo}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fecha_inicio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de inicio *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  const memId = form.getValues("membresia_id");
                                  const mem = membresiasDisponibles.find(
                                    (m) => m.id === memId
                                  );
                                  const val = e.target.value;
                                  if (val && mem?.duracion) {
                                    const dt = parse(val, "yyyy-MM-dd", new Date());
                                    const fin = format(
                                      addMonths(dt, mem.duracion),
                                      "yyyy-MM-dd"
                                    );
                                    form.setValue("fecha_fin", fin);
                                  }
                                }}
                              />
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
                            <FormLabel>Fecha de vencimiento</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                readOnly
                                className="bg-muted"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Calculada automáticamente
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Paso 3: Revisión */}
            {(clienteActual || currentStep === 3) && (
              <div className={currentStep === 3 || clienteActual ? "block" : "hidden"}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5" />
                      Revisión y Confirmación
                    </CardTitle>
                    <CardDescription>
                      Verifica los datos antes de guardar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Resumen de datos personales */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Datos Personales
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nombre:</span>
                          <p className="font-medium">
                            {form.getValues("nombre") || "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">DNI:</span>
                          <p className="font-medium">
                            {form.getValues("dni") || "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Teléfono:</span>
                          <p className="font-medium">
                            {form.getValues("telefono") || "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Fecha de nacimiento:
                          </span>
                          <p className="font-medium">
                            {form.getValues("fecha_nacimiento")
                              ? format(
                                parse(
                                  form.getValues("fecha_nacimiento"),
                                  "yyyy-MM-dd",
                                  new Date()
                                ),
                                "dd/MM/yyyy"
                              )
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Resumen de membresía */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Membresía
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Plan:</span>
                          <p className="font-medium">
                            {membresiasDisponibles.find(
                              (m) => m.id === form.getValues("membresia_id")
                            )?.nombre || "No seleccionado"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Precio:</span>
                          <p className="font-medium">
                            S/{" "}
                            {membresiasDisponibles.find(
                              (m) => m.id === form.getValues("membresia_id")
                            )?.precio || "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Inicio:</span>
                          <p className="font-medium">
                            {form.getValues("fecha_inicio")
                              ? format(
                                parse(
                                  form.getValues("fecha_inicio") || "",
                                  "yyyy-MM-dd",
                                  new Date()
                                ),
                                "dd/MM/yyyy"
                              )
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Vencimiento:
                          </span>
                          <p className="font-medium">
                            {form.getValues("fecha_fin")
                              ? format(
                                parse(
                                  form.getValues("fecha_fin") || "",
                                  "yyyy-MM-dd",
                                  new Date()
                                ),
                                "dd/MM/yyyy"
                              )
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Información de acceso */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Información de Acceso</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-mono">{form.getValues("email")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Contraseña temporal:
                          </span>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={tempPassword}
                              readOnly
                              className="font-mono bg-background"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? "Ocultar" : "Mostrar"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={copyPassword}
                            >
                              Copiar
                            </Button>
                          </div>
                          {!tempPassword && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={generatePassword}
                              className="mt-1 px-0"
                            >
                              Generar contraseña
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {!clienteActual && currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              )}

              <div className="flex-1" />

              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
              </DialogClose>

              {!clienteActual && currentStep < totalSteps && (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="w-full sm:w-auto"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}

              {(clienteActual || currentStep === totalSteps) && (
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Guardando..."
                    : clienteActual
                      ? "Actualizar"
                      : "Guardar Cliente"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
