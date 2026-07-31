-- Create crm inbox tables and schemas for unified inbox management
create table if not exists public.inbox_accounts (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null default 'imap', -- 'gmail' | 'outlook' | 'imap'
  email_address text not null,
  imap_host text,
  imap_port integer,
  imap_secure boolean default true,
  smtp_host text,
  smtp_port integer,
  smtp_secure boolean default true,
  oauth_access_token text,
  oauth_refresh_token text,
  last_sync_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.inbox_threads (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assigned_to uuid references public.users(id) on delete set null,
  status text not null default 'open', -- 'open' | 'pending' | 'resolved'
  channel text not null default 'email', -- 'email' | 'chat' | 'form'
  subject text,
  client_id bigint references public.clients(id) on delete set null,
  inquiry_id bigint references public.inquiries(id) on delete set null,
  tags text[] default '{}',
  labels text[] default '{}',
  sentiment text default 'neutral', -- 'positive' | 'neutral' | 'negative'
  priority text default 'medium', -- 'high' | 'medium' | 'low'
  summary text,
  last_message_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.inbox_messages (
  id bigserial primary key,
  thread_id bigint not null references public.inbox_threads(id) on delete cascade,
  sender_type text not null default 'client', -- 'user' | 'client' | 'system'
  sender_email text,
  sender_name text,
  body text not null,
  attachments jsonb default '[]'::jsonb,
  read_receipt boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.inbox_notes (
  id bigserial primary key,
  thread_id bigint not null references public.inbox_threads(id) on delete cascade,
  commented_by uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS & Policies
alter table public.inbox_accounts enable row level security;
alter table public.inbox_threads enable row level security;
alter table public.inbox_messages enable row level security;
alter table public.inbox_notes enable row level security;

-- Simple policies based on tenant_id
create policy "Allow all actions for same-tenant users on inbox_accounts" on public.inbox_accounts
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "Allow all actions for same-tenant users on inbox_threads" on public.inbox_threads
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "Allow all actions for same-tenant users on inbox_messages" on public.inbox_messages
  for all using (thread_id in (select id from public.inbox_threads where tenant_id = (auth.jwt() ->> 'tenant_id')::uuid));

create policy "Allow all actions for same-tenant users on inbox_notes" on public.inbox_notes
  for all using (thread_id in (select id from public.inbox_threads where tenant_id = (auth.jwt() ->> 'tenant_id')::uuid));
