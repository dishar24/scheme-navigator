# Scheme Navigator — SIH26092 (Cyvanta)

Full-stack version matching the architecture on the Technical Approach slide:

```
User Input → Rules Engine → Recommendation Ranking → Financial Calculator → AI Explanation Layer → Partner Locator/Router
```

Stack: **React (Vite) + Node.js/Express + Supabase**, AI explanation layer via **Groq**.

---

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `backend/schema.sql` → Run
   (this creates the tables and seeds demo scheme rules, partners, and applicants)
3. Go to **Project Settings → API** → copy your **Project URL** and **service_role key**

## 2. Run the backend

```bash
cd backend
npm install
cp .env.example .env
# paste your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY into .env
# GROQ_API_KEY is optional — without it, explanations fall back to a template sentence
npm start
```

Backend runs on `http://localhost:4000`. Check `http://localhost:4000/api/health` → should return `{"ok":true}`.

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173` — the Vite dev server proxies `/api` calls to the backend automatically (see `vite.config.js`).

---

## What's real vs. mocked (be upfront about this if judges ask)

| Data | Status |
|---|---|
| Scheme rules (income caps, interest, funding %) | Real — sourced from PS text / NSFDC public docs, stored in `scheme_rules` |
| Financial Calculator (EMI math) | Real — standard amortization formula |
| Applicant records | Real — actually saved to Supabase on every submission |
| Policy-Change Impact Scanner | Real logic — actually re-runs saved applicants against new rule versions |
| Channel partner NPA / fund-utilization status | **Mocked** — this data isn't publicly available (see `schema.sql` seed comments). Structured as a swappable field, ready for real integration later |
| Partner distance | Straight-line haversine on demo coordinates, not a live Maps API |
| AI Explanation Layer | Real Groq call if `GROQ_API_KEY` is set; falls back to a template sentence otherwise. **Never decides eligibility** — that's `rulesEngine.js`, which is deterministic |

## Demo script (matches what we planned)

1. **Applicant View**: run 1–2 applicants through the full flow (Input → Recommend → Calculator → Documents → Partners)
2. Switch to **Admin Panel**
3. Edit a scheme's income cap → **Save New Version** (old version isn't deleted — check `scheme_rules` table, you'll see both rows)
4. Click **Run Policy-Change Impact Scan** → watch a pre-seeded applicant flip from "Not Eligible" to "Newly Eligible" live
5. That's the differentiator — visible, not just claimed on a slide

## Project structure

```
scheme-navigator/
├── backend/
│   ├── server.js              # Express entry point
│   ├── schema.sql             # Run this in Supabase SQL Editor first
│   ├── lib/
│   │   ├── supabase.js        # Supabase client
│   │   ├── rulesEngine.js     # Deterministic eligibility logic (reused by recommend + scan)
│   │   └── explain.js         # AI Explanation Layer (Groq, with template fallback)
│   └── routes/
│       ├── recommend.js       # Rules Engine → Ranking → AI Explanation, saves applicant
│       ├── calculate.js       # Financial Calculator
│       ├── partners.js        # Geo-Spatial Partner Locator
│       └── admin.js           # Versioned rule editing + Policy-Change Scanner
└── frontend/
    └── src/
        ├── App.jsx            # Orchestrates the 5-step flow + Admin/Applicant switch
        ├── api.js             # All backend calls
        └── components/        # One component per flow step
```
