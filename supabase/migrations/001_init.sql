-- CareBridge schema. RLS is the permission system: families own patients,
-- caregivers see a patient only through an active access_grant.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'family' check (role in ('family','caregiver','admin')),
  name text not null default '',
  phone text,
  city text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.caregivers (
  id uuid primary key references public.profiles on delete cascade,
  type text not null default 'care_assistant' check (type in ('nurse','care_assistant','physio','attendant')),
  gender text,
  bio text,
  years_exp int not null default 0,
  hourly_rate int not null default 300,
  daily_rate int not null default 2000,
  languages text[] not null default '{}',
  skills text[] not null default '{}',
  certifications jsonb not null default '[]',
  city text,
  lat float8,
  lng float8,
  verified boolean not null default false,
  bg_check text not null default 'pending' check (bg_check in ('pending','cleared','failed')),
  rating_avg numeric(2,1) not null default 0,
  rating_count int not null default 0,
  photo_url text
);

create table public.availability (
  id bigserial primary key,
  caregiver_id uuid not null references public.caregivers on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.profiles on delete cascade,
  name text not null,
  dob date,
  gender text,
  blood_group text,
  city text,
  address text,
  allergies text[] not null default '{}',
  conditions text[] not null default '{}',
  medications jsonb not null default '[]',
  needs text[] not null default '{}',
  emergency_contact jsonb not null default '{}',
  ai_summary text,
  health_token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  health_id text not null unique default ('CB-' || upper(encode(extensions.gen_random_bytes(2), 'hex')) || '-' || upper(encode(extensions.gen_random_bytes(2), 'hex'))),
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients on delete cascade,
  title text not null,
  kind text not null default 'other' check (kind in ('prescription','lab_report','discharge','other')),
  storage_path text not null,
  mime text,
  ai_status text not null default 'pending' check (ai_status in ('pending','processing','done','failed')),
  ai_extracted jsonb,
  ai_summary text,
  created_at timestamptz not null default now()
);

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients on delete cascade,
  grantee_id uuid not null references public.profiles on delete cascade,
  scope text not null default 'summary' check (scope in ('summary','full')),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index access_grants_active on public.access_grants (patient_id, grantee_id) where revoked_at is null;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients on delete cascade,
  caregiver_id uuid not null references public.caregivers on delete cascade,
  family_id uuid not null references public.profiles on delete cascade,
  plan text not null check (plan in ('hourly','daily','weekly','monthly')),
  units int not null default 1 check (units > 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  amount_inr int not null,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  rzp_link_id text,
  rzp_link_url text,
  created_at timestamptz not null default now()
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings on delete cascade,
  caregiver_id uuid not null references public.caregivers on delete cascade,
  check_in_at timestamptz not null default now(),
  in_lat float8, in_lng float8,
  check_out_at timestamptz,
  out_lat float8, out_lng float8,
  tasks jsonb not null default '[]',
  vitals jsonb not null default '{}',
  mood text,
  notes text
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings on delete cascade,
  caregiver_id uuid not null references public.caregivers on delete cascade,
  author_id uuid not null references public.profiles on delete cascade,
  author_name text,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles on delete cascade,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.patients (family_id);
create index on public.bookings (family_id);
create index on public.bookings (caregiver_id);
create index on public.visits (booking_id);
create index on public.documents (patient_id);
create index on public.notifications (user_id, created_at desc);
create index on public.caregivers (city);

-- ---------- helper functions (security definer so policies don't recurse) ----------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 'owner' | 'admin' | 'full' | 'summary' | null
create or replace function public.patient_scope(pid uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when exists (select 1 from public.patients where id = pid and family_id = auth.uid()) then 'owner'
    when public.is_admin() then 'admin'
    else (select g.scope from public.access_grants g
          where g.patient_id = pid and g.grantee_id = auth.uid()
            and g.revoked_at is null and (g.expires_at is null or g.expires_at > now())
          order by (g.scope = 'full') desc limit 1)
  end;
$$;

create or replace function public.is_booking_party(bid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bookings b where b.id = bid
                 and (b.family_id = auth.uid() or b.caregiver_id = auth.uid()))
         or public.is_admin();
$$;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.caregivers enable row level security;
alter table public.availability enable row level security;
alter table public.patients enable row level security;
alter table public.documents enable row level security;
alter table public.access_grants enable row level security;
alter table public.bookings enable row level security;
alter table public.visits enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

create policy "caregivers public" on public.caregivers for select to anon, authenticated using (true);
create policy "caregiver self update" on public.caregivers for update to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "availability public" on public.availability for select to anon, authenticated using (true);
create policy "availability own" on public.availability for all to authenticated
  using (caregiver_id = auth.uid()) with check (caregiver_id = auth.uid());

create policy "patients visible" on public.patients for select to authenticated using (public.patient_scope(id) is not null);
create policy "patients insert" on public.patients for insert to authenticated with check (family_id = auth.uid());
create policy "patients update" on public.patients for update to authenticated using (family_id = auth.uid()) with check (family_id = auth.uid());
create policy "patients delete" on public.patients for delete to authenticated using (family_id = auth.uid());

create policy "documents visible" on public.documents for select to authenticated
  using (public.patient_scope(patient_id) in ('owner','admin','full'));
create policy "documents write" on public.documents for all to authenticated
  using (public.patient_scope(patient_id) = 'owner') with check (public.patient_scope(patient_id) = 'owner');

create policy "grants visible" on public.access_grants for select to authenticated
  using (grantee_id = auth.uid() or public.patient_scope(patient_id) in ('owner','admin'));
create policy "grants write" on public.access_grants for all to authenticated
  using (public.patient_scope(patient_id) = 'owner') with check (public.patient_scope(patient_id) = 'owner');

create policy "bookings visible" on public.bookings for select to authenticated
  using (family_id = auth.uid() or caregiver_id = auth.uid() or public.is_admin());
create policy "bookings insert" on public.bookings for insert to authenticated
  with check (family_id = auth.uid() and public.patient_scope(patient_id) = 'owner'
              and status = 'pending' and payment_status = 'unpaid');
-- status changes go through set_booking_status(); no direct updates.

create policy "visits visible" on public.visits for select to authenticated using (public.is_booking_party(booking_id));
create policy "visits insert" on public.visits for insert to authenticated
  with check (caregiver_id = auth.uid() and exists (
    select 1 from public.bookings b where b.id = booking_id and b.caregiver_id = auth.uid() and b.status = 'confirmed'));
create policy "visits update" on public.visits for update to authenticated
  using (caregiver_id = auth.uid()) with check (caregiver_id = auth.uid());

create policy "reviews public" on public.reviews for select to anon, authenticated using (true);
create policy "reviews insert" on public.reviews for insert to authenticated
  with check (author_id = auth.uid() and exists (
    select 1 from public.bookings b where b.id = booking_id and b.family_id = auth.uid() and b.caregiver_id = reviews.caregiver_id));

create policy "notifications own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications mark read" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- triggers ----------

-- New auth user -> profile (+ caregiver row). Signup can only pick family or caregiver; admin is set by SQL.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r text := coalesce(new.raw_user_meta_data->>'role', 'family');
begin
  if r not in ('family','caregiver') then r := 'family'; end if;
  insert into public.profiles (id, role, name, phone, city)
  values (new.id, r, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
          new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'city');
  if r = 'caregiver' then
    insert into public.caregivers (id, city) values (new.id, new.raw_user_meta_data->>'city');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.notify(uid uuid, t text, b text, l text default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, title, body, link) values (uid, t, b, l);
$$;
revoke execute on function public.notify(uuid, text, text, text) from public, anon, authenticated;

create or replace function public.on_booking_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pname text; cname text;
begin
  select name into pname from public.patients where id = new.patient_id;
  select name into cname from public.profiles where id = new.caregiver_id;
  if tg_op = 'INSERT' then
    perform public.notify(new.caregiver_id, 'New booking request', 'Care for ' || pname || ' (' || new.plan || ')', '/caregiver');
  elsif new.status is distinct from old.status then
    if new.status = 'confirmed' then
      -- confirmed booking gives the caregiver summary access to the patient
      insert into public.access_grants (patient_id, grantee_id, scope)
      select new.patient_id, new.caregiver_id, 'summary'
      where not exists (select 1 from public.access_grants g where g.patient_id = new.patient_id
                        and g.grantee_id = new.caregiver_id and g.revoked_at is null);
      perform public.notify(new.caregiver_id, 'Booking confirmed', 'Payment received for ' || pname, '/caregiver');
      perform public.notify(new.family_id, 'Booking confirmed', cname || ' will care for ' || pname, '/family/bookings');
    elsif new.status = 'cancelled' then
      perform public.notify(new.caregiver_id, 'Booking cancelled', 'Care for ' || pname, '/caregiver');
      perform public.notify(new.family_id, 'Booking cancelled', cname || ' for ' || pname, '/family/bookings');
    elsif new.status = 'completed' then
      perform public.notify(new.family_id, 'Care completed', cname || ' finished care for ' || pname || '. Leave a review?', '/family/bookings');
    end if;
  end if;
  return new;
end $$;
create trigger booking_change after insert or update on public.bookings
  for each row execute function public.on_booking_change();

create or replace function public.on_visit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare b record; pname text; cname text;
begin
  select * into b from public.bookings where id = new.booking_id;
  select name into pname from public.patients where id = b.patient_id;
  select name into cname from public.profiles where id = new.caregiver_id;
  if tg_op = 'INSERT' then
    perform public.notify(b.family_id, cname || ' checked in', 'Visit started for ' || pname, '/family');
  elsif new.check_out_at is not null and old.check_out_at is null then
    perform public.notify(b.family_id, cname || ' checked out',
      'Daily report for ' || pname || ' is ready' || coalesce(' · mood: ' || new.mood, ''), '/family');
  end if;
  return new;
end $$;
create trigger visit_change after insert or update on public.visits
  for each row execute function public.on_visit_change();

create or replace function public.on_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.caregivers c set
    rating_avg = (select round(avg(rating)::numeric, 1) from public.reviews where caregiver_id = new.caregiver_id),
    rating_count = (select count(*) from public.reviews where caregiver_id = new.caregiver_id)
  where c.id = new.caregiver_id;
  return new;
end $$;
create trigger review_added after insert on public.reviews
  for each row execute function public.on_review();

-- ---------- RPCs ----------

-- Booking state machine. Family: cancel. Caregiver: cancel/complete. Paying is done by the payment edge function.
create or replace function public.set_booking_status(bid uuid, new_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  select * into b from public.bookings where id = bid;
  if b is null then raise exception 'booking not found'; end if;
  if new_status = 'cancelled' and (b.family_id = auth.uid() or b.caregiver_id = auth.uid())
     and b.status in ('pending','confirmed') then
    update public.bookings set status = 'cancelled' where id = bid;
  elsif new_status = 'completed' and b.caregiver_id = auth.uid() and b.status = 'confirmed' then
    update public.bookings set status = 'completed' where id = bid;
  else
    raise exception 'not allowed';
  end if;
end $$;

-- Ranked caregivers for a patient: skill overlap with patient needs, then rating.
create or replace function public.match_caregivers(pid uuid, max_rate int default null, lim int default 8)
returns table (id uuid, name text, type text, city text, hourly_rate int, daily_rate int, rating_avg numeric,
               years_exp int, skills text[], languages text[], verified boolean, photo_url text, overlap int)
language sql stable security invoker set search_path = '' as $$
  select c.id, p.name, c.type, c.city, c.hourly_rate, c.daily_rate, c.rating_avg, c.years_exp, c.skills,
         c.languages, c.verified, c.photo_url,
         cardinality(array(select unnest(c.skills) intersect select unnest(pt.needs))) as overlap
  from public.caregivers c
  join public.profiles p on p.id = c.id
  cross join public.patients pt
  where pt.id = pid
    and c.verified
    and (pt.city is null or c.city = pt.city)
    and (max_rate is null or c.hourly_rate <= max_rate)
  order by overlap desc, c.rating_avg desc, c.years_exp desc
  limit lim;
$$;

-- QR emergency card: public, but only the emergency subset, looked up by an unguessable token.
create or replace function public.health_card(token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'patient_id', id, 'health_id', health_id, 'name', name,
    'age', case when dob is null then null else extract(year from age(dob))::int end,
    'gender', gender, 'blood_group', blood_group, 'allergies', allergies,
    'conditions', conditions, 'medications', medications, 'emergency_contact', emergency_contact)
  from public.patients where health_token = token;
$$;
grant execute on function public.health_card(text) to anon, authenticated;

-- Admin stats, de-identified aggregates only.
create or replace function public.platform_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  return jsonb_build_object(
    'families', (select count(*) from public.profiles where role = 'family'),
    'caregivers', (select count(*) from public.caregivers),
    'verified', (select count(*) from public.caregivers where verified),
    'pending_verification', (select count(*) from public.caregivers where not verified and bg_check <> 'failed'),
    'patients', (select count(*) from public.patients),
    'bookings', (select count(*) from public.bookings),
    'revenue_inr', (select coalesce(sum(amount_inr), 0) from public.bookings where payment_status = 'paid'),
    'visits', (select count(*) from public.visits),
    'documents_processed', (select count(*) from public.documents where ai_status = 'done'),
    'by_city', (select coalesce(jsonb_object_agg(city, n), '{}') from (select city, count(*) n from public.caregivers group by city) s),
    'top_conditions', (select coalesce(jsonb_agg(jsonb_build_object('condition', c, 'patients', n)), '[]') from (
        select lower(c) c, count(*) n from public.patients, unnest(conditions) c group by 1 order by 2 desc limit 8) s),
    'age_bands', (select coalesce(jsonb_object_agg(band, n), '{}') from (
        select case when a < 70 then '60-69' when a < 80 then '70-79' when a < 90 then '80-89' else '90+' end band, count(*) n
        from (select extract(year from age(dob))::int a from public.patients where dob is not null) x group by 1) s)
  );
end $$;

create or replace function public.admin_verify(cid uuid, ok boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  update public.caregivers set verified = ok, bg_check = case when ok then 'cleared' else 'failed' end where id = cid;
  perform public.notify(cid, case when ok then 'Profile verified' else 'Verification failed' end,
    case when ok then 'You now appear in family searches.' else 'Please re-upload your documents.' end, '/caregiver');
end $$;

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('medical-docs', 'medical-docs', false)
on conflict (id) do nothing;

-- path: <patient_id>/<file>
create policy "medical docs read" on storage.objects for select to authenticated
  using (bucket_id = 'medical-docs' and public.patient_scope(((storage.foldername(name))[1])::uuid) in ('owner','admin','full'));
create policy "medical docs write" on storage.objects for insert to authenticated
  with check (bucket_id = 'medical-docs' and public.patient_scope(((storage.foldername(name))[1])::uuid) = 'owner');
create policy "medical docs delete" on storage.objects for delete to authenticated
  using (bucket_id = 'medical-docs' and public.patient_scope(((storage.foldername(name))[1])::uuid) = 'owner');

-- ---------- realtime ----------
alter publication supabase_realtime add table public.notifications, public.visits, public.bookings;
