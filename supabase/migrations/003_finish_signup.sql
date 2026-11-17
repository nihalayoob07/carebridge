-- Google sign-ups can't pass a role in user metadata, so the app claims it right after the first sign-in.
-- Only allowed within 30 minutes of account creation, only family/caregiver, never touches admins.
create or replace function public.finish_signup(r text, c text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  select * into p from public.profiles where id = auth.uid();
  if p is null then raise exception 'no profile'; end if;
  if r not in ('family','caregiver') then raise exception 'invalid role'; end if;
  if p.role = 'admin' or p.created_at < now() - interval '30 minutes' then return; end if;
  update public.profiles set role = r, city = coalesce(c, city) where id = p.id;
  if r = 'caregiver' then
    insert into public.caregivers (id, city) values (p.id, c) on conflict (id) do nothing;
  end if;
end $$;
revoke execute on function public.finish_signup(text, text) from public, anon;
grant execute on function public.finish_signup(text, text) to authenticated;
