'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authenticatedFetch } from "@/lib/fetch-utils";
import { formatDateToStorage } from "@/lib/dateUtils";
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
import { CheckCircle2, User, CreditCard, FileCheck, ChevronRight, ChevronLeft, Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";


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
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string>("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  // Estado de cuenta (Auth) para clientes existentes
  const [accountExists, setAccountExists] = useState<boolean | null>(null);
  const [accountCheckLoading, setAccountCheckLoading] = useState(false);
  const [accountCreateLoading, setAccountCreateLoading] = useState(false);
  const [accountError, setAccountError] = useState<string>("");
  const [newAccPassword, setNewAccPassword] = useState<string>("");
  const [showNewAccPassword, setShowNewAccPassword] = useState(false);

  // Reset step when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(clienteActual ? 1 : 1);
    } else {
      // Limpiar al cerrar el modal
      setCurrentStep(1);
      setPhotoFile(null);
      setPhotoPreview(null);
      setTempPassword("");
      setAccountExists(null);
      setAccountCheckLoading(false);
      setAccountCreateLoading(false);
      setAccountError("");
      setNewAccPassword("");
      setShowNewAccPassword(false);
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

  const uploadPhotoForClient = async (clientId: string | number): Promise<string | null> => {
    if (!photoFile) return null;
    try {
      setIsUploadingPhoto(true);
      const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const clientIdStr = String(clientId);
      const path = `clientes/${clientIdStr}/avatar-${Date.now()}.${ext}`;

      let publicUrl = '';

      if (onPhotoUpload) {
        publicUrl = await onPhotoUpload(clientId, photoFile);
        // Actualizar con Prisma API
        await authenticatedFetch(`/api/clientes/${clientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: publicUrl }),
        });
        setPhotoPreview(publicUrl);
      } else {
        // Subir a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type });

        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
        publicUrl = pub.publicUrl;

        // Actualizar con Prisma API en lugar de Supabase directamente
        const response = await authenticatedFetch(`/api/clientes/${clientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: publicUrl }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error actualizando avatar');
        }

        setPhotoPreview(publicUrl);
      }

      return publicUrl;
    } catch (err) {
      console.error('Error subiendo foto:', err);
      throw err; // Re-lanzar el error para que se maneje en el formulario
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!clienteActual?.id || !photoFile) return;
    await uploadPhotoForClient(clienteActual.id);
  };

  // Generar contraseña temporal = DNI del cliente
  const generatePassword = (): string => {
    const dni = form.getValues("dni") || "";
    setTempPassword(dni);
    return dni;
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
    } catch (err) {
      console.warn("No se pudo copiar la contraseña", err);
    }
  };

  const copyCurrentPassword = async () => {
    try {
      await navigator.clipboard.writeText(currentPassword);
    } catch (err) {
      console.warn("No se pudo copiar la contraseña", err);
    }
  };

  // Función para actualizar contraseña del cliente
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.trim().length < 6) {
      setPasswordChangeError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!clienteActual?.id) {
      setPasswordChangeError("Error: Cliente no identificado");
      return;
    }

    try {
      setPasswordChangeLoading(true);
      setPasswordChangeError("");
      setPasswordChangeSuccess(false);

      const response = await authenticatedFetch(
        `/api/clientes/${clienteActual.id}/password`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword })
        }
      );

      if (!response.ok) {
        const error = await response.json();

        // Manejo especial para usuario no encontrado en Supabase Auth
        if (error.code === 'USER_NOT_IN_AUTH') {
          throw new Error(
            'Este cliente no tiene una cuenta de acceso creada. ' +
            'Por favor, cree una nueva cuenta primero desde el formulario de registro.'
          );
        }

        throw new Error(error.error || 'Error al actualizar contraseña');
      }

      setCurrentPassword(newPassword);
      setNewPassword("");
      setPasswordChangeSuccess(true);
      setIsChangingPassword(false);

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setPasswordChangeSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setPasswordChangeError(error instanceof Error ? error.message : 'Error al actualizar contraseña');
    } finally {
      setPasswordChangeLoading(false);
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
      // Helper para convertir Date | null a string en formato yyyy-MM-dd
      const formatDate = (date: Date | string | null) => {
        // Usar la utilidad centralizada
        return formatDateToStorage(date);
      };

      // Debug: Log para ver qué formato tiene la fecha de nacimiento
      if (clienteActual.fecha_nacimiento) {
        console.log(
          "📅 Fecha de nacimiento del cliente:",
          clienteActual.fecha_nacimiento,
          "tipo:",
          typeof clienteActual.fecha_nacimiento,
          "formateada:",
          formatDate(clienteActual.fecha_nacimiento)
        );
      }

      // Cargar foto del cliente si existe
      if (clienteActual.avatar_url) {
        setPhotoPreview(clienteActual.avatar_url);
      }

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

      // Prefijar contraseña sugerida para crear cuenta = DNI
      setNewAccPassword(clienteActual.dni || "");

      // Verificar si el cliente ya tiene cuenta en Auth
      (async () => {
        try {
          setAccountCheckLoading(true);
          setAccountError("");
          const resp = await authenticatedFetch(`/api/clientes/${clienteActual.id}/account`, { method: 'GET' });
          const json = await resp.json();
          if (!resp.ok) {
            setAccountExists(null);
            setAccountError(json?.error || 'No se pudo verificar la cuenta');
          } else {
            setAccountExists(!!json.exists);
          }
        } catch (e: any) {
          setAccountExists(null);
          setAccountError(e?.message || 'No se pudo verificar la cuenta');
        } finally {
          setAccountCheckLoading(false);
        }
      })();
    } else {
      form.reset({
        nombre: "",
        email: "",
        telefono: "",
        dni: "",
        fecha_nacimiento: "",
        membresia_id: "",
        fecha_inicio: format(new Date(), "yyyy-MM-dd"), // Fecha de hoy por defecto
        fecha_fin: "",
      });
      // Limpiar preview de foto cuando se crea un nuevo cliente
      setPhotoPreview(null);
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
          const resp = await authenticatedFetch('/api/clientes/validar-dni', {
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

        // Solo crear cuenta si es un NUEVO cliente (no hay clienteActual)
        if (!clienteActual) {
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
        }

        onOpenChange(false);
        setCurrentStep(1); // Reset para próxima vez
      } else {
        await onSubmit(values);
        if (photoFile && clienteActual?.id) {
          await uploadPhotoForClient(clienteActual.id);
        }

        // Solo crear cuenta si es un NUEVO cliente (no hay clienteActual)
        if (!clienteActual) {
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
    <>
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
            <div className="flex items-center justify-center px-4 sm:px-8 mb-2">
              <div className="flex items-center w-full max-w-2xl">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          // Solo permitir navegar a pasos ya visitados o al paso actual
                          if (step <= currentStep) {
                            setCurrentStep(step);
                          }
                        }}
                        disabled={step > currentStep}
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${step === currentStep
                          ? "border-primary bg-primary text-primary-foreground shadow-md scale-110"
                          : step < currentStep
                            ? "border-primary bg-primary text-primary-foreground hover:scale-105 cursor-pointer"
                            : "border-muted bg-muted text-muted-foreground cursor-not-allowed"
                          }`}
                      >
                        {step < currentStep ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          getStepIcon(step)
                        )}
                      </button>
                      <span className={`text-xs mt-2 font-medium text-center max-w-[80px] leading-tight ${step === currentStep ? "text-primary" : "text-muted-foreground"
                        } hidden sm:block`}>
                        {getStepTitle(step)}
                      </span>
                    </div>
                    {step < totalSteps && (
                      <div
                        className={`h-0.5 flex-1 mx-2 transition-all ${step < currentStep ? "bg-primary" : "bg-muted"
                          }`}
                      />
                    )}
                  </div>
                ))}
              </div>
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
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-2 border-primary/20">
                            <AvatarImage
                              src={photoPreview || clienteActual?.avatar_url || undefined}
                              alt={form.getValues("nombre")}
                            />
                            <AvatarFallback className="text-xl font-semibold bg-primary/5">
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
                          {photoPreview && !clienteActual?.avatar_url?.startsWith(photoPreview) && (
                            <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <Label htmlFor="foto" className="text-base font-semibold">
                              Foto de perfil <span className="text-xs text-muted-foreground">(opcional)</span>
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Soporta: JPG, PNG, GIF (máx. 5MB)
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              id="foto"
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="cursor-pointer"
                            />
                            {photoFile && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPhotoFile(null);
                                  setPhotoPreview(clienteActual?.avatar_url || null);
                                }}
                              >
                                Limpiar
                              </Button>
                            )}
                          </div>
                          {photoFile && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Nueva foto seleccionada
                            </p>
                          )}
                        </div>
                      </div>                      {/* Campos del formulario */}
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
                                <DatePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Selecciona fecha de nacimiento"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {autoCreateAccount && (
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="col-span-2 hidden">
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
                      )}
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
                                <DatePicker
                                  value={field.value}
                                  onChange={(val) => {
                                    field.onChange(val);
                                    const memId = form.getValues("membresia_id");
                                    const mem = membresiasDisponibles.find(
                                      (m) => m.id === memId
                                    );
                                    if (val && mem?.duracion) {
                                      const dt = parse(val, "yyyy-MM-dd", new Date());
                                      const fin = format(
                                        addMonths(dt, mem.duracion),
                                        "yyyy-MM-dd"
                                      );
                                      form.setValue("fecha_fin", fin);
                                    }
                                  }}
                                  placeholder="Selecciona fecha de inicio"
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
                                <DatePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  disabled
                                  placeholder="Calculada automáticamente"
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
                              {(() => {
                                const fecha = form.getValues("fecha_nacimiento");
                                if (!fecha || fecha.trim() === "") return "-";
                                try {
                                  return format(parse(fecha, "yyyy-MM-dd", new Date()), "dd/MM/yyyy");
                                } catch {
                                  return "-";
                                }
                              })()}
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
                              {(() => {
                                const fecha = form.getValues("fecha_inicio");
                                if (!fecha || fecha.trim() === "") return "-";
                                try {
                                  return format(parse(fecha, "yyyy-MM-dd", new Date()), "dd/MM/yyyy");
                                } catch {
                                  return "-";
                                }
                              })()}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Vencimiento:
                            </span>
                            <p className="font-medium">
                              {(() => {
                                const fecha = form.getValues("fecha_fin");
                                if (!fecha || fecha.trim() === "") return "-";
                                try {
                                  return format(parse(fecha, "yyyy-MM-dd", new Date()), "dd/MM/yyyy");
                                } catch {
                                  return "-";
                                }
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Información de acceso */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-4">Información de Acceso</h4>
                        <div className="space-y-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Usuario:</span>
                            <p className="font-mono font-semibold">{form.getValues("dni")}</p>
                          </div>

                          {/* Sección de contraseña */}
                          {clienteActual ? (
                            <div className="space-y-3 pt-2">
                              {accountCheckLoading ? (
                                <p className="text-xs text-muted-foreground">Verificando cuenta...</p>
                              ) : accountExists === false ? (
                                <div className="space-y-2">
                                  <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                                    <p className="text-amber-800 text-sm">Este cliente no tiene cuenta creada.</p>
                                  </div>
                                  <Label htmlFor="new-acc-password">Crear contraseña (sugerida: DNI)</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      id="new-acc-password"
                                      type={showNewAccPassword ? 'text' : 'password'}
                                      value={newAccPassword}
                                      onChange={(e) => setNewAccPassword(e.target.value)}
                                      className="font-mono"
                                      placeholder="Mínimo 6 caracteres"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setShowNewAccPassword(!showNewAccPassword)}
                                      title={showNewAccPassword ? 'Ocultar' : 'Mostrar'}
                                    >
                                      {showNewAccPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={async () => { try { await navigator.clipboard.writeText(newAccPassword); } catch { } }}
                                      title="Copiar contraseña"
                                      disabled={!newAccPassword}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {newAccPassword && newAccPassword.length < 6 && (
                                    <p className="text-xs text-red-500">La contraseña debe tener al menos 6 caracteres</p>
                                  )}
                                  {accountError && (
                                    <p className="text-xs text-red-600">{accountError}</p>
                                  )}
                                  <Button
                                    type="button"
                                    onClick={async () => {
                                      if (!clienteActual?.id) return;
                                      if (!newAccPassword || newAccPassword.length < 6) {
                                        setAccountError('La contraseña debe tener al menos 6 caracteres');
                                        return;
                                      }
                                      try {
                                        setAccountCreateLoading(true);
                                        setAccountError('');
                                        const resp = await authenticatedFetch(`/api/clientes/${clienteActual.id}/account`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ password: newAccPassword })
                                        });
                                        const json = await resp.json();
                                        if (!resp.ok || !json.ok) {
                                          throw new Error(json?.error || 'No se pudo crear la cuenta');
                                        }
                                        setAccountExists(true);
                                        setCurrentPassword(newAccPassword);
                                      } catch (e: any) {
                                        setAccountError(e?.message || 'No se pudo crear la cuenta');
                                      } finally {
                                        setAccountCreateLoading(false);
                                      }
                                    }}
                                    disabled={accountCreateLoading || (newAccPassword?.length || 0) < 6}
                                  >
                                    {accountCreateLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <span className="text-muted-foreground">Contraseña Actual:</span>
                                    <div className="flex gap-2 mt-1">
                                      <Input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        readOnly
                                        className="font-mono bg-background"
                                        placeholder="No disponible"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        title={showCurrentPassword ? "Ocultar" : "Mostrar"}
                                      >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={copyCurrentPassword}
                                        disabled={!currentPassword}
                                        title="Copiar contraseña"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsChangingPassword(true)}
                                    className="w-full"
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Cambiar Contraseña
                                  </Button>
                                </>
                              )}
                            </div>
                          ) : (
                            // Creación: mostrar contraseña temporal a generar
                            <div>
                              <span className="text-muted-foreground">Contraseña Temporal:</span>
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
                                  size="icon"
                                  onClick={() => setShowPassword(!showPassword)}
                                  title={showPassword ? "Ocultar" : "Mostrar"}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={copyPassword}
                                  disabled={!tempPassword}
                                  title="Copiar contraseña"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              {!tempPassword && (
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  onClick={generatePassword}
                                  className="mt-2 px-0"
                                >
                                  Generar contraseña
                                </Button>
                              )}
                            </div>
                          )}
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

      {/* Dialog para cambiar contraseña */}
      <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa la nueva contraseña para {form.getValues("nombre")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña *</Label>
              <div className="flex gap-2">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordChangeError("");
                  }}
                  placeholder="Mínimo 6 caracteres"
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? "Ocultar" : "Mostrar"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-xs text-red-500">La contraseña debe tener al menos 6 caracteres</p>
              )}
              {newPassword.length >= 6 && (
                <p className="text-xs text-green-500">✓ Contraseña válida</p>
              )}
            </div>

            {passwordChangeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {passwordChangeError}
              </div>
            )}

            {passwordChangeSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Contraseña actualizada correctamente
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsChangingPassword(false);
                setNewPassword("");
                setPasswordChangeError("");
                setPasswordChangeSuccess(false);
              }}
              disabled={passwordChangeLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={passwordChangeLoading || newPassword.length < 6}
            >
              {passwordChangeLoading ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
