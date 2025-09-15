-- Customers Table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  total_debt numeric default 0,
  created_at timestamp with time zone default now()
);

-- Inventory Table
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  cost numeric default 0,
  quantity integer default 0,
  created_at timestamp with time zone default now()
);

-- Transactions Table (sales/debts)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  item_id uuid references public.inventory(id) on delete set null,
  quantity integer not null,
  price numeric not null,
  total numeric not null,
  created_at timestamp with time zone default now()
);

-- Payments Table (when customer pays debt)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  amount numeric not null,
  created_at timestamp with time zone default now()
);

-- Users Table (shop owner + staff)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  role text not null check (role in ('admin','staff')),
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_transactions_customer_id on public.transactions(customer_id);
create index if not exists idx_transactions_item_id on public.transactions(item_id);
create index if not exists idx_payments_customer_id on public.payments(customer_id);


