# CLAUDE.md — Ava's Expense Tracker

Personal finance app for Ava. Single-user, no auth. Built with Next.js App Router,
TypeScript, Tailwind, shadcn/ui, SQLite, and Drizzle ORM.

---

## Architecture

Strictly layered. Never skip a layer.

```
UI Component → Server Action → Service → DB Layer → SQLite
```

- **UI components** (`src/components/`) — render data, handle user events, call server actions or hooks. Zero business logic. Zero DB queries.
- **Server actions** (`src/actions/`) — thin controllers. Validate input with Zod, call one service, return a result. No business logic of their own.
- **Services** (`src/services/`) — all business logic lives here. Pure functions. No HTTP, no UI concerns.
- **DB layer** (`src/lib/db/`) — schema, client singleton, raw Drizzle queries only. Never imported directly by UI or server actions; accessed only through services.

If you are unsure where code belongs, default to the service layer.

---

## File and Component Size

- Keep files under ~200 lines. If a file grows past that, split it.
- Keep components focused on a single responsibility.
- Prefer many small files over few large files.
- Never put two unrelated concerns in the same file.

---

## Financial Correctness

- All monetary values are stored and computed as **integers in centavos** (₱1,250.75 → `125075`).
- Never perform arithmetic on formatted strings.
- Never use JavaScript floating-point math for money. Always go centavos → arithmetic → centavos → display.
- `src/lib/utils/currency.ts` is the single source of truth for conversion and formatting.
- Display format: `₱1,250.00` — always two decimal places, always peso sign.

---

## Transfers are NOT income or expenses

A transfer between funds is a neutral movement of money.

- A transfer **must** create exactly two `transactions` rows: one `transfer_out` (debit), one `transfer_in` (credit).
- Both rows reference the same `transfers.id` via `transfer_id`.
- Transfers must **never** appear in expense totals, income totals, or category breakdowns.
- Transfers must **never** affect total net worth (money in = money out).
- Deleting a `transfers` record cascades to delete both linked `transactions` rows. Always use a SQLite transaction when creating or deleting transfers.
- Editing a transfer (amount, fee, date, note) is done in-place: update the `transfers` row and both linked `transactions` rows atomically. Check source balance for increased debits; check destination balance for reduced credits.

---

## Accounts / Funds vs Money Sources — CRITICAL DISTINCTION

These are two completely separate concepts. Never conflate them.

### Accounts / Funds = WHERE the money currently lives
- Examples: GCash, BPI, BDO, MariBank, Cash
- Have actual balances. Contribute to Total Balance.
- The `funds` table stores these.
- Fund cards on the dashboard show GCash ₱3,850 — NOT Allowance ₱3,850.

### Money Sources = WHERE the money originally came from
- Examples: Allowance, Regalo, Salary, Side hustle, Others
- Do NOT have balances. Never appear as account cards.
- Stored in the `sources` table.
- Only appear when recording incoming money (type = 'addition') on a transaction.
- A source label says "I received ₱4,000 from my allowance, which I deposited into GCash."

### Correct mental model
```
MONEY SOURCES          ACCOUNTS / FUNDS
(income origins)       (where money lives)
─────────────          ────────────────────
Allowance    ──────►   GCash
Regalo       ──────►   BPI
Salary       ──────►   BDO
Others       ──────►   MariBank / Cash
                       │
                       ▼
                    EXPENSES (deducted from an account)
```

### Rules
- NEVER give sources a balance.
- NEVER display sources as account cards.
- NEVER include sources in Total Balance calculation.
- Fund names must be wallet/bank account names (GCash, BPI, Cash), NOT income labels (Allowance, Regalo).

---

## Running Balances

- Fund balances are **always derived** from transaction history. There is no stored balance field.
- Balance formula: `SUM(CASE WHEN type IN ('addition','transfer_in') THEN amount ELSE -amount END)`
- Running balances in history use SQLite window functions over `(date ASC, created_at ASC)`.
- Never cache a balance in application state without making it clear it may be stale.

---

## Database Access

- Only `src/lib/db/client.ts` creates the Drizzle client. One singleton.
- Only service files import from `src/lib/db/`. Server actions and UI may not import db directly.
- All DB calls inside services are wrapped in explicit SQLite transactions when they modify more than one row.
- Schema changes must go through a Drizzle migration. Never mutate the DB schema by hand.

---

## Validation

- All user input is validated with Zod schemas in `src/lib/validations/` before reaching services.
- Server actions perform validation first; return a typed error object on failure rather than throwing.
- Client-side forms use React Hook Form + the same Zod schema (via `zodResolver`) for instant feedback.
- Do not duplicate validation logic — define it once in the validation file and import it in both places.

---

## No Duplication

- One component per concept. If you find yourself copying a component, extract it to `src/components/shared/`.
- One utility per concern. Do not write a second peso formatter.
- One source of truth for enums (`FUNDS`, `CATEGORIES`, `PAYMENT_METHODS` in `src/types/index.ts`).

---

## Mobile-First Responsive Design

- Write mobile styles first. Use `sm:`, `md:`, `lg:` breakpoints only to enhance desktop.
- Navigation: bottom bar on mobile, sidebar on desktop.
- Forms open in bottom sheets (`Sheet` from shadcn) on mobile, not new pages.
- Amount inputs use `inputMode="decimal"` for the numeric keyboard.
- Tap targets minimum 44px height.
- Test every feature at 390px wide (iPhone 14 viewport) before calling it done.

---

## Design Constraints

- No gradients. No neon colors. No decorative shadows.
- No excessive rounded corners (`rounded-xl` max; prefer `rounded-md`).
- No unnecessary card nesting. Flat layouts where possible.
- Whitespace is the primary visual separator — avoid decorative dividers.
- One accent color (`#4F7FFF`) used sparingly: active states, primary CTAs.
- Recharts only for a monthly spend bar chart if genuinely useful. No pie charts, no gauge charts, no sparklines.

---

## Error Handling

- Services return typed result objects (`{ success: true, data } | { success: false, error }`), not thrown exceptions for expected failures (e.g., insufficient funds, invalid transfer).
- Throw only for truly unexpected errors (DB connection failure, schema mismatch).
- Always show user-facing error messages via sonner toasts, never console.error alone.
- Prevent overdrawn funds: check balance before any debit operation in the service layer.

---

## What NOT to do

- Do not add User/auth tables — this is a single-person app.
- Do not use Supabase, Firebase, PostgreSQL, Prisma, or MongoDB.
- Do not use `any` TypeScript type without a comment explaining why.
- Do not put `async` DB calls directly inside React Server Components without a service wrapper.
- Do not store money as `float` or `decimal` — integers only.
- Do not add features not in the spec without discussion.
- Do not introduce new dependencies without a clear reason.

---

## Directory Reference

```
src/
  app/          Next.js pages and layouts (App Router)
  actions/      Server actions — input validation + service calls only
  services/     Business logic — funds, expenses, transfers, transactions
  lib/
    db/         Drizzle schema, client, migrations
    validations/ Zod schemas
    utils/      currency.ts, date.ts
  components/
    ui/         shadcn/ui primitives (do not modify)
    layout/     Navigation, page shell
    funds/      Fund-specific components
    expenses/   Expense form and related
    transfers/  Transfer form
    transactions/ Transaction list, row, filters
    shared/     Reusable across features
  hooks/        Client-side data hooks
  types/        Shared TypeScript types and enums
```
# Output Testing

Do not test the output using MCP or run the file without my command