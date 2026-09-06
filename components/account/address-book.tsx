"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
  AddressFieldset,
  EMPTY_ADDRESS,
  type AddressDraft,
} from "@/components/checkout/address-fieldset";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { deleteAddress, saveAddress } from "@/lib/actions/account";
import { countryName } from "@/lib/utils/countries";
import { savedAddressSchema } from "@/lib/validations/auth";
import type { SavedAddress } from "@/lib/queries/account";

type Editing = { id?: string; draft: AddressDraft; label: string; isDefault: boolean } | null;

function toDraft(address: SavedAddress): AddressDraft {
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    region: address.region ?? "",
    postalCode: address.postalCode,
    countryCode: address.countryCode,
    phone: address.phone ?? "",
  };
}

export function AddressBook({ addresses }: { addresses: SavedAddress[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setFormError(null);
    setErrors({});

    const payload = {
      ...editing.draft,
      id: editing.id,
      label: editing.label,
      type: "SHIPPING" as const,
      isDefault: editing.isDefault,
    };

    const parsed = savedAddressSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (!next[path]) next[path] = issue.message;
      }
      setErrors(next);
      setFormError("Some details need attention.");
      return;
    }

    startTransition(async () => {
      const result = await saveAddress(payload);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setEditing(null);
    });
  };

  const remove = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      const result = await deleteAddress({ id });
      if (!result.ok) setFormError(result.error);
      setBusyId(null);
    });
  };

  if (editing) {
    return (
      <form onSubmit={submit} noValidate className="max-w-2xl space-y-6">
        <h3 className="display-s text-ink-primary">
          {editing.id ? "Edit address" : "Add an address"}
        </h3>

        <Field
          label="Label"
          name="label"
          value={editing.label}
          onChange={(e) => setEditing({ ...editing, label: e.target.value })}
          optional
          hint="Home, studio, your mother's — whatever helps you pick it at checkout."
          disabled={pending}
          className="max-w-xs"
        />

        <AddressFieldset
          prefix="saved"
          value={editing.draft}
          errors={errors}
          onChange={(draft) => setEditing({ ...editing, draft })}
          disabled={pending}
        />

        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-secondary">
          <input
            type="checkbox"
            checked={editing.isDefault}
            onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
            disabled={pending}
            className="size-4 accent-(--color-accent-solid)"
          />
          Use this as my default delivery address
        </label>

        {formError && (
          <p role="alert" className="text-sm text-signal-danger">
            {formError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />}
            Save address
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEditing(null)}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h3 className="display-s text-ink-primary">Addresses</h3>
        <Button
          size="sm"
          onClick={() =>
            setEditing({ draft: { ...EMPTY_ADDRESS }, label: "", isDefault: addresses.length === 0 })
          }
        >
          <Plus className="size-4" strokeWidth={1.75} />
          Add
        </Button>
      </div>

      {formError && (
        <p role="alert" className="mt-4 text-sm text-signal-danger">
          {formError}
        </p>
      )}

      {addresses.length === 0 ? (
        <div className="glass-pane mt-8 rounded-card p-8 text-center">
          <p className="text-sm text-ink-secondary">No addresses saved yet.</p>
          <p className="mt-2 text-xs text-ink-tertiary">
            Save one and checkout fills itself in.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="glass-pane flex flex-col rounded-card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ink-primary">
                  {address.label || `${address.firstName} ${address.lastName}`}
                </p>
                {address.isDefault && <Badge tone="accent">Default</Badge>}
              </div>

              <address className="mt-3 flex-1 text-xs not-italic leading-relaxed text-ink-tertiary">
                {address.firstName} {address.lastName}
                <br />
                {address.line1}
                <br />
                {address.line2 && (
                  <>
                    {address.line2}
                    <br />
                  </>
                )}
                {address.city}
                {address.region ? `, ${address.region}` : ""} {address.postalCode}
                <br />
                {countryName(address.countryCode)}
              </address>

              <div className="mt-5 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditing({
                      id: address.id,
                      draft: toDraft(address),
                      label: address.label ?? "",
                      isDefault: address.isDefault,
                    })
                  }
                >
                  <Pencil className="size-3.5" strokeWidth={1.5} />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(address.id)}
                  disabled={pending && busyId === address.id}
                  aria-label={`Remove ${address.label || address.line1}`}
                >
                  {pending && busyId === address.id ? (
                    <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
                  ) : (
                    <Trash2 className="size-3.5" strokeWidth={1.5} />
                  )}
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
