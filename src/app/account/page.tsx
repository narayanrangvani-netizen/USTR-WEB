import { AccountPanel } from "@/components/auth/AccountPanel";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";

export default function AccountPage() {
  return (
    <div className="bg-[#fffdfc] text-[#29221d]">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-14 sm:px-6"><AccountPanel /></main>
      <Footer />
    </div>
  );
}
