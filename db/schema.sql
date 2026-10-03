-- Drini Offers: tabela e shablloneve. Ekzekutoje nje here ne Neon SQL Editor.
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  data jsonb not null,
  hero_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists templates_updated_idx on templates (updated_at desc);
