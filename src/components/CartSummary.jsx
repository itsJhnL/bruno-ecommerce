const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export default function CartSummary({
  subtotal,
  shipping,
  total,
  buttonLabel,
  onSubmit,
  disabled
}) {
  return (
    <div className="rounded-[1.75rem] border border-brand-900/8 bg-white/85 p-6 shadow-soft">
      <h3 className="text-xl font-semibold text-brand-900">Order Summary</h3>
      <div className="mt-6 space-y-4 border-y border-brand-900/10 py-5">
        <Row label="Subtotal" value={currency.format(subtotal)} />
        <Row label="Shipping" value={currency.format(shipping)} />
        <Row label="Total" value={currency.format(total)} strong />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="mt-6 w-full rounded-full bg-brand-900 px-6 py-3 text-sm font-semibold text-stone-50 transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={strong ? "font-semibold text-brand-900" : "text-brand-600"}>
        {label}
      </span>
      <span
        className={
          strong ? "text-base font-semibold text-brand-900" : "font-medium text-brand-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
