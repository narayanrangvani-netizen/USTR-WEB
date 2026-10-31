create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  role text not null default 'owner',
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
  selling_price numeric(10,2) not null check (selling_price >= 0),
  original_price numeric(10,2) not null check (original_price >= 0),
  sku text not null unique,
  status text not null default 'Published' check (status in ('Draft', 'Published', 'Archived')),
  is_new_arrival boolean not null default false,
  is_bestseller boolean not null default false,
  is_featured boolean not null default false,
  fabric text,
  fit text,
  care text,
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
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now(),
  unique (variant_id)
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
  total_amount numeric(10,2) not null,
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
  price numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null,
  min_order_value numeric(10,2) default 0,
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

create index if not exists idx_products_gender on public.products(gender);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_product_images_product_id on public.product_images(product_id);
create index if not exists idx_inventory_stock on public.inventory(stock);
create index if not exists idx_orders_status on public.orders(order_status);
create index if not exists idx_coupons_code on public.coupons(code);

alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;

create policy "Public can read published products" on public.products
for select using (status = 'Published');

create policy "Authenticated admin can access all products" on public.products
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Public can read published product images" on public.product_images
for select using (exists (
  select 1 from public.products p where p.id = product_id and p.status = 'Published'
));

create policy "Authenticated admin can manage images" on public.product_images
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated admin can manage inventory" on public.inventory
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated admin can manage orders" on public.orders
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated admin can manage settings" on public.store_settings
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
