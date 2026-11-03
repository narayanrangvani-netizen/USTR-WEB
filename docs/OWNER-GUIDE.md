# USTR SUITS — Owner's Store Handbook

This handbook explains how to sign in, maintain the catalogue, curate the clothing rack, and process customer orders using the current USTR SUITS website.

- **Production site:** [https://ustr-web.vercel.app](https://ustr-web.vercel.app)
- **Owner sign-in:** [https://ustr-web.vercel.app/admin/login](https://ustr-web.vercel.app/admin/login)
- **Admin dashboard:** [https://ustr-web.vercel.app/admin](https://ustr-web.vercel.app/admin)

> **Important:** PR #8's admin workflow is merged. The passwordless OTP update is a separate change and must be deployed before these OTP instructions match production. The actual store owner's live Supabase account and production email delivery have not been verified.

## 1. First-time setup and owner access

### What you need

- An account in the Supabase project connected to the production site.
- Supabase Auth Email provider enabled, with email OTP template configured as described below.
- A working Supabase Auth email sender/SMTP configuration.
- The account's `public.store_profiles.role` set to `owner`.

Verifying an email code authenticates the email identity; it does **not** make an account an owner. New customer accounts receive the default `customer` role. Owner access is granted separately by an authorized Supabase administrator.

### Create or authorize the owner's account

The authorized Supabase project administrator should:

1. If the owner account does not exist, open `/account`, choose **New here? Create an account**, enter the owner's name and email, request the email code, and verify it. This creates a customer account first; it does not grant owner access.
2. In the **same Supabase project used by the production Vercel deployment**, open **SQL Editor** and run the read-only query below, replacing the example email with the owner's account email. Confirm it returns exactly one intended Auth user and that `store_profiles.id` matches the Auth `id`.

   ```sql
   select
       u.id as auth_user_id,
       u.email as auth_email,
       u.email_confirmed_at,
       u.banned_until,
       p.id as profile_id,
       p.email as profile_email,
       p.role
   from auth.users as u
   left join public.store_profiles as p on p.id = u.id
   where lower(u.email) = lower('owner@example.com');
   ```

3. If the exact, confirmed, unbanned account is authorized to administer this store and its profile currently has `role = 'customer'`, the authorized Supabase administrator may promote that exact verified Auth ID. Replace the UUID below with the `auth_user_id` from the single verified result; do not use a broad email update.

   ```sql
   update public.store_profiles
   set role = 'owner', updated_at = now()
   where id = 'REPLACE-WITH-VERIFIED-AUTH-USER-UUID'
     and role = 'customer'
   returning id, email, role;
   ```

   The update should return exactly one row with `role = 'owner'`. If it returns no rows or more than one, stop and investigate; do not create a second account or choose between conflicting identities. If the profile is missing, do not insert one as a workaround: check that both migrations and the `on_auth_user_created_store_profile` trigger from the storefront migration are installed, then have the database administrator repair the provisioning issue.
4. Open [Owner sign-in](/admin/login), request a code for the authorized email, and enter the 6-digit code. The owner screen only accepts an existing account whose server-verified `store_profiles.role` is `owner`; a customer account is signed out and denied.

Never share one-time codes, recovery links, session cookies, API keys, or database credentials. Do not ask anyone to send you their code.

### If no code arrives

The sign-in screen uses Supabase Auth `signInWithOtp` and verifies the typed code with `verifyOtp(type: "email")`. After a successful code request the UI displays a generic anti-enumeration message. That message means the Supabase Auth request returned without an SDK error; it does **not** prove the email exists, Supabase's SMTP server accepted a message, or that the message reached the inbox. Unknown email addresses may receive the same generic response. Email OTP cannot fix a broken SMTP sender or delivery configuration.

Check these items in order, without sharing any secret values or OTP/recovery tokens:

1. Confirm the email address entered is the correct mailbox. In Gmail, search `in:anywhere` for `USTR`, `code`, `sign-in`, or `login`; also check Spam, Promotions, Trash, filters, and blocked senders. A screenshot showing only old messages is not evidence that a new message was sent.
2. Record the time of one fresh request, including timezone. In the **same Supabase project as the live Vercel deployment**, open **Authentication → Logs** (or the project's Auth logs view) and inspect that interval for the OTP request, email-send event, rate limit, or delivery error.
3. If custom SMTP uses Brevo, open **Transactional → Logs / Email logs** and search for the recipient and same time interval. Check whether a send was accepted, delivered, deferred, bounced, blocked, or rejected. A Supabase API success alone does not establish a Brevo delivery result.
4. In Vercel **Project → Settings → Environment Variables**, verify the production Supabase URL and matching anon/publishable key refer to the intended project. Keep all key values private. Confirm `SUPABASE_SERVICE_ROLE_KEY` is separately set server-side; never expose it with a `NEXT_PUBLIC_` prefix.
5. In that Supabase project's **Authentication → Users**, confirm the account email exists and is not banned. Check its owner role separately in SQL Editor:

   ```sql
   select u.id, u.email, u.email_confirmed_at, u.banned_until, p.role
   from auth.users as u
   left join public.store_profiles as p on p.id = u.id
   where lower(u.email) = lower('owner@example.com');
   ```

   The expected result is one account with `role = 'owner'`. Email confirmation/verification and owner authorization are separate. A missing profile should be investigated by checking the store schema migration and profile trigger; do not create a second identity or promote an unverified person as a workaround. A missing profile now returns a distinct setup response; a profile that exists but is not `owner` returns the owner-access denial.
6. In Supabase **Authentication → SMTP Settings**, verify custom SMTP is enabled and the sender is valid. In Brevo, confirm the sender/domain is authorized and SMTP is active. Credentials belong only in the Supabase dashboard, never in the app, repository, chat, or screenshots.
7. Check Supabase Auth email templates: the **Magic Link** template must render the numeric code using `{{ .Token }}` (not only the click-through `{{ .ConfirmationURL }}`), and OTP length must be set to **6**. The app expects the customer/owner to type six digits on the same sign-in page.
8. If the logs show throttling, wait for the cooldown and try once. The UI disables resend for 60 seconds; Supabase enforces its own email-send rate limits.

The current UI no longer offers password sign-in. Existing accounts keep their Auth identity and profile; they sign in with an emailed OTP. The former password reset routes remain only for compatibility with any previously issued recovery links; they are not linked from the new sign-in screen. Do not claim production login or email delivery works until the owner completes the OTP flow on the deployed production host.

### Existing password recovery links

Old recovery links may still open `/account/reset-password` and update a Supabase password. Password reset is not required for OTP sign-in and is not a workaround for missing email delivery; both flows use Supabase Auth email. Do not forward a recovery link or token.

## 2. Admin navigation

After owner authentication, the dashboard navigation provides:

| Section | Use |
|---|---|
| **Overview** (`/admin`) | Product, publication, inventory and recent-order snapshot. |
| **Products** (`/admin/products`) | Search, filter, inspect, edit, archive and restore catalogue products. |
| **Add Product** (`/admin/add-product`) | Create a product or edit one using its product ID. |
| **Categories** (`/admin/categories`) | Add and review product categories. |
| **Inventory** (`/admin/inventory`) | View the total stock by product colour; edit exact stock in the product form. |
| **Showroom** (`/admin/showroom`) | Enable eligible products on the homepage rack and set rack order. |
| **Orders** (`/admin/orders`) | Review customer order and delivery details and update supported order statuses. |
| **Coupons** (`/admin/coupons`) | Informational page only; coupons are not active. |
| **Store Settings** (`/admin/settings`) | Informational page only; settings are not persisted yet. |
| **Logout** | End the Supabase session and return to owner sign-in. |

The navigation is available as a sidebar on larger screens and a horizontally scrollable bar on mobile.

## 3. Categories

Create categories before adding products:

1. Open **Categories**.
2. Enter a name in **New category name** and choose **Add category**.
3. Confirm the saved category appears in the list.
4. When creating or editing a product, select it in the **Category** field.

The category list includes names already associated with existing products. Categories can be added but there is currently no category rename/delete control. Categories are retained so existing product records are not detached. Avoid creating near-duplicate spellings; category matching is based on the saved name.

## 4. Add a product to the catalogue

1. Open **Products** and select **Add product**, or choose **Add product** from the dashboard.
2. Fill in the required product details:
   - **Product name**
   - **SKU** — use a unique code for the product.
   - **Gender collection** — Men, Women, or Unisex.
   - **Category** — select a category already saved under Categories.
   - **Selling price (₹)** and **Original MRP (₹)**.
   - **Description**
   - **Available sizes (comma separated)**, for example `S, M, L, XL`.
   - **Available colours (comma separated)**, for example `Black, Sand`.
3. Optionally enter **Fabric info**, **Fit**, and **Care instructions**.
4. Enter stock for every displayed **colour and size** combination in **Stock by colour and size**. Use a whole number from 0 to 10000. Use `0` for a size/colour that is not available.
5. Review the **Pricing preview**. The selling price is the amount used by checkout; MRP cannot be lower than the selling price. The discount percentage is calculated from those entered values.
6. To keep the product private while preparing it, choose **Save as draft**. The product and its variants/stock are written to the existing store database. A product ID confirmation appears after a successful save.
7. Add its actual product photos using the image instructions below.
8. Once images and stock are ready, choose **Publish product**. The server verifies that there is at least one saved product image and at least one stocked variant before changing status to Published. If publication fails, the form displays the error and the product remains saved as a draft.

The product slug is generated by the application when the product is first created and is not an editable field. Editing a product preserves its existing product ID and URL slug.

## 5. Product images

The existing Supabase Storage bucket and product-image records are used; image files are not stored in the product row.

### Supported file rules

- Accepted: **JPG/JPEG, PNG, WebP**.
- Maximum: **5 MB per file**.
- The server checks both the declared format and file signature.
- Multiple files can be selected in one upload batch; each selected file in that batch receives the currently selected image role.

### Upload by role

For each group of images:

1. Select the **Image view**: **Front**, **Side / rack**, **Back**, or **Colourway**.
2. For **Colourway**, select the matching product colour.
3. Select one or more files. Review each local preview and filename.
4. Save the draft or publish. The form reports upload progress, then displays saved image previews and role labels.
5. To add a different view, select the new role and repeat with another batch. Do not combine front, back, and rack images in one batch because one role applies to the whole selection.

The image selector currently provides selection/preview and upload; there is no drag-to-reorder control. Images are ordered by the stored primary/order values. To remove an image, choose **Remove** on its preview. There is no separate direct “replace” button: remove the old image and upload the replacement under the intended role.

When an upload batch fails partway through, already successful image records remain associated with the product. Keep the product open, note the error, and retry only the missing files. If Supabase Storage or its owner upload policy is misconfigured, the upload will fail; an authorized project administrator must check the `product-images` bucket and policy rather than bypassing owner authorization.

### Image honesty

Upload real product images. The storefront uses an uploaded colourway image when available and actual-photo fallbacks for missing views; it does not fabricate a back view or recolour printed designs. Rack/hanger presentation does not alter the product asset. Check the public product after publishing to make sure the displayed photo is the correct one.

## 6. Edit, archive, and restore products

### Edit

1. Open **Products**. Search by product name or SKU; optionally filter by status, collection, category, or inventory.
2. Select **Edit** beside the product.
3. The form loads saved product values, images, and variant stock. Update the necessary fields and save.
4. Product, variant, stock, price, and rack fields are stored in the existing Supabase-backed catalogue. Reload the product or catalogue to confirm a successful save.

Changing the available size/colour combinations adds/updates matching product variants. The form does not provide permanent-delete functionality for products.

### Archive and restore

- Choose **Archive** to mark a product Archived. It then leaves customer-facing published catalogue/showroom results. The product row is retained; order items reference the product rather than being deleted with it.
- The action next to an archived row becomes **Restore**. Choosing it changes the product back to **Draft**, not Published. Review it and publish again when it is ready.
- Do not delete product/order rows directly in the database. Historical order preservation is important.

## 7. Homepage showroom

Only a product that is **Published**, has at least one image, and is enabled **On rack** is eligible for the public homepage rack. The customer storefront reads product data from the same catalogue; changing a saved status or rack setting does not require a code redeploy.

1. Publish the product first.
2. Open **Showroom**.
3. Find the product. Turn on **On rack**.
4. Enter its numeric **Order** and move focus away from the field so the change saves. Lower order numbers appear first.
5. Open the production site and refresh the homepage to confirm it appears in the expected position.

Drafts, archived items, products without images, and products whose rack checkbox is off are not eligible. Inventory of zero makes a variant unavailable to buy; the public rack eligibility itself is based on publication, rack visibility, and images.

The storefront retains the interactive garment-rack presentation, mobile scrolling/snapping, product focus view, colour/size selection, and actual-image front/back controls. A back view or colourway can only be shown when a matching image asset exists. The rack displays up to 10 items on each page with next/previous navigation when needed.

## 8. Inventory and customer availability

- The **Inventory** section shows totals by product colour and a status: In stock, Low stock, or Out of stock. It is a read-only summary.
- To change inventory, open the product with **Edit** and change the quantity for the exact colour/size under **Stock by colour and size**. Save the product.
- Enter `0` for unavailable variants. Negative or fractional stock is rejected.
- Customer size choices with zero recorded inventory are unavailable. The cart limits quantity against the displayed availability, and checkout rechecks the selected variant's stock on the server.
- The order-creation database function locks the inventory row and checks current price and stock before reserving inventory. If another order uses the final units first, checkout can reject the order and ask the customer to review the cart.

The admin form is the supported stock-editing surface; the Inventory summary does not have inline edit controls.

## 9. Customer storefront, bag, and checkout

The homepage and collection routes use the clothing rack rather than a conventional product grid. Customers can open a product, choose an available colour and size, and add it to the bag. The bag is browser-local; its contents are not a server-side customer cart.

Checkout behavior:

1. The customer must sign in or create an account at `/account`.
2. The customer enters recipient name, phone, street address, city, state, and a six-digit Indian PIN code.
3. Checkout sends selected product IDs, colours, sizes, and quantities. It does not trust a browser-supplied price as the order price.
4. The backend reloads the published product price and variant stock and creates the order while reserving stock in a database transaction.
5. Shipping is ₹199, waived when the subtotal is ₹2,499 or more.
6. **Cash on delivery is the only active payment method.** Online payment is not available and no payment success is simulated.

Do not place a real customer order just to test a release. Coordinate an authorized low-risk COD test only if the business owner approves it; no payment-provider sandbox is currently configured in the app.

## 10. Review and manage orders

Open **Orders** to review actual database orders. Each order displays its reference, date, total and shipping, delivery contact/address, product name, variant colour/size, quantity, line price, payment method/status, and order status.

Supported order statuses are **Pending**, **Confirmed**, **Processing**, **Shipped**, **Delivered**, and **Cancelled**. The database order-update function handles status transitions and restores inventory when an order is cancelled. Do not reopen a cancelled order.

For COD orders, **Mark COD collected** is available only after the order is Delivered. This changes payment status to Confirmed. Do not mark COD collected before funds are actually received. Product archival does not remove order history.

The dashboard shows loaded product/inventory counts and recent orders. The order and inventory screens reflect current backend records only when the Supabase connection is available.

## 11. Settings, discounts, and logout

- **Store Settings** is currently informational. Settings are not persisted through the admin page; do not expect edits there to update contact details or announcements.
- **Coupons** is currently informational. Coupons are not active or applied to checkout.
- To finish an admin session, choose **Logout** in the sidebar or mobile navigation. The application calls Supabase sign-out and returns to `/admin/login`. If sign-out reports an error, retry and do not leave a shared device unattended.

## 12. Production configuration and release checklist

The application requires a Supabase project and a Vercel deployment configured for that same project.

### Vercel environment

In Vercel **Project → Settings → Environment Variables**, confirm the correct values are set for the target environment:

| Variable | Purpose | Handling |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public configuration; must point to the intended project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key | Public key; never put the service-role key here. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side product/order operations | Secret; server-only. Never expose or commit. |
| `SITE_URL` | Canonical auth email redirect origin | Set to `https://ustr-web.vercel.app` in production. No path. |

The server also accepts `SUPABASE_URL` as a URL alias and `SUPABASE_APIKEY` as an anon-key alias. Do not set both kinds to different projects. The anon/publishable key must not be a service-role/secret key. Never send secrets in email, chat, logs, or a support screenshot.

Changing a Vercel environment variable requires a new deployment for that environment. No deployment should be started for production without the store owner's release authorization.

### Supabase setup checks

An authorized administrator should verify:

1. Both migrations in [`../supabase/migrations/`](../supabase/migrations/) have been applied: the storefront schema/policies and the showroom rack/image metadata migration.
2. Supabase Auth Email provider is enabled, OTP length is six digits, the **Magic Link** email template contains `{{ .Token }}`, and the intended owner account has `store_profiles.role = 'owner'`.
3. The `product-images` bucket exists, accepts `image/jpeg`, `image/png`, and `image/webp` up to 5 MB, and the existing owner upload/delete policies are active.
4. Supabase Auth **URL Configuration** uses `https://ustr-web.vercel.app` as its Site URL and allows the production sign-in callbacks `/account` and `/admin/login` (or an appropriately scoped production wildcard). Keep the reset callback allowed for previously issued recovery links.
5. Supabase Auth email delivery is configured and tested with the chosen sender. SMTP credentials belong only in the Supabase provider settings, never in the app or this repository.

For a release preview, verify the expected Vercel deployment, then check `/`, `/admin/login`, and—after an owner successfully signs in—one safe product draft/upload/publish/rack cycle. A preview deployment is not proof that production environment variables, storage policies, account state, or checkout have been verified.

## 13. Troubleshooting

| Symptom | Safe next check |
|---|---|
| `/admin` returns to sign-in | Confirm the owner session is still valid; sign in at `/admin/login`. Check the Vercel server environment and Supabase availability if the message says access is temporarily unavailable. |
| Old password field or `/api/auth/login` 401 | This indicates an older deployment or stale page; the updated screen requests an email code and no longer provides password login endpoints. Refresh after deployment and verify the active build. |
| Generic code-sent message, but no email arrives | The message does not confirm delivery. Check Gmail `in:anywhere` (including Spam, Promotions, Trash, and filters), then compare the attempt timestamp in the matching Supabase Auth logs and Brevo transactional email logs. Follow [If no code arrives](#if-no-code-arrives). |
| Invalid/expired email code | Re-enter the latest six-digit code for the exact email address. Request a new code after the 60-second UI cooldown; Supabase may enforce additional limits. |
| 403 or owner access denied | Confirm this exact authenticated user has `role = 'owner'` in the matching project's `store_profiles`. Do not promote a customer identity unless the authorized owner administrator approves it. |
| Owner access denied after code verification | Confirm this exact Auth user has `role = 'owner'` in the matching project's `store_profiles`. Code verification never grants or changes the owner role. |
| Category not available in product form | Save it under **Categories**, refresh the product form, and verify the backend is connected. Existing product category names are also listed. |
| Product save or publish fails | Read the in-page error. Check required product details, unique SKU, selling price/MRP, every variant's whole-number stock, at least one image, and positive stock for at least one variant before publishing. |
| Image upload fails | Verify the file is a real JPG/PNG/WebP under 5 MB, select the intended view/colour, and ask the authorized Supabase administrator to check bucket and owner policies. Previously saved images are retained when a later file fails. |
| Product not visible on public rack | Confirm status is Published, at least one image exists, **On rack** is enabled, and then refresh the public site. A product with no available inventory may still be visible but cannot be purchased in an unavailable size. |
| Checkout rejects a variant | Inventory may have changed since the item entered the bag. Refresh the product, choose a currently available size/colour, and retry. The server price and stock are authoritative. |
| Order status or totals look wrong | Do not edit database rows manually. Review the order details and contact the authorized store/database administrator. Cancelled orders are not reopened. |

## 14. Owner's routine workflow

For each new collection:

1. Sign in at `/admin/login`.
2. Add any new categories under **Categories**.
3. Create a product in **Products → Add product** and enter its title, SKU, collection, category, description, price, MRP, sizes, colours, fabric, fit, and care details.
4. Enter each colour-and-size stock quantity separately.
5. Upload actual front, side/rack, back, or colourway images in separate role-selected batches.
6. Save a draft and confirm the product and images have saved.
7. Publish the item after it has at least one saved image and one in-stock variant.
8. In **Showroom**, enable **On rack** and set its display order.
9. Refresh the public storefront and inspect the actual image, price, and availability.
10. Periodically review **Inventory** and **Orders**. Update counts by editing the product; update order status only according to actual fulfilment/payment events.
11. Archive discontinued products rather than deleting records. Restore only when needed; restored items return as drafts.
12. Log out when finished.

## 15. What is not currently provided

- No default/shared owner password and no way to promote a customer from the public storefront.
- No live verification of the actual owner's production Supabase account in this handover.
- No permanent product-delete control, category edit/delete control, or image drag-reordering UI.
- No persisted Store Settings form or active coupon management.
- No online payment processing, shipping-label integration, or delivery notifications.
- No proof of a real owner login, live image upload, production database save, or real checkout from the repository build alone.

The owner guide is an operating aid, not a substitute for confirming the authorized account and production environment with the store's Supabase/Vercel administrators.
