"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DISPLAY_FORMAT = "dd/MM/yyyy";
const STORAGE_FORMAT = "yyyy-MM-dd";

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecciona una fecha",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Tratar strings vacíos como undefined y validar formato
  const normalizedValue = value && value.trim() !== "" ? value : undefined;

  // Intentar parsear la fecha de forma segura
  let selected: Date | undefined;
  let displayText = placeholder;

  if (normalizedValue) {
    try {
      const parsedDate = parse(normalizedValue, STORAGE_FORMAT, new Date());
      // Verificar que la fecha sea válida
      if (!isNaN(parsedDate.getTime())) {
        selected = parsedDate;
        displayText = format(parsedDate, DISPLAY_FORMAT, { locale: es });
      }
    } catch (error) {
      console.warn("Error parseando fecha:", normalizedValue, error);
      // Si hay error, simplemente no establecemos la fecha
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full pl-3 text-left font-normal",
            !normalizedValue && "text-muted-foreground",
            className
          )}
        >
          {displayText}
          <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[100] pointer-events-auto" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            const next = date ? format(date, STORAGE_FORMAT) : "";
            onChange?.(next);
            if (date) setOpen(false);
          }}
          locale={es}
          initialFocus
          captionLayout="dropdown"
          fromYear={1900}
          toYear={new Date().getFullYear()}
          defaultMonth={selected || new Date(2000, 0)}
        />
      </PopoverContent>
    </Popover>
  );
}

DatePicker.displayName = "DatePicker";
