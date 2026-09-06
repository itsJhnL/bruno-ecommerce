import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-12 w-full rounded-[12px] border border-hairline-strong bg-tint px-4 text-sm",
        "text-ink-primary backdrop-blur-md transition-colors duration-200",
        "placeholder:text-ink-muted hover:border-hairline-strong",
        "focus:border-accent-line/50 focus:outline-2 focus:outline-offset-2 focus:outline-accent-line",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
