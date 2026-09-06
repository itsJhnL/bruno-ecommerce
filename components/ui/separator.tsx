import { cn } from "@/lib/utils/cn";

/** A hairline that fades at both ends — the house's section divider. */
export function Separator({ className }: { className?: string }) {
  return <div role="separator" className={cn("rule-fade", className)} />;
}
