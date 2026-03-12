-- Supabase SQL: Erstelle diese Tabelle im Supabase SQL Editor

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  company_name text not null,
  industry text,
  location text,
  revenue_mio numeric,
  employees integer,
  description text,
  pe_score integer,
  pe_reasoning text,
  contact_name text,
  contact_position text,
  status text default 'neu' check (status in ('neu', 'kontaktiert', 'interessiert', 'abgelehnt')),
  notes text,
  created_at timestamp with time zone default now()
);

-- Row Level Security (optional, für Produktion empfohlen)
-- alter table leads enable row level security;
-- create policy "Allow all for anon" on leads for all using (true);
