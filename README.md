# Vacation & Compressed Hours Planner

A modern, minimalist, and responsive web application designed for tracking compressed hours, flexible shift schedules, and pro-rata leave entitlements across UK Fiscal Years (6 April – 5 April).

---

## ✨ Key Features

1. **Exact Pro-Rata Entitlement Calculation**:
   - Uses your employer's exact calculation formula:
     $$\text{Vacation Hours} = \frac{\text{Full-Time Days } (F) \times \text{Weekly Hours } (W)}{5}$$
     - Example: $26\text{ days} \times 33\text{h} / 5 = \mathbf{171.6\text{ hours}}$ (or $\approx 20.8\text{ days}$ at $8.25\text{h/day}$).
   - Bank holiday entitlement calculated identically: $8\text{ days} \times 33\text{h} / 5 = \mathbf{52.8\text{ hours}}$.
   - Fully customizable for any weekly contract (e.g., 36h / 40h base $\rightarrow 187.2\text{ hours}$).

2. **Compressed Hours & Day-Off Customization**:
   - Easily configure standard working days (e.g. Monday–Thursday with Friday off, or Tuesday–Friday with Monday off).
   - Defaults shift duration automatically (e.g. $33\text{h} / 4\text{ days} = 8.25\text{h/day}$).

3. **Multi-Year Fiscal Calendar (April 6 – April 5)**:
   - Dynamic multi-year navigation ($2025/26$, $2026/27$, $2027/28$, etc.).
   - Clean 13-month calendar grid covering the full tax year.
   - Automatically highlights official **UK Public Bank Holidays** (England & Wales, Scotland, or Northern Ireland) via gov.uk with offline fallback support.

4. **Daily Status & Custom Hours Override**:
   - Click any day to mark as **Vacation**, **Bank Holiday**, **Working Day**, **Compressed Day Off**, or **Sickness**.
   - Custom hours per day: choose between full day ($8.25\text{h}$), half day ($4.125\text{h}$), or enter any custom hour value.
   - Optional description / notes per logged day.

5. **Allowance Overrides & Adjustments**:
   - Add carryover leave from prior years, bought leave, or manual day/hour credits and debits.

6. **Local Persistence & JSON Backup**:
   - Automatically saves all state in your browser's local storage.
   - Download local JSON backup files and restore anytime.

---

## 🚀 Getting Started

### 1. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 2. Run Tests / Validation
```bash
npm test
```

### 3. Build for Production / Standalone
```bash
npm run build
```
The output will be in `dist/`. You can host it or run `npm run preview`.
