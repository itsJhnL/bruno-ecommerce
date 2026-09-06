import { Badge } from "@/components/ui/badge";

/**
 * One vocabulary for order state, so a status never reads differently on the
 * list than it does on the order itself.
 *
 * The label is the customer's language, not the database's: `UNFULFILLED` is
 * an internal fact, "Being prepared" is what somebody waiting for a coat
 * actually wants to know.
 */

const ORDER_STATUS: Record<
  string,
  { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" }
> = {
  PENDING: { label: "Awaiting payment", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  PROCESSING: { label: "Being prepared", tone: "accent" },
  SHIPPED: { label: "On its way", tone: "accent" },
  DELIVERED: { label: "Delivered", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const entry = ORDER_STATUS[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS[status]?.label ?? status;
}

/**
 * The steps a customer is shown, and which one an order has reached.
 * Cancelled and refunded orders have no progress to show — returning null
 * says so rather than drawing a timeline that stopped meaning anything.
 */
export function orderProgress(status: string): { steps: string[]; reached: number } | null {
  if (status === "CANCELLED" || status === "REFUNDED") return null;

  const steps = ["Paid", "Being prepared", "On its way", "Delivered"];
  const reached =
    status === "DELIVERED" ? 3 : status === "SHIPPED" ? 2 : status === "PROCESSING" ? 1 : 0;

  return { steps, reached };
}
