import { formatPrice } from "@/lib/utils/format";
import { SITE, siteUrl } from "@/lib/utils/site";
import type { OrderSummary } from "@/types";

/**
 * Transactional email bodies.
 *
 * Plain, table-based HTML with inline styles, because email clients support
 * almost nothing else — no flexbox, no grid, no external stylesheet. Every
 * template also returns a text part; a message with no text alternative is
 * scored as spam and is unreadable on a watch.
 */

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const INK = "#14120e";
const MUTED = "#6e6960";
const LINE = "#e4ded2";
const PAPER = "#f7f4ee";

const shell = (title: string, body: string, preheader: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:16px;">
<tr><td style="padding:32px 32px 20px;text-align:center;border-bottom:1px solid ${LINE};">
<div style="font-family:Futura,'Century Gothic',Helvetica,Arial,sans-serif;font-size:22px;letter-spacing:8px;color:${INK};">BRUNO</div>
<div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#9c7a34;margin-top:6px;">${escapeHtml(
  SITE.tagline
)}</div>
</td></tr>
<tr><td style="padding:32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:${INK};">
${body}
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid ${LINE};font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};text-align:center;">
${escapeHtml(SITE.address)}<br>
<a href="mailto:${escapeHtml(SITE.email)}" style="color:${MUTED};">${escapeHtml(SITE.email)}</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background:${INK};border-radius:12px;">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#ffffff;text-decoration:none;">${escapeHtml(
    label
  )}</a></td></tr></table>`;

const row = (label: string, value: string, bold = false) =>
  `<tr>
<td style="padding:6px 0;color:${bold ? INK : MUTED};font-size:14px;">${escapeHtml(label)}</td>
<td style="padding:6px 0;text-align:right;font-size:14px;color:${INK};${
    bold ? "font-weight:600;" : ""
  }">${escapeHtml(value)}</td>
</tr>`;

function itemsTable(order: OrderSummary): string {
  const lines = order.lines
    .map(
      (line) => `<tr>
<td style="padding:12px 0;border-bottom:1px solid ${LINE};">
  <div style="font-size:14px;color:${INK};">${escapeHtml(line.name)}</div>
  ${
    line.variantTitle
      ? `<div style="font-size:12px;color:${MUTED};margin-top:2px;">${escapeHtml(
          line.variantTitle
        )}</div>`
      : ""
  }
  <div style="font-size:12px;color:${MUTED};margin-top:2px;">Quantity ${line.quantity}</div>
</td>
<td style="padding:12px 0;border-bottom:1px solid ${LINE};text-align:right;font-size:14px;color:${INK};white-space:nowrap;">
  ${escapeHtml(formatPrice(line.lineTotal, order.currency))}
</td></tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">${lines}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
${row("Subtotal", formatPrice(order.subtotal, order.currency))}
${
  order.discountTotal > 0
    ? row(
        order.couponCode ? `Discount (${order.couponCode})` : "Discount",
        `−${formatPrice(order.discountTotal, order.currency)}`
      )
    : ""
}
${row(
  order.shippingMethod ? `Shipping — ${order.shippingMethod}` : "Shipping",
  order.shippingTotal === 0 ? "Complimentary" : formatPrice(order.shippingTotal, order.currency)
)}
${order.taxTotal > 0 ? row("Tax", formatPrice(order.taxTotal, order.currency)) : ""}
${row("Total", formatPrice(order.grandTotal, order.currency), true)}
</table>`;
}

function addressBlock(order: OrderSummary): string {
  const a = order.shippingAddress;
  if (!a) return "";
  const parts = [
    `${a.firstName} ${a.lastName}`,
    a.company,
    a.line1,
    a.line2,
    `${a.city}${a.region ? `, ${a.region}` : ""} ${a.postalCode}`,
    a.countryCode,
  ].filter(Boolean) as string[];

  return `<div style="margin-top:28px;font-size:13px;line-height:1.6;color:${MUTED};">
<div style="text-transform:uppercase;letter-spacing:2px;font-size:10px;color:${INK};margin-bottom:8px;">Shipping to</div>
${parts.map(escapeHtml).join("<br>")}
</div>`;
}

function itemsText(order: OrderSummary): string {
  return order.lines
    .map(
      (line) =>
        `  ${line.quantity} × ${line.name}${line.variantTitle ? ` (${line.variantTitle})` : ""} — ${formatPrice(
          line.lineTotal,
          order.currency
        )}`
    )
    .join("\n");
}

/* -------------------------------------------------------------------------- */
/* Customer                                                                    */
/* -------------------------------------------------------------------------- */

export function orderConfirmation(order: OrderSummary): EmailContent {
  const name = order.shippingAddress?.firstName ?? "there";
  const href = siteUrl(`/account/orders/${order.id}`);

  return {
    subject: `Your BRUNO order ${order.orderNumber}`,
    html: shell(
      `Order ${order.orderNumber}`,
      `<p style="margin:0 0 16px;">Thank you, ${escapeHtml(name)}.</p>
<p style="margin:0 0 8px;">We have your order and payment. Each piece is checked by hand before it leaves us, so allow a day for that before dispatch.</p>
<p style="margin:0;color:${MUTED};font-size:13px;">Order ${escapeHtml(order.orderNumber)}</p>
${itemsTable(order)}
${addressBlock(order)}
${button(href, "View your order")}
<p style="margin:0;font-size:13px;color:${MUTED};">You will hear from us again when it ships.</p>`,
      `Order ${order.orderNumber} confirmed — ${formatPrice(order.grandTotal, order.currency)}`
    ),
    text: `Thank you, ${name}.

We have your order and payment.

Order ${order.orderNumber}
${itemsText(order)}

Subtotal: ${formatPrice(order.subtotal, order.currency)}
${order.discountTotal > 0 ? `Discount: -${formatPrice(order.discountTotal, order.currency)}\n` : ""}Shipping: ${
      order.shippingTotal === 0 ? "Complimentary" : formatPrice(order.shippingTotal, order.currency)
    }
${order.taxTotal > 0 ? `Tax: ${formatPrice(order.taxTotal, order.currency)}\n` : ""}Total: ${formatPrice(
      order.grandTotal,
      order.currency
    )}

View your order: ${href}

${SITE.name} — ${SITE.email}`,
  };
}

export function orderShipped(order: OrderSummary): EmailContent {
  const name = order.shippingAddress?.firstName ?? "there";
  const track = order.trackingUrl ?? siteUrl(`/account/orders/${order.id}`);

  return {
    subject: `Your BRUNO order ${order.orderNumber} has shipped`,
    html: shell(
      `Order ${order.orderNumber} shipped`,
      `<p style="margin:0 0 16px;">${escapeHtml(name)}, your order is on its way.</p>
${
  order.trackingNumber
    ? `<p style="margin:0 0 8px;">${escapeHtml(order.carrier ?? "Carrier")} · ${escapeHtml(
        order.trackingNumber
      )}</p>`
    : ""
}
${button(track, "Track your parcel")}
${itemsTable(order)}`,
      `${order.orderNumber} is on its way`
    ),
    text: `${name}, your order ${order.orderNumber} is on its way.
${order.trackingNumber ? `\n${order.carrier ?? "Carrier"}: ${order.trackingNumber}` : ""}

Track it: ${track}`,
  };
}

export function orderDelivered(order: OrderSummary): EmailContent {
  return {
    subject: `Your BRUNO order ${order.orderNumber} has arrived`,
    html: shell(
      `Order ${order.orderNumber} delivered`,
      `<p style="margin:0 0 16px;">Your order has been delivered.</p>
<p style="margin:0 0 8px;">If anything is not right, reply to this message within thirty days and we will put it right.</p>
${button(siteUrl(`/account/orders/${order.id}`), "View your order")}`,
      `${order.orderNumber} delivered`
    ),
    text: `Your order ${order.orderNumber} has been delivered.

If anything is not right, reply within thirty days.

${siteUrl(`/account/orders/${order.id}`)}`,
  };
}

export function refundConfirmation(order: OrderSummary, amount: number): EmailContent {
  return {
    subject: `Refund issued for ${order.orderNumber}`,
    html: shell(
      `Refund for ${order.orderNumber}`,
      `<p style="margin:0 0 16px;">We have refunded ${escapeHtml(
        formatPrice(amount, order.currency)
      )} against order ${escapeHtml(order.orderNumber)}.</p>
<p style="margin:0;color:${MUTED};font-size:13px;">Banks usually take five to ten working days to show it.</p>`,
      `Refund of ${formatPrice(amount, order.currency)} issued`
    ),
    text: `We have refunded ${formatPrice(amount, order.currency)} against order ${order.orderNumber}.

Banks usually take five to ten working days to show it.`,
  };
}

export function welcome(email: string): EmailContent {
  return {
    subject: "Welcome to BRUNO",
    html: shell(
      "Welcome",
      `<p style="margin:0 0 16px;">Your account is ready.</p>
<p style="margin:0 0 8px;">You can now track orders, save addresses and keep a wishlist.</p>
${button(siteUrl("/account"), "Go to your account")}`,
      "Your BRUNO account is ready"
    ),
    text: `Your BRUNO account is ready.\n\n${siteUrl("/account")}\n\nSigned in as ${email}.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Staff                                                                       */
/* -------------------------------------------------------------------------- */

export function adminNewOrder(order: OrderSummary): EmailContent {
  return {
    subject: `New order ${order.orderNumber} — ${formatPrice(order.grandTotal, order.currency)}`,
    html: shell(
      `New order ${order.orderNumber}`,
      `<p style="margin:0 0 16px;">${escapeHtml(order.email)} placed order ${escapeHtml(
        order.orderNumber
      )}.</p>
${itemsTable(order)}
${addressBlock(order)}
${button(siteUrl(`/admin/orders/${order.id}`), "Open in the dashboard")}`,
      `${order.email} — ${formatPrice(order.grandTotal, order.currency)}`
    ),
    text: `New order ${order.orderNumber} from ${order.email}.

${itemsText(order)}

Total: ${formatPrice(order.grandTotal, order.currency)}

${siteUrl(`/admin/orders/${order.id}`)}`,
  };
}

export function adminLowStock(
  items: { product: string; variant: string; remaining: number }[]
): EmailContent {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:14px;">${escapeHtml(
          i.product
        )} — ${escapeHtml(i.variant)}</td><td style="padding:8px 0;border-bottom:1px solid ${LINE};text-align:right;font-size:14px;">${
          i.remaining
        } left</td></tr>`
    )
    .join("");

  return {
    subject: `Low stock on ${items.length} ${items.length === 1 ? "variant" : "variants"}`,
    html: shell(
      "Low stock",
      `<p style="margin:0 0 16px;">These have reached their low-stock threshold.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
${button(siteUrl("/admin/inventory"), "Open inventory")}`,
      `${items.length} low on stock`
    ),
    text: `Low stock:\n${items
      .map((i) => `  ${i.product} — ${i.variant}: ${i.remaining} left`)
      .join("\n")}\n\n${siteUrl("/admin/inventory")}`,
  };
}

export function adminPaymentFailed(orderNumber: string, reason: string): EmailContent {
  return {
    subject: `Payment failed on ${orderNumber}`,
    html: shell(
      "Payment failed",
      `<p style="margin:0 0 16px;">Order ${escapeHtml(orderNumber)} was not paid.</p>
<p style="margin:0;color:${MUTED};font-size:13px;">${escapeHtml(reason)}</p>
<p style="margin:16px 0 0;font-size:13px;color:${MUTED};">The reservation has been released back to stock.</p>`,
      `${orderNumber} was not paid`
    ),
    text: `Order ${orderNumber} was not paid.\n\n${reason}\n\nThe reservation has been released back to stock.`,
  };
}
