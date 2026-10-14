# Implementation Plan: Account Deletion, Centralized Archive, and Mobile Responsiveness

## Objective
Update account deletion to allow closing accounts with existing transactions by soft-deleting them into an Archive. Preserve all historical transactions and running balances. Implement a centralized Archive with 30-day automatic expiration, restore actions, and permanent deletion with confirmation. Update navigation so Archive is visible in the desktop sidebar and within Settings on mobile.

## User Review & Decision
- **30-Day Permanent Deletion Architecture**: Lazy cleanup routine executed reliably in backend database queries upon Archive access and archival mutations, removing expired items (>30 days old) without requiring external infrastructure.

---

## Phase 1: Database Schema & Migration
1. **Schema Updates (`src/lib/db/schema.ts`)**:
   - Add `archivedAt: integer('archived_at', { mode: 'timestamp' })` to tables:
     - `funds`
     - `transactions`
     - `transfers`
     - `categories`
     - `sources`
     - `savingsGoals`
     - `goalContributions`
     - `utang`
     - `utangPayments`
2. **Idempotent DB Init (`src/lib/db/init.ts`)**:
   - In `ensureInitialized()`, add idempotent `ALTER TABLE ... ADD COLUMN archived_at integer` checks for each table so existing SQLite/LibSQL databases update automatically without crashing.
3. **Drizzle Migration**:
   - Create `src/lib/db/migrations/0004_add_archived_at.sql` and update migration metadata for consistency.
4. **TypeScript Definitions (`src/types/index.ts`)**:
   - Add `archivedAt?: Date | null` to entity types (`Fund`, `Transaction`, `Category`, `IncomeSource`, `SavingsGoal`, `Utang`).
   - Define `ArchiveItemType` and `ArchiveItem`:
     ```ts
     export type ArchiveItemType = 'account' | 'transaction' | 'savings_goal' | 'category' | 'source' | 'utang'
     export type ArchiveItem = {
       id: number
       type: ArchiveItemType
       title: string
       subtitle?: string | null
       amount?: number | null
       archivedAt: Date
       daysRemaining: number
       expiresAt: Date
       metadata?: Record<string, unknown>
     }
     ```

---

## Phase 2: Service Layer & Soft Deletion
1. **Funds Service (`src/services/funds.ts`)**:
   - Update `getFundsWithBalances()` and `getAllFunds()` to filter `isNull(funds.archivedAt)` for active account queries.
   - Update `deleteFund(fundId)`: **Remove the restriction that blocks deletion if transactions exist**. Instead, set `funds.archivedAt = new Date()`. Preserve all transactions and transfers intact.
   - Add `restoreFund(fundId)`: Sets `funds.archivedAt = null`.
   - Add `deleteFundForever(fundId)`: Permanently deletes the fund along with associated records in a transaction block to maintain referential integrity.
   - Add `getFundByIdIncludingArchived(fundId)`: Allows retrieving fund details even when archived.
   - Prevent `addMoneyToFund` if the fund is archived.
2. **Transactions & Expenses Services (`src/services/transactions.ts`, `src/services/expenses.ts`)**:
   - Update `getTransactions()` to filter `isNull(transactions.archivedAt)`.
   - Update `deleteExpense()` and `deleteAddition()`: Soft-delete by setting `transactions.archivedAt = new Date()`.
   - Add `restoreTransaction(id)` and `deleteTransactionForever(id)`.
3. **Savings Goals Service (`src/services/savings-goals.ts`)**:
   - Update active queries to filter `isNull(savingsGoals.archivedAt)`.
   - Update `deleteSavingsGoal()` to soft-delete (`savingsGoals.archivedAt = new Date()`).
   - Add `restoreSavingsGoal(id)` and `deleteSavingsGoalForever(id)`.
4. **Categories & Sources Services (`src/services/categories.ts`, `src/services/sources.ts`)**:
   - Update `deleteCategory()` and `deleteSource()` to soft-delete.
   - Add restore and permanent delete functions.
5. **Utang Service (`src/services/utang.ts`)**:
   - Update `deleteUtang()` to soft-delete.
   - Add restore and permanent delete functions.

---

## Phase 3: Centralized Archive Service & Auto-Deletion
1. **Central Archive Service (`src/services/archive.ts`)**:
   - `purgeExpiredArchiveItems()`: Reliable backend query that finds all records across tables where `archivedAt <= 30 days ago` and permanently deletes them in safe order (cascading goal contributions, utang payments, transfers, and transactions).
   - `getArchivedItems()`: Runs `purgeExpiredArchiveItems()`, queries all soft-deleted records across all 6 entity types, computes `daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / 86400000))`, and returns sorted by newest `archivedAt`.
   - `restoreArchiveItem(type, id)`: Dispatches to the corresponding `restore*` service, clearing `archivedAt`.
   - `deleteArchiveItemForever(type, id)`: Dispatches to the corresponding `delete*Forever` service.
2. **Server Actions (`src/actions/archive.ts`)**:
   - Expose `getArchivedItemsAction`, `restoreArchivedItemAction`, `deleteArchivedItemForeverAction`.
   - Trigger Next.js cache revalidation for `/archive`, `/funds`, `/transactions`, `/savings`, `/settings`.

---

## Phase 4: Desktop & Mobile Navigation & Archive UI
1. **Desktop Sidebar (`src/components/layout/sidebar.tsx`)**:
   - Add dedicated "Archive" navigation item with `Archive` icon right above Settings.
2. **Mobile Bottom Navigation (`src/components/layout/bottom-nav.tsx`)**:
   - Keep bottom navigation bar clean (do NOT add Archive to bottom nav).
3. **Settings Page (`src/app/(main)/settings/page.tsx`)**:
   - Add an "Archive" section/card with navigation link pointing to Archive.
4. **Archive Route & Pages**:
   - `src/app/(main)/archive/page.tsx`: Primary archive page.
   - `src/app/(main)/settings/archive/page.tsx`: Dedicated sub-route linking directly to the Archive UI on mobile.
5. **Archive Client View (`src/components/archive/archive-view.tsx`)**:
   - Responsive layout adapting cleanly to mobile screens (no horizontal scroll).
   - Category filter tabs: All, Accounts, Transactions, Savings Goals, Categories, Income Sources, Utang (with item count badges).
   - Item display with title, category/type, deletion date, formatted remaining days pill (e.g. "25 days left").
   - "Restore" button with active loading state.
   - "Delete forever" button with confirmation prompt via `ConfirmDialog`.
   - Empty state when no items are archived.
6. **Account UI Adjustments**:
   - Update `src/components/funds/fund-context-menu.tsx` modal description: explain that the account is archived for 30 days and can be restored.
   - Update `src/app/(main)/funds/[id]/page.tsx` with an archived banner if the account is archived, offering a quick "Restore" button and hiding "Add Money".

---

## Phase 5: Verification & Testing
1. **Automated Verification Script (`scripts/test-archive.mjs`)**:
   - Test closing an account that has active transactions.
   - Verify account is removed from active lists (`getFundsWithBalances`) while transactions and balances are preserved.
   - Verify account appears in the Archive with 30-day countdown.
   - Test restoring the account: verify it reappears in active lists.
   - Test 30-day expiration logic: mock `archivedAt` to 31 days ago, verify `purgeExpiredArchiveItems()` permanently cleans up records and foreign keys without errors.
   - Test restoring items cancels pending permanent deletion.
   - Test permanent deletion via "Delete forever".
2. **Type Checking & Build Validation**:
   - Run `pnpm lint` and `pnpm build` to confirm zero TypeScript and ESLint errors.
3. **Responsiveness Verification**:
   - Test layout and confirmation dialogs on mobile viewport (< 400px) and desktop.
