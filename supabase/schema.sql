create table if not exists public.toilet_spots (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  area text not null check (char_length(btrim(area)) between 1 and 80),
  city text not null check (char_length(btrim(city)) between 1 and 60),
  province text not null check (char_length(btrim(province)) between 1 and 60),
  latitude double precision not null check (latitude between -11 and 6),
  longitude double precision not null check (longitude between 95 and 141),
  price integer not null default 0 check (price >= 0),
  amenities text[] not null default '{}',
  image text not null default '',
  description text not null default '',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.toilet_reviews (
  id uuid primary key default gen_random_uuid(),
  toilet_spot_id uuid not null references public.toilet_spots(id) on delete cascade,
  author text not null check (char_length(btrim(author)) between 1 and 50),
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.toilet_spots enable row level security;
alter table public.toilet_reviews enable row level security;

drop policy if exists "Anyone can read toilet spots" on public.toilet_spots;
create policy "Anyone can read toilet spots"
  on public.toilet_spots for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can submit toilet spots" on public.toilet_spots;
create policy "Anyone can submit toilet spots"
  on public.toilet_spots for insert
  to anon, authenticated
  with check (verified = false);

drop policy if exists "Anyone can read toilet reviews" on public.toilet_reviews;
create policy "Anyone can read toilet reviews"
  on public.toilet_reviews for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can submit toilet reviews" on public.toilet_reviews;
create policy "Anyone can submit toilet reviews"
  on public.toilet_reviews for insert
  to anon, authenticated
  with check (true);

revoke all on public.toilet_spots from anon, authenticated;
revoke all on public.toilet_reviews from anon, authenticated;
grant select, insert on public.toilet_spots to anon, authenticated;
grant select, insert on public.toilet_reviews to anon, authenticated;

insert into public.toilet_spots
  (id, name, area, city, province, latitude, longitude, price, amenities, image, description)
values
  (
    '00000000-0000-4000-8000-000000000001', 'The Shady Shack', 'Canggu, Badung', 'Canggu', 'Bali',
    -8.6508, 115.1366, 0, array['Free', 'Clean', 'Accessible'],
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85',
    'Demonstration listing. Check current access and facilities before visiting.'
  ),
  (
    '00000000-0000-4000-8000-000000000002', 'Kota Tua Visitor Centre', 'Pinangsia, Jakarta Barat', 'Jakarta', 'DKI Jakarta',
    -6.1352, 106.8133, 2000, array['Clean', 'Water', 'Accessible'],
    'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=85',
    'Demonstration listing. Check current access and facilities before visiting.'
  ),
  (
    '00000000-0000-4000-8000-000000000003', 'Braga Citywalk', 'Braga, Bandung', 'Bandung', 'West Java',
    -6.9175, 107.6098, 0, array['Free', 'Clean', 'Water'],
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=85',
    'Demonstration listing. Check current access and facilities before visiting.'
  ),
  (
    '00000000-0000-4000-8000-000000000004', 'Stasiun Tugu', 'Sosromenduran, Yogyakarta', 'Yogyakarta', 'DI Yogyakarta',
    -7.7892, 110.3638, 2000, array['Water', 'Open late'],
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=85',
    'Demonstration listing. Check current access and facilities before visiting.'
  )
on conflict (id) do nothing;
