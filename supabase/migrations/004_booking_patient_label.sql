-- Caregivers must know who a booking request is for before payment, but must not see the
-- medical record until a grant exists. Store just a first name and city on the booking.
alter table public.bookings add column if not exists patient_label text, add column if not exists patient_city text;

update public.bookings b set patient_label = split_part(p.name, ' ', 1), patient_city = p.city
from public.patients p where p.id = b.patient_id and b.patient_label is null;

create or replace function public.price_booking() returns trigger
language plpgsql security definer set search_path = '' as $$
declare h int; d int;
begin
  select hourly_rate, daily_rate into h, d from public.caregivers where id = new.caregiver_id;
  select split_part(name, ' ', 1), city into new.patient_label, new.patient_city from public.patients where id = new.patient_id;
  new.amount_inr := case new.plan
    when 'hourly' then h * new.units
    when 'daily' then d * new.units
    when 'weekly' then round(d * 7 * new.units * 0.9)
    else round(d * 30 * new.units * 0.8) end;
  new.end_at := new.start_at + case new.plan
    when 'hourly' then make_interval(hours => new.units)
    when 'daily' then make_interval(days => new.units)
    when 'weekly' then make_interval(days => 7 * new.units)
    else make_interval(days => 30 * new.units) end;
  return new;
end $$;
