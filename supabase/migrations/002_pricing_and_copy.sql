-- Server decides the booking price and end date; client values are ignored.
create or replace function public.price_booking() returns trigger
language plpgsql security definer set search_path = '' as $$
declare h int; d int;
begin
  select hourly_rate, daily_rate into h, d from public.caregivers where id = new.caregiver_id;
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
revoke execute on function public.price_booking() from public, anon, authenticated;
create trigger booking_price before insert on public.bookings for each row execute function public.price_booking();
