import Link from "next/link";
import { InfoPage } from "@/components/storefront/InfoPage";

export default function ContactPage() {
  return (
    <InfoPage title="Contact USTR SUITS">
      <p>Our customer contact email and phone number have not been configured yet. We have not listed unverified contact details.</p>
      <p>For an order, sign in to your account and keep your order details available when contacting the store owner through the channel provided with your purchase.</p>
      <Link href="/account" className="inline-block rounded-full bg-[#29221d] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white">Go to your account</Link>
    </InfoPage>
  );
}
