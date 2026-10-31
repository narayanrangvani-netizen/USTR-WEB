# USTR SUITS

USTR SUITS is a Next.js storefront for a clothing brand. It includes a Supabase-backed product catalog and owner dashboard, customer email/password accounts, a browser-persistent cart, Indian delivery addresses, stock-aware cash-on-delivery orders, and product photo uploads.

## Requirements

- Node.js 20.9 or later and npm
- A Supabase project

## Supabase setup

1. Create a Supabase project and open **SQL Editor** in its dashboard.
2. Run the complete migration in [`supabase/migrations/20261101000000_storefront.sql`](supabase/migrations/20261101000000_storefront.sql). It is safe to run on a new project or the existing schema in this repository; it adds missing tables/columns and replaces the old permissive product/order policies. Do not run the removed legacy `schema.sql`.
3. In **Authentication → Providers → Email**, enable email/password sign-in. For local testing you can disable email confirmations; for a live store configure Supabase email delivery and leave confirmation enabled.
4. Copy `.env.example` to `.env.local` and fill in the project URL, anon key, and service-role key from **Project Settings → API**. Keep the service-role key private and server-only. Never prefix it with `NEXT_PUBLIC_` or commit `.env.local`.
5. Start the app and create your customer account at `/account`. Confirm your email first if required. Promote the account to store owner in the Supabase SQL Editor:

   ```sql
   update public.store_profiles
   set role = 'owner', updated_at = now()
   where lower(email) = lower('you@example.com');
   ```

   Then sign in at `/admin/login`. New accounts are customers by default; there is no shared/default admin password.

The migration creates the public `product-images` storage bucket, a customer profile trigger, stock and order tables/policies, and server-only order RPCs. Product and image management APIs also verify the owner's authenticated Supabase profile before using the server-side service key.

## Run locally

In PowerShell from the repository directory:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`. Browse the store, create an account, and use `/admin/login` after promoting the account. In the owner dashboard, create a draft product, upload one or more JPG/PNG/WebP photos (maximum 5 MB each), then edit it and publish it. Product status, prices, details, image URLs, and stock variants are stored in Supabase; the storefront only displays published products with at least one photo.

The cart is saved in the current browser's local storage. Checkout requires a signed-in customer and collects recipient name, phone, street address, city, state, and a six-digit Indian PIN code. The server reloads product prices and stock, snapshots each order line, and creates the order while reserving stock in one database transaction. Delivery costs ₹199, waived on orders of ₹2,499 or more.

## Payments and fulfilment

Cash on delivery is the only enabled method. Orders begin with payment status **Pending**; owners can advance order status and mark COD collected after delivery. No online payment success is simulated. To accept online payments, integrate a provider (for example, Razorpay or Cashfree) with server-side order creation, signed webhook verification, idempotency, and payment-state transitions before offering it at checkout. Shipping labels, carrier tracking, and customer email/SMS notifications are not configured.

## Checks

```powershell
npm run lint
npm run build
```

## Upload your changes to GitHub

The implementation branch is `narayanrangvani-netizen-storefront-cart-auth-catalog`. After reviewing the diff and confirming `.env.local` is not staged, use:

```powershell
git status
git add .env.example .gitignore README.md package.json package-lock.json src supabase
git commit -m "Add Supabase-backed USTR storefront"
git push -u origin narayanrangvani-netizen-storefront-cart-auth-catalog
```

The repository changes are not committed or pushed by this coding session.
