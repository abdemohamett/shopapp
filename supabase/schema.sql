-- Customers table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamp with time zone default now()
);

-- Inventory items table
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null default 0,
  quantity integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Orders (items taken) table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  item_id uuid not null references public.inventory_items (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_item_id on public.orders(item_id);


