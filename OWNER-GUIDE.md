# USTR SUITS owner guide

## Sign in

1. Open the production site and go to `/admin`.
2. Sign in with the owner's authorized Supabase account. Admin access is granted by the store's `owner` role; creating a customer account does not grant admin access.
3. If you cannot sign in, use **Forgot your password?** on the owner sign-in page. Do not send passwords or recovery links to anyone.

## Add or update a product

1. Open **Products** and select **Add product**, or choose **Edit** beside an existing item.
2. Enter the product name, SKU, description, collection, category, price, MRP, sizes, colours, fabric, fit, and care details.
3. Enter stock separately for every colour-and-size combination. Use `0` for a variant that is not available.
4. Choose an image role before selecting images: **Front**, **Side / rack**, **Back**, or **Colourway**. Supported formats are JPG, PNG, and WebP, up to 5 MB per image. Keep the product record open if an upload reports an error; successfully uploaded images are retained.
5. Select **Save as draft** to keep the item private. Select **Publish product** to make it eligible for customers. A published item needs at least one image and stock for at least one variant.
6. To place a published product on the homepage rack, open **Showroom**, enable **On rack**, and set its numeric order. Only published products with images appear on the public rack.

Changes are saved to the store catalogue and inventory. The checkout uses the backend price and rechecks stock when an order is placed.

## Categories, inventory, and orders

- Add categories in **Categories**. Categories are retained so existing products and historical orders are not broken.
- Update stock by editing the product and changing the appropriate variant's quantity in **Stock by colour and size**.
- Review customer orders in **Orders**. Existing checkout and order settlement determine the final order status and stock changes.

## Archive and sign out

- In **Products**, choose **Archive** to remove a product from customer-facing listings while preserving its record. Archived products can be restored as drafts.
- Choose **Logout** in the admin navigation when finished.

Never share account passwords, recovery tokens, or Supabase keys. If the owner account or deployment configuration needs attention, use the authorized Supabase project administrator and the deployment environment settings.
