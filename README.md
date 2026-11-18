# CareBridge

**Trusted elder care, brought home.**

CareBridge helps families in India find verified caregivers and nurses for their ageing parents, keep their medical records organised, and stay close to every visit, even from another city or country.

**Live:** https://carebridge-two-swart.vercel.app (web app for iPhone, Android and desktop; also available as an Android app)

---

## The problem

Families caring for an elderly parent juggle disconnected tools: word-of-mouth to find a nurse, paper prescriptions in a drawer, phone calls to check whether the caregiver turned up. Children living abroad have almost no visibility. In an emergency, nobody has the parent's allergies or medicines to hand.

## What CareBridge does

**Find the right caregiver**
Search nurses, physiotherapists, care assistants and attendants by city, language, specialisation and price. Every profile shows qualifications, verification and background-check status, availability and reviews from real families. AI ranks caregivers against the patient's actual conditions and explains why each one fits.

**Medical records that organise themselves**
Upload a prescription, blood report or discharge summary as a PDF or a photo. CareBridge's AI reads it, pulls out medicines, allergies, lab values and care needs, and writes a plain-English summary a worried family member can understand. The patient's profile updates automatically.

**The family decides who sees what**
A booked caregiver automatically gets a care summary only: allergies, medicines and needs. Families can upgrade a caregiver to full records or revoke access in one tap, and it takes effect immediately.

**A health ID for emergencies**
Each patient gets a QR health card for the wallet or fridge. Anyone who scans it, a neighbour or a paramedic, sees only what matters in an emergency: blood group, allergies, current medicines, conditions and who to call. The full record stays private.

**Book and pay in minutes**
Book care by the hour, day, week or month, with weekly and monthly discounts. Prices are calculated by the platform and paid securely with UPI, cards or netbanking.

**Every visit, live**
Caregivers check in and out with their location, tick off tasks, record vitals and mood, and write a short note. Families get the daily report and live updates wherever they are.

**Built for the people running it**
Administrators verify caregivers, oversee bookings and see de-identified insights, such as the most common conditions and age bands, without access to anyone's medical records.

## Who it's for

- **Families**, especially sons and daughters living in another city or abroad
- **Caregivers and nurses** looking for verified, well-matched work
- **Agencies and administrators** who need oversight without compromising privacy

## Privacy and trust

- Access to medical data is enforced in the database itself, not just in the app
- Families control sharing; caregivers only see what they're given, and administrators never see medical records
- Written to India's Digital Personal Data Protection Act 2023 and the Consumer Protection (E-Commerce) Rules 2020, with a published Privacy Policy, Terms of Service and Grievance Officer

## Try it

Open the live site and use the one-tap demo accounts on the sign-in page:

| Account | What you'll see |
|---|---|
| Anita, daughter in Dubai | Family dashboard, AI records, sharing, health ID, bookings |
| Rahul, son in Bengaluru | A family whose mother is recovering from hip surgery |
| Meera, nurse in Kochi | Caregiver day: visits, check-in, daily reports, requests |
| Arjun, physio in Bengaluru | Caregiver view for physiotherapy care |
| Platform admin | Verification queue, bookings and de-identified insights |

Demo payments run in test mode; no real money changes hands.

---

## Tech stack

- **App:** Expo (React Native) with Expo Router, one codebase for the web app and the Android app
- **Backend:** Supabase (Postgres with row-level security, Auth, Storage, Realtime, Edge Functions)
- **AI:** Groq-hosted open models for document reading and caregiver matching
- **Payments:** Razorpay
- **Hosting:** Vercel (web) and Expo Application Services (Android builds)
- **Design:** Geist and Anton type, Phosphor icons, OKLCH colour palette
