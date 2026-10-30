-- Isabelle invitation schema. Idempotent: safe to run repeatedly.
-- Apply with `npm run db:migrate`.

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  submission_key uuid not null unique,
  guest_name text not null check (char_length(guest_name) between 1 and 100),
  name_key text not null,
  attending boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists rsvps_name_key_idx on rsvps (name_key);
create index if not exists rsvps_created_at_idx on rsvps (created_at desc);

create table if not exists godparent_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  display_name text not null check (char_length(display_name) between 1 and 100),
  role text not null check (role in ('ninong', 'ninang')),
  created_at timestamptz not null default now()
);

create table if not exists godparent_responses (
  id uuid primary key default gen_random_uuid(),
  submission_key uuid not null unique,
  invite_id uuid unique references godparent_invites (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  role text check (role in ('ninong', 'ninang')),
  accepted boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists admin_sessions (
  token_hash text primary key,
  admin_id uuid not null references admin_users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (bucket, window_start)
);

-- Defense in depth. The app connects as the table owner (which bypasses RLS),
-- and all access goes through server code. RLS with no policies means any
-- other role, such as a future Data API or anonymous role, sees nothing.
alter table rsvps enable row level security;
alter table godparent_invites enable row level security;
alter table godparent_responses enable row level security;
alter table admin_users enable row level security;
alter table admin_sessions enable row level security;
alter table rate_limits enable row level security;

revoke all on rsvps, godparent_invites, godparent_responses, admin_users, admin_sessions, rate_limits from public;
