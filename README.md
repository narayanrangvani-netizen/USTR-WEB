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
5. Apply the additional showroom migration [`supabase/migrations/20261101000100_showroom_rack.sql`](supabase/migrations/20261101000100_showroom_rack.sql). It adds rack visibility/order and image view/colour metadata with defaults; it does not delete product, image, inventory, customer, or order data.
6. Start the app and create your customer account at `/account`. Confirm your email first if required. Promote the account to store owner in the Supabase SQL Editor:

   ```sql
   update public.store_profiles
   set role = 'owner', updated_at = now()
   where lower(email) = lower('you@example.com');
   ```

   Then sign in at `/admin/login`. New accounts are customers by default; there is no shared/default admin password.

The migration creates the public `product-images` storage bucket, a customer profile trigger, stock and order tables/policies, and server-only order RPCs. Product and image management APIs also verify the owner's authenticated Supabase profile before using the server-side service key.

### Vercel environment variables

In Vercel, add the following under **Project → Settings → Environment Variables** for each environment you deploy. Redeploy after changing variables:

| Variable | Purpose | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side owner operations and order creation | **Yes — server only** |

The server also accepts `SUPABASE_URL` as an alias for `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_APIKEY` as an alias for `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If using those aliases, `SUPABASE_APIKEY` must be the anon/publishable key, not the service-role key. `SUPABASE_SERVICE_ROLE_KEY` is still separately required and must never be exposed to browser code or committed. The Supabase database password is not an application environment variable.

If sign-in or account creation reports a Supabase key configuration problem, check the **variable names and key roles**, not just whether a key is present: `SUPABASE_APIKEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) must contain the anon/publishable key. Put the service-role/secret key only in `SUPABASE_SERVICE_ROLE_KEY`. Never paste a service-role key into a `NEXT_PUBLIC_*` variable. If a service key was publicly exposed, rotate it in Supabase and update Vercel.

## Run locally

In PowerShell from the repository directory:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`. Browse the showroom and create/sign in to a customer account at `/account`. To add clothing, sign in with the owner account at `/admin/login`, open **Products → Add product**, choose **T-shirts** or **Shirts** as the category, enter its SKU, description, price, colours, sizes and stock, then save it as a draft. Edit the saved product to upload product photos (JPG/PNG/WebP, maximum 5 MB), selecting the view type (front, side, back, or a colourway matching one of the listed colours) before choosing each batch. Set rack visibility/order, then publish the product after at least one photo has uploaded. The catalog and rack update from Supabase without redeployment. The rack displays at most 10 published, visible products with photos. Missing side/back/colourway photos use the existing photo fallback or remain unavailable; the site never fabricates product images.

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
