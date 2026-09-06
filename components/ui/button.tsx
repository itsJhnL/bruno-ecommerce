import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  // Base: 44px minimum hit area, visible focus, never a bare outline:none.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium " +
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line " +
    "disabled:pointer-events-none disabled:opacity-45 active:scale-[0.985] " +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-solid text-ink-inverse hover:bg-accent-solid-hover " +
          "shadow-[0_10px_30px_-12px_rgba(201,169,106,0.6)]",
        outline:
          "border border-hairline-strong bg-tint text-ink-primary backdrop-blur-md " +
          "hover:bg-tint-strong hover:border-hairline-strong",
        ghost: "text-ink-secondary hover:text-ink-primary hover:bg-tint",
        link:
          "text-accent underline-offset-[6px] hover:underline decoration-accent-quiet p-0 h-auto",
      },
      size: {
        sm: "h-10 rounded-[10px] px-4 text-[0.8125rem]",
        md: "h-12 rounded-[12px] px-6 text-sm",
        lg: "h-14 rounded-[14px] px-8 text-[0.9375rem]",
        icon: "size-11 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
);
Button.displayName = "Button";

export { buttonVariants };
