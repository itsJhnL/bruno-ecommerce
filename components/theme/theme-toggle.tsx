"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useTheme, type ThemeChoice } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils/cn";

const OPTIONS: { value: ThemeChoice; label: string; icon: LucideIcon; hint: string }[] = [
  { value: "light", label: "Light", icon: Sun, hint: "Warm bone, frosted porcelain" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Obsidian, liquid glass" },
  { value: "system", label: "System", icon: Monitor, hint: "Follow your device" },
];

/**
 * Three-state theme control.
 *
 * A two-state toggle cannot express "follow my device", so this is a menu
 * rather than a switch. The trigger shows what is CURRENTLY RENDERED (sun or
 * moon); the menu shows what is CHOSEN (including System). Those are different
 * things, and conflating them is why most theme toggles feel wrong on a
 * system-set machine.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolved, setTheme, ready } = useTheme();
  const TriggerIcon = resolved === "light" ? Sun : Moon;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          "grid size-11 place-items-center rounded-full text-ink-secondary",
          "transition-colors duration-200 hover:bg-tint-strong hover:text-ink-primary",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line",
          "data-[state=open]:text-accent",
          className
        )}
        aria-label={`Theme: ${theme}. Change theme`}
      >
        {/* Until the client has read storage, render the default so the server
            and client markup agree. */}
        <TriggerIcon
          className={cn("size-[18px] transition-opacity", !ready && "opacity-70")}
          strokeWidth={1.5}
          aria-hidden
        />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className={cn(
            "z-50 w-60 overflow-hidden rounded-[16px] border border-hairline p-1.5",
            "bg-canvas-overlay/95 shadow-[0_28px_70px_-24px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
          )}
        >
          <DropdownMenu.Label className="eyebrow px-3 py-2.5">Appearance</DropdownMenu.Label>

          <DropdownMenu.RadioGroup
            value={theme}
            onValueChange={(value) => setTheme(value as ThemeChoice)}
          >
            {OPTIONS.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className={cn(
                  "group flex cursor-pointer items-center gap-3 rounded-[11px] px-3 py-2.5",
                  "text-sm text-ink-secondary outline-none transition-colors",
                  "data-[highlighted]:bg-tint-strong data-[highlighted]:text-ink-primary",
                  "data-[state=checked]:text-ink-primary"
                )}
              >
                <option.icon
                  className="size-4 shrink-0 text-accent-quiet group-data-[state=checked]:text-accent"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="flex-1">
                  <span className="block leading-tight">{option.label}</span>
                  <span className="mt-0.5 block text-[0.6875rem] leading-tight text-ink-muted">
                    {option.hint}
                  </span>
                </span>
                <DropdownMenu.ItemIndicator>
                  <Check className="size-3.5 text-accent" strokeWidth={2} aria-hidden />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
