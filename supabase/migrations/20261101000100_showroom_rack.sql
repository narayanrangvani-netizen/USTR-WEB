alter table public.products
  add column if not exists show_on_rack boolean not null default true,
  add column if not exists rack_order integer not null default 0;

alter table public.products
  drop constraint if exists products_rack_order_nonnegative;
alter table public.products
  add constraint products_rack_order_nonnegative check (rack_order >= 0);

alter table public.product_images
  add column if not exists image_role text not null default 'front',
  add column if not exists image_color text;

alter table public.product_images
  drop constraint if exists product_images_image_role_valid;
alter table public.product_images
  add constraint product_images_image_role_valid
  check (image_role in ('side', 'front', 'back', 'colorway'));

create index if not exists idx_store_products_rack
  on public.products(show_on_rack, rack_order, created_at)
  where status = 'Published';
