"use client";

import { Field, SelectField } from "@/components/ui/field";
import {
  DEFAULT_COUNTRY,
  SHIPPING_COUNTRIES,
  postalLabel,
  regionLabel,
} from "@/lib/utils/countries";
import type { AddressInput } from "@/lib/validations/commerce";

export type AddressDraft = {
  [K in keyof AddressInput]: string;
};

export const EMPTY_ADDRESS: AddressDraft = {
  firstName: "",
  lastName: "",
  company: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  countryCode: DEFAULT_COUNTRY,
  phone: "",
};

interface AddressFieldsetProps {
  /** Prefixes every input name, so shipping and billing can coexist in one form. */
  prefix: string;
  value: AddressDraft;
  errors: Record<string, string>;
  onChange: (next: AddressDraft) => void;
  disabled?: boolean;
}

/**
 * The address form, used for both shipping and billing.
 *
 * The postal and region labels follow the chosen country, because "State" on a
 * French address and "ZIP code" on a British one are how a form tells someone
 * it was not built for them. `autoComplete` tokens are the section-scoped kind,
 * so a browser can fill shipping and billing independently.
 */
export function AddressFieldset({
  prefix,
  value,
  errors,
  onChange,
  disabled,
}: AddressFieldsetProps) {
  const set = (key: keyof AddressDraft) => (event: { target: { value: string } }) =>
    onChange({ ...value, [key]: event.target.value });

  const error = (key: string) => errors[`${prefix}.${key}`] ?? errors[key];
  const region = regionLabel(value.countryCode);
  const section = prefix === "billing" ? "billing" : "shipping";

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field
        label="First name"
        name={`${prefix}-firstName`}
        autoComplete={`section-${section} given-name`}
        value={value.firstName}
        onChange={set("firstName")}
        error={error("firstName")}
        disabled={disabled}
        required
      />
      <Field
        label="Last name"
        name={`${prefix}-lastName`}
        autoComplete={`section-${section} family-name`}
        value={value.lastName}
        onChange={set("lastName")}
        error={error("lastName")}
        disabled={disabled}
        required
      />

      <Field
        label="Company"
        name={`${prefix}-company`}
        autoComplete={`section-${section} organization`}
        value={value.company}
        onChange={set("company")}
        error={error("company")}
        disabled={disabled}
        optional
        className="sm:col-span-2"
      />

      <Field
        label="Address"
        name={`${prefix}-line1`}
        autoComplete={`section-${section} address-line1`}
        value={value.line1}
        onChange={set("line1")}
        error={error("line1")}
        disabled={disabled}
        required
        className="sm:col-span-2"
      />

      <Field
        label="Apartment, suite, floor"
        name={`${prefix}-line2`}
        autoComplete={`section-${section} address-line2`}
        value={value.line2}
        onChange={set("line2")}
        error={error("line2")}
        disabled={disabled}
        optional
        className="sm:col-span-2"
      />

      <SelectField
        label="Country"
        name={`${prefix}-countryCode`}
        autoComplete={`section-${section} country`}
        value={value.countryCode}
        onChange={set("countryCode")}
        error={error("countryCode")}
        disabled={disabled}
        className="sm:col-span-2"
      >
        {SHIPPING_COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </SelectField>

      <Field
        label="City"
        name={`${prefix}-city`}
        autoComplete={`section-${section} address-level2`}
        value={value.city}
        onChange={set("city")}
        error={error("city")}
        disabled={disabled}
        required
      />

      {region ? (
        <Field
          label={region}
          name={`${prefix}-region`}
          autoComplete={`section-${section} address-level1`}
          value={value.region}
          onChange={set("region")}
          error={error("region")}
          disabled={disabled}
        />
      ) : (
        <Field
          label="Region"
          name={`${prefix}-region`}
          autoComplete={`section-${section} address-level1`}
          value={value.region}
          onChange={set("region")}
          error={error("region")}
          disabled={disabled}
          optional
        />
      )}

      <Field
        label={postalLabel(value.countryCode)}
        name={`${prefix}-postalCode`}
        autoComplete={`section-${section} postal-code`}
        value={value.postalCode}
        onChange={set("postalCode")}
        error={error("postalCode")}
        disabled={disabled}
        required
        className="sm:col-span-2 sm:max-w-[240px]"
      />
    </div>
  );
}
