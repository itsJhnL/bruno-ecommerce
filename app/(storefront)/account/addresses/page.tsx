import { AddressBook } from "@/components/account/address-book";
import { getSavedAddresses } from "@/lib/queries/account";

export default async function AddressesPage() {
  const addresses = await getSavedAddresses();
  return <AddressBook addresses={addresses} />;
}
