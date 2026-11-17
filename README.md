# CareBridge

Elder-care marketplace and care-management platform for India. Families find verified caregivers, keep medical records organised by AI, share them with fine-grained permissions, and follow every visit live.

One Expo codebase ships as:
- **Website + web app** (Vercel), which iPhone users add to their Home Screen
- **Android APK** (EAS Build)

## Stack
- Expo SDK 58, Expo Router, React Native, React Native Web
- Supabase: Postgres + Row Level Security (the permission system), Auth, Storage, Realtime, Edge Functions
- Groq (Llama 3.3 70B text, Llama 4 Scout vision) for document reading and caregiver matching
- Razorpay Payment Links (test mode); falls back to a simulated payment when keys aren't set
- Geist + Anton type, Phosphor icons

## Features
- Caregiver search and filters, verified profiles, reviews, weekly availability
- AI matching: SQL pre-filter on skills × patient needs, then Groq re-ranks with a reason per match
- Medical records: upload PDF or photo, AI extracts medicines, allergies, lab values and care needs and merges them into the profile
- Sharing: booked caregivers get **Summary** access automatically; families upgrade to **Full** or revoke it anytime (enforced by RLS)
- QR Health ID: a public emergency card (allergies, medicines, contacts) behind an unguessable token
- Booking hourly, daily, weekly or monthly, with prices calculated on the server and Razorpay payment
- Caregiver check-in and check-out with GPS, task checklist, vitals, mood, notes; families get live notifications
- Admin: verification queue, all bookings, de-identified research insights

## Demo accounts
Password for all: `carebridge123` (one-tap buttons on the login screen)

| Email | Role |
|---|---|
| anita@carebridge.demo | Family (daughter in Dubai) |
| rahul@carebridge.demo | Family |
| meera@carebridge.demo | Caregiver (nurse, Kochi) |
| arjun@carebridge.demo | Caregiver (physio, Bengaluru) |
| admin@carebridge.demo | Admin |

## Setup
1. `npm install`
2. `.env` holds the Supabase URL and publishable key (public by design).
3. Supabase → Edge Functions → Secrets:
   - `GROQ_API_KEY` (free at console.groq.com), required for AI
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (test mode), optional; without them, payment is simulated
4. Database: run `supabase/migrations/*.sql`, then `supabase/seed.sql`.
5. Functions live in `supabase/functions/` (`process-document`, `match-caregivers`, `payment`).

## Run
```bash
npx expo start          # Android via Expo Go / emulator, press w for web
npm run build:web       # static web build into dist/
```

## Deploy
- Live: https://carebridge-two-swart.vercel.app
- Web: `vercel deploy --prod` (vercel.json builds `dist/` and rewrites routes to the SPA)
- Android: `npx eas-cli@latest build -p android --profile preview` produces an installable APK
