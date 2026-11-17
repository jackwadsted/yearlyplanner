# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands
- `npm test` = `npx tsx test-validation.ts` — a single hand-rolled script in the repo root (no Jest/Vitest, no lint script, no ESLint/Prettier). It throws on the first failed check, so there is no per-test selection; to "run one test", comment out the others in `runValidationTests()`.
- `npm run build` runs `tsc` first (strict + `noUnusedLocals`/`noUnusedParameters`), so unused imports/params fail the build. `tsc` only covers `src/`, not `test-validation.ts`.
- `test-validation.ts` imports with explicit `.ts` extensions (`./src/utils/calculator.ts`), whereas `src/` code uses extensionless imports (`allowImportingTsExtensions` is false). Keep that split.

## Domain rules (easy to get wrong)
- Fiscal year is the UK tax year, 6 April – 5 April. Key format is `"2026/27"` via `getFiscalYearKey()` in `src/utils/calculator.ts`; `selectedYear` is the start year number. Dates are `'YYYY-MM-DD'` strings compared lexicographically (see `isDateInFiscalYear`). The code avoids `new Date('YYYY-MM-DD')` (UTC shift); build dates via `formatISODate(y, monthIdx0, d)` / `new Date(y, m, d)`.
- Entitlements are stored in **hours**, not days: `fullTimeDays * weeklyHours / 5`. Day equivalents are derived by dividing by `config.dailyDefaultHours`.
- All hour values are rounded with `Math.round(x * 100) / 100` (days equivalents `* 10 / 10`). Tests use strict `!==` on these floats, so keep rounding at every step in `calculateAllowanceSummary`.
- Only `vacation`, `bank_holiday`, `working`, `sickness` records are summed in the summary; `non_working`/`custom` are ignored.
- `workingDays` uses JS `getDay()` numbering (0 = Sunday), but calendars render Monday-first (`mondayOffset` in `dateUtils.ts`).
- Weeks/months: `getFiscalYearMonths` returns 13 months (Apr → next Apr) with padding days; use `isInFiscalYear` to dim out-of-range days.

## State & persistence
- All state is one `AppState` in `App.tsx` (`useState`, immutable updates via `setAppState(prev => ...)`); there is no router/store lib. A year entry in `years[fyKey]` must be created lazily (pattern repeated in `App.tsx`) before writing to it.
- Persisted to `localStorage` key `vacation_planner_v1` on every change (`src/services/storage.ts`). Loaded config is merged over `DEFAULT_CONFIG`, so new `UserConfig` fields need a default there to stay backward compatible with saved data and imported JSON backups.
- `fetchBankHolidays` (`src/services/bankHolidays.ts`) hits gov.uk and silently falls back to the hard-coded `FALLBACK_BANK_HOLIDAYS` (2024–2028; Scotland/NI only 2025–26). Never throws.

## Theming (non-standard Tailwind)
- `brand-*`, `accent-*`, `slate-*` (and amber/rose/blue/violet/emerald/orange), `surface`, `strong*` are CSS-variable-backed colours generated in `tailwind.config.js`; theme switches via `document.documentElement.dataset.theme`. Dark theme (`black`) remaps shades, so use these semantic classes rather than hard-coded hex/other Tailwind palettes (e.g. `teal-*`) in components.
- Adding a theme requires editing **three** places: `ThemeId` in `src/types/index.ts`, `THEMES` in `tailwind.config.js` (real palette), and `THEMES` in `src/themes.ts` (picker swatches only).
- Add class `theme-fixed` to elements that must stay light-palette in dark themes (see dashboard banner in `AllowanceDashboard.tsx`).

## Code style (observed)
- Single quotes, semicolons, 2-space indent, trailing commas in multiline literals. Function components exported by name from `src/components/<area>/<Name>.tsx` (only `App` is a default export). Types imported from `'../types'` (barrel `index.ts`). Icons from `lucide-react`; `clsx`/`tailwind-merge` are installed but styling is mostly inline template strings of Tailwind classes.
- Services/utils log with `console.error` and fall back to defaults rather than throwing (import validation in `importStateFromFile` is the exception — it throws, callers handle it).
