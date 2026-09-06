"use client";

import type * as React from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

interface PendingActionProps {
  /** Which release wires this up. Shown to the user, verbatim. */
  phase: string;
  /** What the control will do once it works. */
  label: string;
  children: React.ReactElement;
  className?: string;
}

/**
 * Wraps a control that is deliberately not connected yet.
 *
 * Agents.md prime directive #1: never fake functionality. A control that looks
 * live and silently does nothing is worse than one that says so. This renders
 * the control disabled, marks it for assistive technology, and explains when it
 * will work.
 */
export function PendingAction({ phase, label, children, className }: PendingActionProps) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex", className)} tabIndex={0} role="group">
            <span aria-disabled className="pointer-events-none contents opacity-60">
              {children}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <span className="block font-medium text-ink-primary">Not connected yet</span>
          {label} arrives in {phase}. It is disabled rather than pretending to work.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
