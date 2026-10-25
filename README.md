# TraceBack — AI-Powered Lost & Found Network

> **"Find the item. Verify the owner. Return it safely."**

TraceBack is a production-grade, full-stack lost-and-found web platform engineered for colleges, university campuses, transit stations, libraries, malls, and local communities.

---

## 🌟 Core Features

1. **AI-Assisted Natural Language Reporting**:
   - Report lost items without photographs.
   - Describe belongings in everyday natural language; Gemini AI extracts structured title, category, subcategory, brand, colors, distinguishing marks, and search terms.
   - Attach authentic category references with mandatory disclaimer: *"AI-generated illustrative image — not a photograph of the actual lost item."*

2. **Multi-Signal Candidate Matching Engine**:
   - Hybrid algorithmic scoring balancing:
     - Category and subcategory compatibility (25%)
     - Brand and manufacturer matching (20%)
     - Color spectrum correspondence (15%)
     - Venue proximity and city alignment (20%)
     - Recovery timeline and date window (10%)
     - Text keyword and descriptive overlap (10%)
   - Transparent scoring breakdown, matching vs. conflicting attribute inspection, and deep Gemini AI match explanations.
   - **Privacy Rule**: Candidate similarity scores are strictly ranking suggestions; AI never declares ownership verified.

3. **Secure Ownership Verification & Claim Flow**:
   - Privacy-guarded verification clues (serials, hidden marks, wallpaper, locker custody locations) are never exposed to public search or listings.
   - Multi-step claim workflow: claimant answers specific custodian verification questions and provides private purchase or ownership proof.
   - Authorized custodian/staff review with approval, rejection, or requests for additional evidence.
   - Safe handover scheduling at verified campus locations (e.g., Campus Security Station, Student Union Desk) with a 4-digit verification code (`TB-XXXX`) and two-party confirmation with celebratory confetti return.

4. **100 Realistic Benchmark Items**:
   - Fully seeded with exactly 100 realistic community items (50 lost, 50 found) across diverse categories: Electronics, Bags & Luggage, Keys & Badges, Personal Accessories, Documents & IDs, Clothing & Footwear, and Books & Stationery.
   - Realistic venues: *Main Library 3rd Floor, Student Union Dining Hall, Science Center Atrium, Engineering Quad Lab, Athletics Gym, Central Transit Hub*, etc.
   - 1-click safe "Reset Benchmark Dataset" in the Admin Console.

5. **Real Database-Backed Analytics Dashboard**:
   - Real-time Recharts visualizations.
   - Total lost vs. found volume, active reports, pending claims, and verified return rate.
   - 6-month monthly reporting trends and category distribution.
   - Top incident facilities and venues.

6. **Design System & Anti-Slop Discipline**:
   - Built to SaaS and Frontend Design Constitution guidelines:
     - 3-zone Top Bar Contract.
     - Zero-Pill metadata discipline (unboxed text with clean typographic separators `·`).
     - Zero-broken-image policy with styled fallback containers.
     - Dynamic light/dark theme with active accent palette selector (Indigo, Nordic Teal, Campus Emerald, Warm Amber, Berry Rose, Electric Violet).
     - Responsive layouts for desktop, tablet, and mobile.

---

## 🏗️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion, Canvas-Confetti, Recharts
- **Backend**: Node.js, Express.js, TypeScript, REST API v1 architecture
- **Database & Storage**: Atomic persistent document store with MongoDB Atlas compatibility and JSON disk persistence in `/data`
- **AI & Reasoning**: Google Gemini API (`@google/genai` with `gemini-3.8-flash`)

---

## 🚀 Getting Started

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
CLIENT_URL="http://localhost:3000"
```

### 2. Development Mode
Run the full-stack dev server:
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### 3. Run Automated Verification Tests
Execute the 29-point test suite covering auth, matching, privacy, claims, and the end-to-end lifecycle:
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 👥 Demo Profiles (1-Click Switcher)

For instant testing, use the top-right profile menu to switch between:
- **Admin**: `Marcus Vance` (`marcus.admin@traceback.org` / `admin123`) — Full moderation and audit trail access.
- **Moderator**: `Sarah Chen` (`sarah.chen@traceback.org` / `mod123`) — Claim verification and custody management.
- **Student (Engineering)**: `David Miller` (`david.miller@campus.edu` / `user123`) — Lost item reporter and claimant.
- **Student (Design)**: `Emily Watson` (`emily.watson@campus.edu` / `user123`) — Found item claimant.

---

## 🔒 Security & Privacy Architecture

- **Ownership Clue Redaction**: API responses automatically strip `privateClues` unless the requester is the item's verified owner or an administrator/moderator.
- **No Plaintext Passwords**: Password hashing via salted SHA-256 / PBKDF2.
- **Audit Logging**: Sensitive claim reviews, status updates, and handover confirmations are written to an immutable audit log.
- **Client Key Isolation**: `GEMINI_API_KEY` is exclusively consumed server-side in `server/ai.ts` with telemetry headers; no keys are bundled into frontend assets.
