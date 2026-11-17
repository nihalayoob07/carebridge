-- CareBridge demo seed. All demo accounts share the password: carebridge123
-- Re-runnable: wipes previous demo users (emails ending @carebridge.demo) first.

delete from auth.users where email like '%@carebridge.demo';

create or replace function pg_temp.mk_user(em text, meta jsonb) returns uuid language plpgsql as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
    extensions.crypt('carebridge123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', meta, now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true),
    'email', now(), now(), now());
  return uid;
end $$;

do $$
declare
  first_f text[] := array['Meera','Anjali','Lakshmi','Priya','Deepa','Kavya','Sneha','Divya','Revathi','Fatima','Asha','Sunita','Neha','Pooja','Rekha','Shalini','Bindu','Jyothi','Sangeetha','Nisha'];
  first_m text[] := array['Arjun','Rahul','Vikram','Suresh','Manoj','Rajesh','Anil','Joseph','Imran','Karthik','Sanjay','Vinod','Ravi','Abdul','Thomas','Ganesh','Naveen','Pradeep','Sathish','Ajay'];
  last_n text[] := array['Nair','Menon','Pillai','Iyer','Reddy','Sharma','Gupta','Thomas','Kurian','Khan','Rao','Das','Patel','Joshi','Krishnan','Varghese','Shetty','Gowda','Mukherjee','Singh'];
  cities text[] := array['Kochi','Bengaluru','Chennai','Mumbai','Delhi'];
  langs jsonb := '{"Kochi":["Malayalam","English","Hindi"],"Bengaluru":["Kannada","English","Hindi","Tamil"],"Chennai":["Tamil","English"],"Mumbai":["Marathi","Hindi","English"],"Delhi":["Hindi","English","Punjabi"]}';
  coords jsonb := '{"Kochi":[9.9312,76.2673],"Bengaluru":[12.9716,77.5946],"Chennai":[13.0827,80.2707],"Mumbai":[19.076,72.8777],"Delhi":[28.6139,77.209]}';
  types text[] := array['nurse','care_assistant','physio','attendant'];
  skill_sets jsonb := '{
    "nurse":["medication management","wound care","diabetes management","hypertension monitoring","post-operative care","catheter care","palliative care","respiratory care"],
    "care_assistant":["elderly companionship","mobility assistance","dementia care","medication management","personal hygiene","meal preparation"],
    "physio":["physiotherapy","stroke rehabilitation","mobility assistance","post-operative care","parkinsons care","fall prevention"],
    "attendant":["mobility assistance","personal hygiene","elderly companionship","night care","meal preparation"]}';
  certs jsonb := '{
    "nurse":[{"name":"B.Sc Nursing","issuer":"Kerala University of Health Sciences"},{"name":"Registered Nurse (RN)","issuer":"State Nursing Council"}],
    "care_assistant":[{"name":"Geriatric Care Assistant","issuer":"Healthcare Sector Skill Council"}],
    "physio":[{"name":"BPT: Bachelor of Physiotherapy","issuer":"Rajiv Gandhi University of Health Sciences"}],
    "attendant":[{"name":"General Duty Assistant","issuer":"Healthcare Sector Skill Council"}]}';
  i int; uid uuid; t text; c text; nm text; g text; sk jsonb; picked text[]; base int; exp int;
  -- demo people
  anita uuid; rahul uuid; priya uuid; meera uuid; arjun uuid; admin_id uuid;
  p_sara uuid; p_gopal uuid; p_kamala uuid; p_venk uuid; p_lak uuid;
  b1 uuid; b2 uuid; b3 uuid; b4 uuid; d int;
begin
  -- featured demo caregivers
  meera := pg_temp.mk_user('meera@carebridge.demo', '{"role":"caregiver","name":"Meera Thomas","city":"Kochi","phone":"+91 98470 11223"}');
  update public.caregivers set type='nurse', gender='female', years_exp=9, hourly_rate=450, daily_rate=3000,
    languages=array['Malayalam','English','Hindi','Tamil'],
    skills=array['diabetes management','hypertension monitoring','medication management','wound care','dementia care','elderly companionship'],
    certifications=certs->'nurse', city='Kochi', lat=9.9312, lng=76.2673, verified=true, bg_check='cleared',
    bio='Registered nurse with 9 years in geriatric wards at Amrita and Lakeshore hospitals. Calm, patient, and great with diabetic and memory-care patients.'
  where id = meera;
  arjun := pg_temp.mk_user('arjun@carebridge.demo', '{"role":"caregiver","name":"Arjun Reddy","city":"Bengaluru","phone":"+91 99000 44556"}');
  update public.caregivers set type='physio', gender='male', years_exp=6, hourly_rate=550, daily_rate=3500,
    languages=array['Kannada','English','Hindi','Telugu'],
    skills=array['physiotherapy','post-operative care','mobility assistance','fall prevention','stroke rehabilitation'],
    certifications=certs->'physio', city='Bengaluru', lat=12.9716, lng=77.5946, verified=true, bg_check='cleared',
    bio='Physiotherapist specialising in post-surgical rehab for hip and knee replacements. Home visits across south Bengaluru.'
  where id = arjun;

  -- 40 more caregivers
  for i in 1..40 loop
    c := cities[1 + (i % 5)];
    t := types[1 + (i % 4)];
    g := case when i % 3 = 0 then 'male' else 'female' end;
    nm := case when g = 'male' then first_m[1 + (i % 20)] else first_f[1 + ((i * 7) % 20)] end || ' ' || last_n[1 + ((i * 3) % 20)];
    uid := pg_temp.mk_user('cg' || i || '@carebridge.demo', jsonb_build_object('role','caregiver','name',nm,'city',c));
    sk := skill_sets->t;
    select array_agg(x) into picked from (select x from jsonb_array_elements_text(sk) x order by md5(x || i) limit 3 + (i % 3)) s;
    base := case t when 'nurse' then 380 when 'physio' then 480 when 'care_assistant' then 280 else 250 end;
    exp := 1 + (i * 7) % 15;
    update public.caregivers set type=t, gender=g, years_exp=exp,
      hourly_rate = base + (i * 13) % 160, daily_rate = (base + (i * 13) % 160) * 7,
      languages = array(select jsonb_array_elements_text(langs->c)),
      skills = picked, certifications = certs->t, city = c,
      lat = (coords->c->>0)::float8 + ((i % 7) - 3) * 0.01, lng = (coords->c->>1)::float8 + ((i % 5) - 2) * 0.01,
      verified = (i % 6 <> 0), bg_check = case when i % 6 = 0 then 'pending' else 'cleared' end,
      rating_avg = round((3.8 + ((i * 17) % 12) / 10.0)::numeric, 1), rating_count = 3 + (i * 5) % 40,
      bio = case t
        when 'nurse' then 'Qualified nurse with ' || exp || ' years of home and hospital care for seniors.'
        when 'physio' then 'Physiotherapist focused on mobility, balance and recovery after surgery or stroke.'
        when 'care_assistant' then 'Trained elderly-care assistant: companionship, routines, medicines and gentle daily support.'
        else 'Reliable attendant for day and night care, hygiene, meals and mobility support.' end
    where id = uid;
    insert into public.availability (caregiver_id, weekday, start_time, end_time)
    select uid, wd, '08:00', case when i % 2 = 0 then '20:00'::time else '17:00'::time end
    from generate_series(case when i % 4 = 0 then 0 else 1 end, 6) wd;
  end loop;
  insert into public.availability (caregiver_id, weekday, start_time, end_time)
  select x, wd, '07:00', '19:00' from unnest(array[meera, arjun]) x, generate_series(1, 6) wd;

  -- families
  anita := pg_temp.mk_user('anita@carebridge.demo', '{"role":"family","name":"Anita Menon","city":"Kochi","phone":"+971 50 123 4567"}');
  rahul := pg_temp.mk_user('rahul@carebridge.demo', '{"role":"family","name":"Rahul Sharma","city":"Bengaluru","phone":"+91 98450 77889"}');
  priya := pg_temp.mk_user('priya@carebridge.demo', '{"role":"family","name":"Priya Iyer","city":"Chennai","phone":"+44 7700 900123"}');
  admin_id := pg_temp.mk_user('admin@carebridge.demo', '{"role":"family","name":"CareBridge Admin"}');
  update public.profiles set role = 'admin' where id = admin_id;

  insert into public.patients (family_id, name, dob, gender, blood_group, city, address, allergies, conditions, medications, needs, emergency_contact, ai_summary)
  values (anita, 'Saraswathi Menon', '1947-03-12', 'female', 'B+', 'Kochi', 'Panampilly Nagar, Kochi',
    array['Penicillin','Sulfa drugs'], array['Type 2 diabetes','Hypertension','Mild cognitive impairment'],
    '[{"name":"Metformin","dose":"500 mg","frequency":"twice daily after food"},{"name":"Amlodipine","dose":"5 mg","frequency":"once daily, morning"},{"name":"Donepezil","dose":"5 mg","frequency":"once daily, night"}]',
    array['diabetes management','hypertension monitoring','medication management','dementia care','elderly companionship'],
    '{"name":"Anita Menon","relation":"Daughter","phone":"+971 50 123 4567"}',
    'Saraswathi is 79 and lives with type 2 diabetes, high blood pressure and early memory loss. She needs help taking three daily medicines on time, a blood-sugar check before breakfast and dinner, and a BP reading each morning. She is allergic to penicillin and sulfa drugs. Gentle reminders and conversation help her stay oriented.')
  returning id into p_sara;
  insert into public.patients (family_id, name, dob, gender, blood_group, city, address, allergies, conditions, medications, needs, emergency_contact)
  values (anita, 'Gopal Menon', '1943-08-02', 'male', 'O+', 'Kochi', 'Panampilly Nagar, Kochi',
    array[]::text[], array['Alzheimer''s disease','Osteoarthritis'],
    '[{"name":"Memantine","dose":"10 mg","frequency":"twice daily"},{"name":"Paracetamol","dose":"650 mg","frequency":"as needed for knee pain"}]',
    array['dementia care','mobility assistance','fall prevention'],
    '{"name":"Anita Menon","relation":"Daughter","phone":"+971 50 123 4567"}')
  returning id into p_gopal;
  insert into public.patients (family_id, name, dob, gender, blood_group, city, address, allergies, conditions, medications, needs, emergency_contact, ai_summary)
  values (rahul, 'Kamala Sharma', '1951-11-20', 'female', 'A+', 'Bengaluru', 'Jayanagar 4th Block, Bengaluru',
    array['Aspirin'], array['Right hip replacement (Oct 2026)','Osteoporosis'],
    '[{"name":"Enoxaparin","dose":"40 mg","frequency":"once daily injection (14 days)"},{"name":"Calcium + Vitamin D3","dose":"500 mg","frequency":"once daily"}]',
    array['physiotherapy','post-operative care','mobility assistance','fall prevention'],
    '{"name":"Rahul Sharma","relation":"Son","phone":"+91 98450 77889"}',
    'Kamala is recovering from a right hip replacement done in October. She needs daily physiotherapy, help walking with a walker, and fall prevention at home. She takes a daily blood-thinner injection for two weeks and calcium for weak bones. She must not take aspirin.')
  returning id into p_kamala;
  insert into public.patients (family_id, name, dob, gender, blood_group, city, allergies, conditions, medications, needs, emergency_contact)
  values (priya, 'Venkatesh Iyer', '1940-05-30', 'male', 'AB+', 'Chennai', array['Iodine contrast'],
    array['Parkinson''s disease','Hypertension'],
    '[{"name":"Levodopa/Carbidopa","dose":"100/25 mg","frequency":"three times daily"}]',
    array['parkinsons care','mobility assistance','medication management'],
    '{"name":"Priya Iyer","relation":"Daughter","phone":"+44 7700 900123"}')
  returning id into p_venk;
  insert into public.patients (family_id, name, dob, gender, blood_group, city, allergies, conditions, medications, needs, emergency_contact)
  values (priya, 'Lakshmi Iyer', '1945-01-14', 'female', 'O-', 'Chennai', array[]::text[],
    array['COPD'], '[{"name":"Tiotropium inhaler","dose":"18 mcg","frequency":"once daily"}]',
    array['respiratory care','elderly companionship'],
    '{"name":"Priya Iyer","relation":"Daughter","phone":"+44 7700 900123"}')
  returning id into p_lak;

  -- Anita booked Meera for her mother: weekly plan, confirmed and paid, running this week.
  insert into public.bookings (patient_id, caregiver_id, family_id, plan, units, start_at, end_at, status, amount_inr, payment_status, notes)
  values (p_sara, meera, anita, 'weekly', 2, date_trunc('day', now()) - interval '4 days' + interval '9 hours',
    date_trunc('day', now()) + interval '10 days' + interval '17 hours', 'pending', 2 * 7 * 3000, 'unpaid',
    'Mornings 9 to 5. Please check sugar before lunch.')
  returning id into b1;
  update public.bookings set status = 'confirmed', payment_status = 'paid', rzp_link_id = 'demo_seed' where id = b1;

  -- Past visits with daily reports
  for d in 1..4 loop
    insert into public.visits (booking_id, caregiver_id, check_in_at, in_lat, in_lng, check_out_at, out_lat, out_lng, tasks, vitals, mood, notes)
    values (b1, meera,
      date_trunc('day', now()) - (d || ' days')::interval + interval '9 hours' + ((d * 4) || ' minutes')::interval, 9.9601, 76.2905,
      date_trunc('day', now()) - (d || ' days')::interval + interval '17 hours' + ((d * 3) || ' minutes')::interval, 9.9601, 76.2905,
      ('[{"label":"Morning medicines (Metformin, Amlodipine)","done":true},{"label":"Blood sugar before breakfast","done":true},{"label":"BP check","done":true},{"label":"30 min walk in the garden","done":' || (d <> 2)::text || '},{"label":"Lunch and fluids","done":true},{"label":"Memory exercises / conversation","done":true}]')::jsonb,
      jsonb_build_object('bp', (126 + d * 3) || '/' || (78 + d), 'sugar_fasting', 118 + d * 6, 'pulse', 72 + d, 'temp_c', 36.7),
      (array['Cheerful','Calm','Tired','Cheerful'])[d],
      (array['Good day. Ate well, walked in the garden and talked about her school days. Sugar slightly high after a sweet at tea. Told family.',
             'Calm morning. Skipped the walk due to rain; did chair exercises instead. All medicines on time.',
             'A bit tired and slept after lunch. BP normal. Reminded her twice about the evening tablet.',
             'Very chatty today! Called Anita on video. Vitals stable.'])[d]);
  end loop;

  -- Rahul booked Arjun for Kamala: confirmed daily physio
  insert into public.bookings (patient_id, caregiver_id, family_id, plan, units, start_at, end_at, status, amount_inr, payment_status)
  values (p_kamala, arjun, rahul, 'daily', 10, date_trunc('day', now()) - interval '2 days' + interval '8 hours',
    date_trunc('day', now()) + interval '8 days' + interval '18 hours', 'pending', 10 * 3500, 'unpaid')
  returning id into b2;
  update public.bookings set status = 'confirmed', payment_status = 'paid', rzp_link_id = 'demo_seed' where id = b2;
  insert into public.visits (booking_id, caregiver_id, check_in_at, in_lat, in_lng, check_out_at, out_lat, out_lng, tasks, vitals, mood, notes)
  values (b2, arjun, date_trunc('day', now()) - interval '1 day' + interval '8 hours 5 minutes', 12.925, 77.5838,
    date_trunc('day', now()) - interval '1 day' + interval '11 hours', 12.925, 77.5838,
    '[{"label":"Hip ROM exercises","done":true},{"label":"Walker practice: 2 laps of the hall","done":true},{"label":"Enoxaparin injection","done":true},{"label":"Stair practice","done":false}]',
    '{"bp":"132/84","pulse":78,"pain_0_10":4}', 'Motivated', 'Walked 40 m with the walker. Pain 4/10. Stairs next week.');

  -- A finished past booking with a review (Priya → a Chennai nurse)
  select c.id into uid from public.caregivers c where c.city = 'Chennai' and c.type = 'nurse' and c.verified limit 1;
  insert into public.bookings (patient_id, caregiver_id, family_id, plan, units, start_at, end_at, status, amount_inr, payment_status)
  values (p_venk, uid, priya, 'weekly', 1, now() - interval '30 days', now() - interval '23 days', 'pending', 7 * 2800, 'unpaid')
  returning id into b3;
  update public.bookings set status = 'confirmed', payment_status = 'paid' where id = b3;
  update public.bookings set status = 'completed' where id = b3;
  insert into public.reviews (booking_id, caregiver_id, author_id, author_name, rating, comment)
  values (b3, uid, priya, 'Priya I.', 5, 'Handled Appa''s Parkinson''s medicine timings perfectly and sent me updates every evening in London.');

  -- A fresh pending request for Meera to accept/see
  insert into public.bookings (patient_id, caregiver_id, family_id, plan, units, start_at, end_at, status, amount_inr, payment_status)
  values (p_gopal, meera, anita, 'hourly', 4, date_trunc('day', now()) + interval '2 days 10 hours',
    date_trunc('day', now()) + interval '2 days 14 hours', 'pending', 4 * 450, 'unpaid')
  returning id into b4;

  -- Sample reviews on Meera and Arjun (attached to their confirmed bookings)
  insert into public.reviews (booking_id, caregiver_id, author_id, author_name, rating, comment)
  values (b1, meera, anita, 'Anita M.', 5, 'Amma loves her. Daily reports reach me in Dubai every evening. Huge relief.'),
         (b2, arjun, rahul, 'Rahul S.', 5, 'Very professional. Mum was walking with the walker within a week.');
  update public.caregivers set rating_count = rating_count + 23, rating_avg = 4.9 where id = meera;
  update public.caregivers set rating_count = rating_count + 14, rating_avg = 4.8 where id = arjun;

  -- pending verification queue for admin (one with a richer profile)
  update public.caregivers set verified = false, bg_check = 'pending' where id in (
    select id from public.caregivers where city = 'Kochi' and id not in (meera) order by years_exp desc limit 1);
end $$;

-- clear seed-generated notification noise, then add a few readable ones
delete from public.notifications where user_id in (select id from auth.users where email like '%@carebridge.demo');
insert into public.notifications (user_id, title, body, link, created_at)
select p.id, x.title, x.body, x.link, now() - x.ago from public.profiles p
join auth.users u on u.id = p.id
cross join lateral (values
  ('Meera Thomas checked out', 'Daily report for Saraswathi Menon is ready, mood: Cheerful', '/family', interval '15 hours'),
  ('AI summary ready', 'Blood report for Saraswathi Menon was read and organised', '/family', interval '2 days')
) x(title, body, link, ago)
where u.email = 'anita@carebridge.demo';
insert into public.notifications (user_id, title, body, link)
select id, 'New booking request', 'Care for Gopal Menon (hourly), 4 hours', '/caregiver' from auth.users where email = 'meera@carebridge.demo';

-- Seed times above are written as IST wall-clock on a UTC server; shift them to IST.
update public.visits set check_in_at = check_in_at - interval '5 hours 30 minutes', check_out_at = check_out_at - interval '5 hours 30 minutes';
update public.bookings set start_at = start_at - interval '5 hours 30 minutes', end_at = end_at - interval '5 hours 30 minutes';

-- Make generated caregiver names unique.
with d as (
  select p.id, p.name, row_number() over (partition by p.name order by p.id) rn, row_number() over (order by p.id) k
  from public.profiles p join public.caregivers c on c.id = p.id
)
update public.profiles p set name = split_part(d.name, ' ', 1) || ' ' ||
  (array['Mathew','Narayanan','Bhat','Chandran','Hegde','Kulkarni','Fernandes','Mishra','Pandey','Saxena','Banerjee','Chatterjee','Jacob','Abraham','Raman','Subramaniam','Desai','Kamath','Prabhu','Ahmed','Siddiqui','Thakur','Bose','Dutta'])[1 + (d.k % 24)::int]
from d where d.id = p.id and d.rn > 1;
