import { InfoPage } from "@/components/storefront/InfoPage";

export default function ShippingPage() {
  return (
    <InfoPage title="Shipping information">
      <p>Checkout currently supports cash on delivery in India. Enter a complete delivery address, state, phone number, and six-digit PIN code.</p>
      <p>Shipping is ₹199 and is waived for orders of ₹2,499 or more. Orders reserve available stock when placed. Delivery estimates and carrier tracking are not currently configured.</p>
    </InfoPage>
  );
}
