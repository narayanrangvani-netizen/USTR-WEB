# USTR SUITS

USTR SUITS is a Next.js storefront for a clothing brand. It includes a Supabase-backed product catalog and owner dashboard, customer email/password accounts, a browser-persistent cart, Indian delivery addresses, stock-aware cash-on-delivery orders, and product photo uploads.

## Requirements

- Node.js 20.9 or later and npm
- A Supabase project

## Supabase setup

1. Create a Supabase project and open **SQL Editor** in its dashboard.
2. Run the complete migration in [`supabase/migrations/20261101000000_storefront.sql`](supabase/migrations/20261101000000_storefront.sql). It is safe to run on a new project or the existing schema in this repository; it adds missing tables/columns and replaces the old permissive product/order policies. Do not run the removed legacy `schema.sql`.
3. In **Authentication → Providers → Email**, enable email/password sign-in. For local testing you can disable email confirmations; for a live store leave confirmation enabled and configure Brevo as Supabase's custom SMTP provider using the steps below.
4. Copy `.env.example` to `.env.local` and fill in the project URL, anon key, and service-role key from **Project Settings → API**. Keep the service-role key private and server-only. Never prefix it with `NEXT_PUBLIC_` or commit `.env.local`.
5. Apply the additional showroom migration [`supabase/migrations/20261101000100_showroom_rack.sql`](supabase/migrations/20261101000100_showroom_rack.sql). It adds rack visibility/order and image view/colour metadata with defaults; it does not delete product, image, inventory, customer, or order data.
6. Start the app and create your account at `/account`. If email confirmation is enabled, confirm it first. Only after the account exists, promote that exact email to store owner in the Supabase SQL Editor:

   ```sql
   update public.store_profiles
   set role = 'owner', updated_at = now()
   where lower(email) = lower('you@example.com')
   returning id, email, role;
   ```

   Replace the example with the email used to register. The result should show exactly one row with `role = owner`. If it returns no rows, the account/profile does not exist yet or the email does not match; finish signup and email confirmation, then rerun the query. If it returns more than one row, stop and check the matching profiles before proceeding. New accounts are customers by default; there is no shared/default admin password.

7. Sign in with that Supabase Auth email and password at `/admin/login`. The protected dashboard is at `/admin`; there is no default admin password.

The migration creates the public `product-images` storage bucket, a customer profile trigger, stock and order tables/policies, and server-only order RPCs. Product and image management APIs also verify the owner's authenticated Supabase profile before using the server-side service key.

### Send Supabase Auth email through Brevo

Brevo is the email delivery service; Supabase remains responsible for accounts, sign-in, confirmation, and the database. The app does not call Brevo directly and does not need a Brevo API key in its environment.

1. In Brevo, verify the sender email address (and configure/authenticate your sending domain if you use one). Use a sender address you are authorized to send from.
2. In Brevo, open **Transactional → Settings → SMTP & API → SMTP** and copy the SMTP login and generate/copy an **SMTP key**. Do not use the Brevo REST API key as the SMTP password.
3. In Supabase, open **Authentication → SMTP Settings** (under the Auth email/SMTP settings) and enable custom SMTP. Enter:
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: the Brevo SMTP login
   - Password: the Brevo SMTP key
   - Sender email and sender name: the verified sender details from Brevo
4. Save the settings. In Supabase **Authentication → URL Configuration**, set **Site URL** to the public production origin, for example `https://your-store-domain.example` (no path). Add the production origin and `https://your-store-domain.example/**` to the allowed redirect URLs. For local testing, also allow `http://localhost:3000` and `http://localhost:3000/**`. Password recovery emails redirect to `/account/reset-password`; the route supports both URL hash tokens and PKCE `code` links. The `/**` entries allow those app paths.
5. Signup confirmation returns to Supabase's configured Site URL; customers can then open `/account` to sign in. Password reset requests from `/account` and `/admin/login` use `/account/reset-password`; after a successful reset the user is signed out and can return to the respective sign-in page. Test one recovery after the current Supabase Auth rate-limit cooldown has cleared.

Enter SMTP credentials only in the Supabase dashboard. Do not add them to frontend code, `NEXT_PUBLIC_*` variables, Vercel app environment variables, or Git. If the sender or SMTP settings are not accepted, check Brevo's verified sender and SMTP credentials in their dashboards; never share the credentials. Brevo SMTP can improve email delivery, but it does not replace Supabase or remove Supabase Auth rate limits.

### Vercel environment variables

In Vercel, add the following under **Project → Settings → Environment Variables** for each environment you deploy. Redeploy after changing variables:

Also set `SITE_URL` to your stable production origin `https://ustr-web.vercel.app` (no path). Do not set it to a per-deployment URL such as `https://ustr-<deployment-id>-<team>.vercel.app`; preview and production deployments must send recovery links to the stable production domain. The app uses `SITE_URL` first, then `NEXT_PUBLIC_SITE_URL`, then Vercel's `VERCEL_PROJECT_PRODUCTION_URL`. In local development only, it falls back to the request origin. The app redirects `/account/forgot-password` to this canonical origin before issuing the reset request, so Supabase's PKCE verifier cookie and the emailed callback use the same host. In Supabase Auth **URL Configuration**, set the Site URL to `https://ustr-web.vercel.app` and add `https://ustr-web.vercel.app/account/reset-password` (or `https://ustr-web.vercel.app/**`) to the allowed redirect URLs. This prevents a preview URL from being rejected and silently falling back to Supabase's Site URL.

| Variable | Purpose | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side owner operations and order creation | **Yes — server only** |
| `SITE_URL` | Stable public origin used in Supabase Auth email redirects | No |

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

Open `http://localhost:3000`. The rack is the shopping presentation on the home, Men, Women, Shirts, and T-shirts routes; its editorial controls filter All, Men, Women, New Drops, Bestsellers, T-shirts, and Shirts without switching to a product grid. Each rack page shows up to 10 published products, with previous/next browsing when needed. Selecting a product opens its focused details, exact size/colour stock, actual price, available front/back and colourway photos, Add to Bag, and Buy Now. Add to Bag opens the shared bag drawer; Buy Now carries the selected variant into checkout.

Create/sign in to a customer account at `/account`. For owner access, first promote the account in `public.store_profiles` using the setup SQL above, then sign in at `/admin/login`. In the dashboard open **Products → Add product** (`/admin/add-product`). Enter the name, SKU, T-shirts/Shirts category, gender, price/MRP, description, sizes, colours and starting stock. Keep **Draft** selected, choose an image view (front, side, back, or a colourway matching one of the listed colours), select actual JPG/PNG/WebP photos (maximum 5 MB each), set rack visibility/order and collection flags, then save. The product and selected photos are saved to Supabase Storage/catalog; use **Edit** to add more views or colourway photos. Once at least one photo is saved, edit the product, set status to **Published**, and save. Published, rack-visible products appear in the matching showroom rack and its filters without a code redeploy. The rack rotation/swing, selection view, mobile snapping and transitions are part of the deployed app UI; product photos, prices, sizes, stock, rack order and collection flags come from Supabase. Missing side/back/colourway photos use actual-photo fallbacks or remain unavailable; the site never fabricates product images.

The cart is saved in the current browser's local storage. Checkout requires a signed-in customer and collects recipient name, phone, street address, city, state, and a six-digit Indian PIN code. The server reloads product prices and exact variant stock, snapshots each order line, and creates the order while reserving stock in one database transaction. Delivery costs ₹199, waived on orders of ₹2,499 or more. Size selections with no recorded inventory are disabled. The size guide does not invent garment measurements; it directs customers to contact the store when measurements are not listed.

## Payments and fulfilment

Cash on delivery is the only enabled method. Orders begin with payment status **Pending**; owners can advance order status and mark COD collected after delivery. No online payment success is simulated. To accept online payments, integrate a provider (for example, Razorpay or Cashfree) with server-side order creation, signed webhook verification, idempotency, and payment-state transitions before offering it at checkout. Shipping labels, carrier tracking, and customer email/SMS notifications are not configured.

## Checks

```powershell
npm run lint
npm run build
```

## Upload your changes to GitHub

The implementation branch is `narayanrangvani-netizen-storefront-cart-auth-catalog`. Review the worktree and confirm `.env.local` is not staged. Stage only the intended changes, commit, and push the branch:

```powershell
git status
git add README.md src/app/admin/add-product/page.tsx src/app/globals.css "src/app/product/[slug]/ProductDetails.tsx" src/components/cart/CartLink.tsx src/components/cart/CartProvider.tsx src/components/storefront/CategoryPage.tsx src/components/storefront/Showroom.tsx src/lib/products.ts src/lib/supabase/products.ts
git status
git commit -m "Complete USTR showroom shopping flow"
git push -u origin narayanrangvani-netizen-storefront-cart-auth-catalog
```

After pushing, open a **new pull request** from this branch into `main`, review and merge it, then confirm the Vercel Production deployment built from the updated `main`. Pull request #1 was already merged and does not include later branch changes. If the showroom migration has not yet been applied, run `20261101000100_showroom_rack.sql` after the storefront migration in Supabase SQL Editor. Do not commit `.env.local` or any secret values.

The repository changes are not committed or pushed by this coding session.
