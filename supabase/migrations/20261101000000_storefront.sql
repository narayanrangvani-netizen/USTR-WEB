create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  gender text not null check (gender in ('Men', 'Women', 'Unisex')),
  category_id uuid references public.categories(id),
  product_type text not null,
  description text,
  selling_price numeric(10, 2) not null check (selling_price >= 0),
  original_price numeric(10, 2) not null check (original_price >= 0),
  sku text not null unique,
  status text not null default 'Draft' check (status in ('Draft', 'Published', 'Archived')),
  is_new_arrival boolean not null default false,
  is_bestseller boolean not null default false,
  is_featured boolean not null default false,
  fabric text,
  fit text,
  care text,
  colors jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color text not null,
  size text not null,
  sku text not null unique,
  created_at timestamptz not null default now(),
  unique (product_id, color, size)
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null unique references public.product_variants(id) on delete cascade,
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text,
  phone text,
  address_line_1 text,
  city text,
  state text,
  postal_code text,
  country text default 'India',
  created_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  total_amount numeric(10, 2) not null,
  order_status text not null default 'Pending' check (order_status in ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Confirmed', 'Failed', 'Refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10, 2) not null,
  min_order_value numeric(10, 2) default 0,
  expires_at timestamptz,
  max_uses integer,
  used_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  brand_email text,
  support_phone text,
  instagram_url text,
  shipping_info text,
  return_policy text,
  store_announcement text,
  logo_url text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_store_products_gender on public.products(gender);
create index if not exists idx_store_products_status on public.products(status);
create index if not exists idx_store_product_images_product on public.product_images(product_id);

create table if not exists public.store_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles alter column role set default 'customer';
alter table public.profiles enable row level security;
drop policy if exists "Users read own legacy profile" on public.profiles;
create policy "Users read own legacy profile" on public.profiles
for select to authenticated using (id = (select auth.uid()));

alter table public.customers enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.coupons enable row level security;
alter table public.store_settings enable row level security;
revoke all on table public.customers, public.carts, public.cart_items, public.coupons, public.store_settings
  from public, anon, authenticated;

alter table public.products
  add column if not exists colors jsonb not null default '[]'::jsonb,
  add column if not exists sizes jsonb not null default '[]'::jsonb;

alter table public.orders
  add column if not exists user_id uuid references auth.users(id),
  add column if not exists delivery_address jsonb,
  add column if not exists shipping_amount numeric(10, 2) not null default 0,
  add column if not exists payment_method text not null default 'cod';

create index if not exists idx_store_orders_user_created on public.orders(user_id, created_at desc);

create or replace function public.create_store_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.store_profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set email = excluded.email, full_name = coalesce(excluded.full_name, store_profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_store_profile on auth.users;
create trigger on_auth_user_created_store_profile
after insert or update on auth.users
for each row execute function public.create_store_profile();

insert into public.store_profiles (id, email, full_name)
select id, coalesce(email, ''), nullif(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

create or replace function public.is_store_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_profiles
    where id = (select auth.uid()) and role = 'owner'
  );
$$;

alter table public.store_profiles enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public can read published products" on public.products;
drop policy if exists "Authenticated admin can access all products" on public.products;
drop policy if exists "Public can read published product images" on public.product_images;
drop policy if exists "Authenticated admin can manage images" on public.product_images;
drop policy if exists "Authenticated admin can manage inventory" on public.inventory;
drop policy if exists "Authenticated admin can manage orders" on public.orders;
drop policy if exists "Authenticated admin can manage settings" on public.store_settings;

drop policy if exists "Published products are public" on public.products;
create policy "Published products are public" on public.products
for select to anon, authenticated using (status = 'Published');
drop policy if exists "Owners manage products" on public.products;
create policy "Owners manage products" on public.products
for all to authenticated using (public.is_store_owner()) with check (public.is_store_owner());

drop policy if exists "Published categories are public" on public.categories;
create policy "Published categories are public" on public.categories
for select to anon, authenticated using (
  exists (select 1 from public.products p where p.category_id = categories.id and p.status = 'Published')
);
drop policy if exists "Owners manage categories" on public.categories;
create policy "Owners manage categories" on public.categories
for all to authenticated using (public.is_store_owner()) with check (public.is_store_owner());

drop policy if exists "Published images are public" on public.product_images;
create policy "Published images are public" on public.product_images
for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'Published')
);
drop policy if exists "Owners manage images" on public.product_images;
create policy "Owners manage images" on public.product_images
for all to authenticated using (public.is_store_owner()) with check (public.is_store_owner());

drop policy if exists "Published variants are public" on public.product_variants;
create policy "Published variants are public" on public.product_variants
for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'Published')
);
drop policy if exists "Owners manage variants" on public.product_variants;
create policy "Owners manage variants" on public.product_variants
for all to authenticated using (public.is_store_owner()) with check (public.is_store_owner());

drop policy if exists "Published inventory is public" on public.inventory;
create policy "Published inventory is public" on public.inventory
for select to anon, authenticated using (
  exists (
    select 1 from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = variant_id and p.status = 'Published'
  )
);
drop policy if exists "Owners manage inventory" on public.inventory;
create policy "Owners manage inventory" on public.inventory
for all to authenticated using (public.is_store_owner()) with check (public.is_store_owner());

drop policy if exists "Users read own profile" on public.store_profiles;
create policy "Users read own profile" on public.store_profiles
for select to authenticated using (id = (select auth.uid()) or public.is_store_owner());

drop policy if exists "Owners read orders" on public.orders;
create policy "Owners read orders" on public.orders
for select to authenticated using (public.is_store_owner());
drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders" on public.orders
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Owners read order items" on public.order_items;
create policy "Owners read order items" on public.order_items
for select to authenticated using (
  public.is_store_owner() or exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product images are public" on storage.objects;
create policy "Product images are public" on storage.objects
for select to anon, authenticated using (bucket_id = 'product-images');
drop policy if exists "Owners upload product images" on storage.objects;
create policy "Owners upload product images" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and public.is_store_owner());
drop policy if exists "Owners update product images" on storage.objects;
create policy "Owners update product images" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and public.is_store_owner())
with check (bucket_id = 'product-images' and public.is_store_owner());
drop policy if exists "Owners delete product images" on storage.objects;
create policy "Owners delete product images" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and public.is_store_owner());

create or replace function public.create_store_order(
  p_user_id uuid,
  p_items jsonb,
  p_delivery_address jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_stock integer;
  v_price numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_shipping numeric(10, 2);
begin
  if p_user_id is null
    or coalesce(jsonb_typeof(p_items), '') <> 'array'
    or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'A signed-in customer and at least one cart item are required';
  end if;
  if length(trim(coalesce(p_delivery_address ->> 'full_name', ''))) < 2
    or length(trim(coalesce(p_delivery_address ->> 'phone', ''))) < 8
    or length(trim(coalesce(p_delivery_address ->> 'address_line_1', ''))) < 4
    or length(trim(coalesce(p_delivery_address ->> 'city', ''))) < 2
    or length(trim(coalesce(p_delivery_address ->> 'state', ''))) < 2
    or coalesce(p_delivery_address ->> 'postal_code', '') !~ '^[0-9]{6}$' then
    raise exception 'Enter a complete delivery address with a valid 6-digit PIN code';
  end if;

  insert into public.orders (
    id, user_id, total_amount, shipping_amount, delivery_address,
    payment_method, order_status, payment_status
  ) values (
    v_order_id, p_user_id, 0, 0, p_delivery_address, 'cod', 'Pending', 'Pending'
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
    v_quantity := nullif(v_item ->> 'quantity', '')::integer;
    if v_quantity is null or v_quantity < 1 or v_quantity > 10 then
      raise exception 'Cart quantity must be between 1 and 10';
    end if;

    select v.id, p.selling_price, i.stock
    into v_variant_id, v_price, v_stock
    from public.product_variants v
    join public.products p on p.id = v.product_id
    join public.inventory i on i.variant_id = v.id
    where v.product_id = v_product_id
      and v.color = v_item ->> 'color'
      and v.size = v_item ->> 'size'
      and p.status = 'Published'
      and p.colors ? v.color
      and p.sizes ? v.size
    for update of i;

    if v_variant_id is null then raise exception 'A selected product or variant is no longer available'; end if;
    if v_stock < v_quantity then raise exception 'There is not enough stock for one of the selected items'; end if;

    update public.inventory set stock = stock - v_quantity, updated_at = now()
    where variant_id = v_variant_id;
    insert into public.order_items (order_id, product_id, variant_id, quantity, price)
    values (v_order_id, v_product_id, v_variant_id, v_quantity, v_price);
    v_subtotal := v_subtotal + (v_price * v_quantity);
  end loop;

  v_shipping := case when v_subtotal >= 2499 then 0 else 199 end;
  update public.orders
  set total_amount = v_subtotal + v_shipping, shipping_amount = v_shipping
  where id = v_order_id;

  return v_order_id;
end;
$$;

revoke all on function public.create_store_order(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_store_order(uuid, jsonb, jsonb) to service_role;

create or replace function public.update_store_order(
  p_order_id uuid,
  p_order_status text default null,
  p_payment_status text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;

  if p_order_status is not null then
    if p_order_status not in ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') then
      raise exception 'Invalid order status';
    end if;
    if v_order.order_status = 'Cancelled' and p_order_status <> 'Cancelled' then
      raise exception 'A cancelled order cannot be reopened';
    end if;
    if p_order_status = 'Cancelled' and v_order.order_status <> 'Cancelled' then
      for v_item in select variant_id, quantity from public.order_items where order_id = p_order_id
      loop
        update public.inventory set stock = stock + v_item.quantity, updated_at = now()
        where variant_id = v_item.variant_id;
      end loop;
    end if;
  end if;

  if p_payment_status is not null then
    if p_payment_status <> 'Confirmed' or v_order.payment_method <> 'cod'
      or coalesce(p_order_status, v_order.order_status) <> 'Delivered' then
      raise exception 'Cash-on-delivery payment can only be marked collected after delivery';
    end if;
    update public.orders set payment_status = 'Confirmed', updated_at = now() where id = p_order_id;
  end if;

  if p_order_status is not null then
    update public.orders set order_status = p_order_status, updated_at = now() where id = p_order_id;
  end if;
end;
$$;

revoke all on function public.update_store_order(uuid, text, text) from public, anon, authenticated;
grant execute on function public.update_store_order(uuid, text, text) to service_role;
