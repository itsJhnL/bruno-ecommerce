"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "left" | "right" | "bottom";
  }
>(({ className, children, side = "right", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim/80 backdrop-blur-sm" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col gap-6 border border-hairline bg-canvas-overlay/95 p-6",
        "shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl",
        side === "right" && "inset-y-0 right-0 w-full max-w-sm",
        side === "left" && "inset-y-0 left-0 w-full max-w-sm",
        side === "bottom" && "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-[24px]",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-5 top-5 grid size-9 place-items-center rounded-full border border-hairline text-ink-secondary transition-colors hover:bg-tint-strong hover:text-ink-primary"
        aria-label="Close"
      >
        <X className="size-4" strokeWidth={1.5} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";
