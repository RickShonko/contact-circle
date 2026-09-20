# Contact directory (VCF) — Next.js + Supabase + Vercel

People join with a name, WhatsApp number and PIN. When you release the file, every member logs in and downloads one VCF that saves everyone's number.

## Set up (about 20 minutes)

### 1. Supabase
1. Create a project at supabase.com.
2. Open **SQL Editor**, paste the whole of `supabase/schema.sql`, and run it. It is safe to run again.
3. Open **Project Settings > API** and copy the **Project URL** and the **service_role** key (or the newer **secret** key). Keep the key private.

### 2. Run it on your computer
```bash
npm install
cp .env.example .env.local
```
Fill in `.env.local`:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from step 1.
- `SESSION_SECRET` and `PIN_PEPPER`: run `openssl rand -hex 32` twice (one value each).
- `ADMIN_PASSWORD_HASH`: run `npm run hash-password -- "myverylongpassphrase"` and paste the output.
- The `NEXT_PUBLIC_*` values (site name, your WhatsApp channel link, admin WhatsApp number in 254 format).

Then `npm run dev` and open http://localhost:3000. The admin area is at `/admin`.

### 3. Deploy on Vercel
1. Push this folder to a GitHub repo and import it in Vercel.
2. Add every variable from `.env.local` under **Settings > Environment Variables**.
3. Deploy, then set `NEXT_PUBLIC_SITE_URL` to your live URL and redeploy (this powers the "Share on WhatsApp" button).

## Running it
- **Admin > Settings** sets capacity, opens/closes registration and releases the file. Releasing also closes registration.
- **Verified** is a manual tick. A sensible rule: tick it once someone has messaged you from that number.
- **Forgot PIN:** the member messages you from their number; you press **Reset PIN** and send them the new one. It is shown once.
- **Export VCF / CSV** works any time, including "verified only".

## How it is protected
- The database has Row Level Security on with no public policies, so the public key can read nothing. Only the server (service-role key) touches data.
- PINs are hashed with scrypt, a per-user salt and a server-side pepper (`PIN_PEPPER`). **Never change `PIN_PEPPER` after people register**, or every PIN stops working.
- 5 login attempts per number per 15 minutes; IP limits are looser because many phones share one mobile-network IP.
- Sessions are signed, HttpOnly cookies. Admin and member sessions are separate.
- Capacity and open/closed are checked inside one database transaction, so two people can't take the last slot.

## Known limits (read these)
- **Numbers are not verified.** The PIN stops someone viewing your account, but it does not stop someone registering a number that isn't theirs. The consent checkbox, the opt-out, and the admin's Delete button are the mitigations. The upgrade is reverse verification through the WhatsApp Cloud API (the user sends a code to your number).
- A determined person can lock a victim out for 15 minutes by guessing wrong PINs for their number. That is the price of blocking PIN guessing.
- The list can't be recalled once released. The privacy page says so. **Review `app/privacy/page.tsx` and check it against Kenya's Data Protection Act** (you may need to register with the ODPC). It is a template, not legal advice.
- Supabase free projects pause after about a week of inactivity, and Vercel's free Hobby plan is for non-commercial use.
- Kenyan numbers only (`254` + 7/1…). To support other countries, edit `normalizeKenyanPhone` in `lib/validate.ts` and the CHECK constraint in `schema.sql`.
