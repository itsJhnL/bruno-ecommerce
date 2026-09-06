import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
}

/**
 * Label, control, hint and error as one unit.
 *
 * The error is wired with `aria-describedby` and `aria-invalid` rather than
 * being merely red, because colour alone is not an error message. Optional
 * fields are marked; required ones are not, which is the way round that stops
 * a form reading as a wall of asterisks.
 */
export function Field({
  label,
  name,
  error,
  hint,
  optional,
  className,
  ...props
}: FieldProps) {
  const errorId = error ? `${name}-error` : undefined;
  const hintId = hint ? `${name}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="flex items-baseline justify-between gap-2 text-sm text-ink-secondary">
        <span>{label}</span>
        {optional && <span className="text-xs text-ink-muted">Optional</span>}
      </label>

      <Input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(error && "border-signal-danger/60")}
        {...props}
      />

      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-signal-danger">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * A native select. Deliberately not a Radix listbox: on a checkout form the
 * platform control is faster, works without JavaScript having settled, and is
 * what every mobile keyboard is built around.
 */
export function SelectField({
  label,
  name,
  error,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-sm text-ink-secondary">
        {label}
      </label>
      <select
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          "h-12 w-full appearance-none rounded-[12px] border border-hairline-strong bg-canvas-raised px-4 text-sm",
          "text-ink-primary transition-colors duration-200",
          "focus:border-accent-line/50 focus:outline-2 focus:outline-offset-2 focus:outline-accent-line",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-signal-danger/60"
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-signal-danger">
          {error}
        </p>
      )}
    </div>
  );
}
