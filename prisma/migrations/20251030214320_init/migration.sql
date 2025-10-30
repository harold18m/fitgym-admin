-- CreateEnum
CREATE TYPE "TipoMembresia" AS ENUM ('mensual', 'trimestral', 'anual');

-- CreateEnum
CREATE TYPE "ModalidadMembresia" AS ENUM ('diario', 'interdiario', 'libre');

-- CreateEnum
CREATE TYPE "EstadoCliente" AS ENUM ('activa', 'vencida', 'suspendida');

-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('presente', 'ausente', 'tardanza');

-- CreateEnum
CREATE TYPE "EstadoEvento" AS ENUM ('programado', 'completado', 'cancelado');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('clase', 'entrenamiento', 'evaluacion', 'otro');

-- CreateEnum
CREATE TYPE "EstadoRutina" AS ENUM ('activa', 'completada', 'pausada');

-- CreateEnum
CREATE TYPE "EstadoTarjeta" AS ENUM ('activa', 'inactiva', 'bloqueada');

-- CreateTable
CREATE TABLE "asistencias" (
    "id" UUID NOT NULL,
    "evento_id" UUID,
    "cliente_id" UUID NOT NULL,
    "fecha_asistencia" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'presente',
    "notas" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "dni" VARCHAR(20),
    "fecha_nacimiento" DATE NOT NULL,
    "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "membresia_id" UUID,
    "nombre_membresia" VARCHAR(255),
    "tipo_membresia" VARCHAR(50),
    "fecha_inicio" TIMESTAMPTZ(6),
    "fecha_fin" TIMESTAMPTZ(6),
    "estado" "EstadoCliente" NOT NULL DEFAULT 'activa',
    "asistencias" INTEGER NOT NULL DEFAULT 0,
    "avatar_url" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" UUID NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "fecha" DATE NOT NULL,
    "hora" TIME(6) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "cliente_id" UUID,
    "nombre_cliente" VARCHAR(255),
    "entrenador" VARCHAR(255),
    "duracion" INTEGER NOT NULL DEFAULT 60,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'programado',
    "max_participantes" INTEGER NOT NULL DEFAULT 1,
    "participantes_actuales" INTEGER NOT NULL DEFAULT 0,
    "precio" DECIMAL(10,2),
    "notas" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membresias" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "tipo" VARCHAR(20) NOT NULL,
    "modalidad" VARCHAR(20) NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "duracion" INTEGER NOT NULL,
    "caracteristicas" TEXT[],
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "clientes_activos" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "membresias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejercicios" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "categoria" VARCHAR(50),
    "dificultad" VARCHAR(20),
    "musculos" TEXT[],
    "descripcion" TEXT,
    "imagen_url" TEXT,
    "video_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ejercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email" TEXT,
    "nombre_completo" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutina_ejercicios" (
    "id" UUID NOT NULL,
    "rutina_id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "sets" INTEGER,
    "repeticiones" INTEGER,
    "dia" VARCHAR(20),
    "notas" TEXT,
    "orden" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rutina_ejercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutina_template_ejercicios" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "ejercicio_id" UUID,
    "nombre" VARCHAR(255),
    "sets" INTEGER,
    "repeticiones" INTEGER,
    "peso_sugerido" DECIMAL(10,2),
    "dia" VARCHAR(20),
    "notas" TEXT,
    "orden" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rutina_template_ejercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutina_templates" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "creado_por" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rutina_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutinas" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activa',
    "fecha_inicio" TIMESTAMPTZ(6),
    "fecha_fin" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rutinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarjetas_acceso" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "codigo" VARCHAR(64) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activa',
    "ultima_entrada" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tarjetas_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asistencias_cliente_id_idx" ON "asistencias"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_evento_id_cliente_id_key" ON "asistencias"("evento_id", "cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_dni_key" ON "clientes"("dni");

-- CreateIndex
CREATE INDEX "clientes_dni_idx" ON "clientes"("dni");

-- CreateIndex
CREATE INDEX "clientes_email_idx" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "clientes_estado_idx" ON "clientes"("estado");

-- CreateIndex
CREATE INDEX "clientes_membresia_id_idx" ON "clientes"("membresia_id");

-- CreateIndex
CREATE INDEX "clientes_deleted_at_idx" ON "clientes"("deleted_at");

-- CreateIndex
CREATE INDEX "eventos_cliente_id_idx" ON "eventos"("cliente_id");

-- CreateIndex
CREATE INDEX "membresias_activa_idx" ON "membresias"("activa");

-- CreateIndex
CREATE INDEX "ejercicios_categoria_idx" ON "ejercicios"("categoria");

-- CreateIndex
CREATE INDEX "ejercicios_dificultad_idx" ON "ejercicios"("dificultad");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_user_id_key" ON "perfiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tarjetas_acceso_cliente_id_key" ON "tarjetas_acceso"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "tarjetas_acceso_codigo_key" ON "tarjetas_acceso"("codigo");

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_membresia_id_fkey" FOREIGN KEY ("membresia_id") REFERENCES "membresias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutina_ejercicios" ADD CONSTRAINT "rutina_ejercicios_rutina_id_fkey" FOREIGN KEY ("rutina_id") REFERENCES "rutinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutina_template_ejercicios" ADD CONSTRAINT "rutina_template_ejercicios_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "rutina_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutinas" ADD CONSTRAINT "rutinas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarjetas_acceso" ADD CONSTRAINT "tarjetas_acceso_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
