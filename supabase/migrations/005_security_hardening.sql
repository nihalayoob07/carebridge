-- Security + performance hardening after review.

-- 1) Admins no longer see medical records. They need bookings, verification and de-identified stats only.
--    (The demo admin's password is public, so admin must not be a path to health data.)
create or replace function public.patient_scope(pid uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when exists (select 1 from public.patients where id = pid and family_id = (select auth.uid())) then 'owner'
    else (select g.scope from public.access_grants g
          where g.patient_id = pid and g.grantee_id = (select auth.uid())
            and g.revoked_at is null and (g.expires_at is null or g.expires_at > now())
          order by (g.scope = 'full') desc limit 1)
  end;
$$;

-- 2) Profiles (names, phone numbers) are no longer readable by every signed-in user.
--    Visible: yourself, caregivers (public directory), people you share a booking with, admins.
create or replace function public.can_see_profile(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select pid = (select auth.uid())
      or exists (select 1 from public.caregivers c where c.id = pid)
      or exists (select 1 from public.bookings b
                 where (b.family_id = (select auth.uid()) and b.caregiver_id = pid)
                    or (b.caregiver_id = (select auth.uid()) and b.family_id = pid))
      or exists (select 1 from public.access_grants g join public.patients p on p.id = g.patient_id
                 where p.family_id = (select auth.uid()) and g.grantee_id = pid)
      or public.is_admin();
$$;
revoke execute on function public.can_see_profile(uuid) from public, anon;
grant execute on function public.can_see_profile(uuid) to authenticated;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles visible" on public.profiles for select to authenticated using (public.can_see_profile(id));

-- 3) Policies: evaluate auth.uid() once per query, and split "for all" write policies so SELECT has one policy.
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select p.role from public.profiles p where p.id = (select auth.uid())));

drop policy if exists "caregiver self update" on public.caregivers;
create policy "caregiver self update" on public.caregivers for update to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "availability own" on public.availability;
create policy "availability insert" on public.availability for insert to authenticated with check (caregiver_id = (select auth.uid()));
create policy "availability update" on public.availability for update to authenticated using (caregiver_id = (select auth.uid())) with check (caregiver_id = (select auth.uid()));
create policy "availability delete" on public.availability for delete to authenticated using (caregiver_id = (select auth.uid()));

drop policy if exists "patients insert" on public.patients;
drop policy if exists "patients update" on public.patients;
drop policy if exists "patients delete" on public.patients;
create policy "patients insert" on public.patients for insert to authenticated with check (family_id = (select auth.uid()));
create policy "patients update" on public.patients for update to authenticated using (family_id = (select auth.uid())) with check (family_id = (select auth.uid()));
create policy "patients delete" on public.patients for delete to authenticated using (family_id = (select auth.uid()));

drop policy if exists "documents visible" on public.documents;
drop policy if exists "documents write" on public.documents;
create policy "documents visible" on public.documents for select to authenticated using (public.patient_scope(patient_id) in ('owner','full'));
create policy "documents insert" on public.documents for insert to authenticated with check (public.patient_scope(patient_id) = 'owner');
create policy "documents update" on public.documents for update to authenticated using (public.patient_scope(patient_id) = 'owner') with check (public.patient_scope(patient_id) = 'owner');
create policy "documents delete" on public.documents for delete to authenticated using (public.patient_scope(patient_id) = 'owner');

drop policy if exists "grants visible" on public.access_grants;
drop policy if exists "grants write" on public.access_grants;
create policy "grants visible" on public.access_grants for select to authenticated
  using (grantee_id = (select auth.uid()) or public.patient_scope(patient_id) = 'owner');
create policy "grants insert" on public.access_grants for insert to authenticated with check (public.patient_scope(patient_id) = 'owner');
create policy "grants update" on public.access_grants for update to authenticated using (public.patient_scope(patient_id) = 'owner') with check (public.patient_scope(patient_id) = 'owner');
create policy "grants delete" on public.access_grants for delete to authenticated using (public.patient_scope(patient_id) = 'owner');

drop policy if exists "bookings visible" on public.bookings;
drop policy if exists "bookings insert" on public.bookings;
create policy "bookings visible" on public.bookings for select to authenticated
  using (family_id = (select auth.uid()) or caregiver_id = (select auth.uid()) or public.is_admin());
create policy "bookings insert" on public.bookings for insert to authenticated
  with check (family_id = (select auth.uid()) and public.patient_scope(patient_id) = 'owner'
              and status = 'pending' and payment_status = 'unpaid');

drop policy if exists "visits insert" on public.visits;
drop policy if exists "visits update" on public.visits;
create policy "visits insert" on public.visits for insert to authenticated
  with check (caregiver_id = (select auth.uid()) and exists (
    select 1 from public.bookings b where b.id = booking_id and b.caregiver_id = (select auth.uid()) and b.status = 'confirmed'));
create policy "visits update" on public.visits for update to authenticated
  using (caregiver_id = (select auth.uid())) with check (caregiver_id = (select auth.uid()));

drop policy if exists "reviews insert" on public.reviews;
create policy "reviews insert" on public.reviews for insert to authenticated
  with check (author_id = (select auth.uid()) and exists (
    select 1 from public.bookings b where b.id = booking_id and b.family_id = (select auth.uid()) and b.caregiver_id = reviews.caregiver_id));

drop policy if exists "notifications own" on public.notifications;
drop policy if exists "notifications mark read" on public.notifications;
create policy "notifications own" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications mark read" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Storage: medical documents follow the same rule (no admin read).
drop policy if exists "medical docs read" on storage.objects;
create policy "medical docs read" on storage.objects for select to authenticated
  using (bucket_id = 'medical-docs' and public.patient_scope(((storage.foldername(name))[1])::uuid) in ('owner','full'));

-- 4) Indexes for foreign keys used in joins and RLS checks.
create index if not exists access_grants_grantee_idx on public.access_grants (grantee_id);
create index if not exists availability_caregiver_idx on public.availability (caregiver_id);
create index if not exists bookings_patient_idx on public.bookings (patient_id);
create index if not exists reviews_author_idx on public.reviews (author_id);
create index if not exists reviews_caregiver_idx on public.reviews (caregiver_id);
create index if not exists visits_caregiver_idx on public.visits (caregiver_id);
