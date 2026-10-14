import { db } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { funds, transfers, transactions } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import type { ServiceResult } from '@/types'
import { toCentavos, formatPHP } from '@/lib/utils/currency'
import { getFundBalance, invalidateFundsCache } from './funds'

/** Create a transfer between two funds atomically.
 *  Fee model: transfer_out.amount = amount + fee (source loses both).
 *             transfer_in.amount  = amount       (destination receives sent value).
 */
export async function createTransfer(input: {
  fromFundId: number
  toFundId: number
  amountRaw: string
  feeRaw?: string
  date: string
  note?: string
}): Promise<ServiceResult<{ transferId: number }>> {
  if (input.fromFundId === input.toFundId) {
    return { success: false, error: 'Source and destination must be different' }
  }

  const amount = toCentavos(input.amountRaw)
  if (amount <= 0) {
    return { success: false, error: 'Amount must be greater than zero' }
  }

  const fee = input.feeRaw ? toCentavos(input.feeRaw) : 0
  if (fee < 0) {
    return { success: false, error: 'Fee must be non-negative' }
  }

  const fromFund = await db.select().from(funds).where(eq(funds.id, input.fromFundId)).get()
  if (!fromFund) return { success: false, error: 'Source fund not found' }
  if (fromFund.archivedAt) return { success: false, error: 'Cannot transfer from an archived account' }

  const toFund = await db.select().from(funds).where(eq(funds.id, input.toFundId)).get()
  if (!toFund) return { success: false, error: 'Destination fund not found' }
  if (toFund.archivedAt) return { success: false, error: 'Cannot transfer to an archived account' }

  const balance = await getFundBalance(input.fromFundId)
  if (balance < amount + fee) {
    return {
      success: false,
      error: `Insufficient balance in ${fromFund.name}. Available: ${formatPHP(balance)}`,
    }
  }

  const now = new Date()

  const transferId = await db.transaction(async (tx) => {
    const [transfer] = await tx
      .insert(transfers)
      .values({
        fromFundId: input.fromFundId,
        toFundId: input.toFundId,
        amount,
        fee,
        date: input.date,
        note: input.note || null,
        createdAt: now,
      })
      .returning({ id: transfers.id })

    await tx.insert(transactions).values({
      fundId: input.fromFundId,
      type: 'transfer_out',
      amount: amount + fee,
      date: input.date,
      note: input.note || null,
      transferId: transfer.id,
      createdAt: now,
    })

    await tx.insert(transactions).values({
      fundId: input.toFundId,
      type: 'transfer_in',
      amount,
      date: input.date,
      note: input.note || null,
      transferId: transfer.id,
      createdAt: now,
    })

    return transfer.id
  })

  invalidateFundsCache()
  return { success: true, data: { transferId } }
}

/** Get a single transfer by ID */
export async function getTransferById(transferId: number) {
  const row = await db.select().from(transfers).where(eq(transfers.id, transferId)).get()
  return row ?? null
}

/** Soft-delete (archive) a transfer and its two linked transaction rows */
export async function deleteTransfer(transferId: number): Promise<ServiceResult<void>> {
  const transfer = await db.select().from(transfers).where(eq(transfers.id, transferId)).get()

  if (!transfer) {
    return { success: false, error: 'Transfer not found' }
  }

  const destBalance = await getFundBalance(transfer.toFundId)
  if (destBalance - transfer.amount < 0) {
    return {
      success: false,
      error: 'Cannot delete: destination fund would be overdrawn',
    }
  }

  const now = new Date()
  await db.transaction(async (tx) => {
    await tx.update(transfers).set({ archivedAt: now }).where(eq(transfers.id, transferId))
    await tx.update(transactions).set({ archivedAt: now }).where(eq(transactions.transferId, transferId))
  })

  invalidateFundsCache()
  return { success: true, data: undefined }
}

/** Restore a previously soft-deleted transfer and its linked transactions */
export async function restoreTransfer(transferId: number): Promise<ServiceResult<void>> {
  const transfer = await db.select().from(transfers).where(eq(transfers.id, transferId)).get()
  if (!transfer) return { success: false, error: 'Transfer not found' }

  const sourceBalance = await getFundBalance(transfer.fromFundId)
  if (sourceBalance < transfer.amount + (transfer.fee ?? 0)) {
    return { success: false, error: 'Cannot restore: source account balance is insufficient' }
  }

  await db.transaction(async (tx) => {
    await tx.update(transfers).set({ archivedAt: null }).where(eq(transfers.id, transferId))
    await tx.update(transactions).set({ archivedAt: null }).where(eq(transactions.transferId, transferId))
  })

  invalidateFundsCache()
  return { success: true, data: undefined }
}

/** Permanently delete a transfer and its linked transactions (irreversible) */
export async function deleteTransferForever(transferId: number): Promise<ServiceResult<void>> {
  const transfer = await db.select().from(transfers).where(eq(transfers.id, transferId)).get()
  if (!transfer) return { success: false, error: 'Transfer not found' }

  await db.delete(transfers).where(eq(transfers.id, transferId))
  invalidateFundsCache()
  return { success: true, data: undefined }
}

/** Update a transfer — amount, fee, accounts, date, and note can all be changed in-place. */
export async function updateTransfer(
  transferId: number,
  input: { fromFundId: number; toFundId: number; amountRaw: string; feeRaw?: string; date: string; note?: string }
): Promise<ServiceResult<void>> {
  const transfer = await db.select().from(transfers).where(eq(transfers.id, transferId)).get()
  if (!transfer) return { success: false, error: 'Transfer not found' }

  if (input.fromFundId === input.toFundId) {
    return { success: false, error: 'Source and destination must be different' }
  }

  const newFromFund = await db.select().from(funds).where(eq(funds.id, input.fromFundId)).get()
  if (!newFromFund) return { success: false, error: 'Source fund not found' }

  const newToFund = await db.select().from(funds).where(eq(funds.id, input.toFundId)).get()
  if (!newToFund) return { success: false, error: 'Destination fund not found' }

  const newAmount = toCentavos(input.amountRaw)
  if (newAmount <= 0) return { success: false, error: 'Amount must be greater than zero' }

  const newFee = input.feeRaw ? toCentavos(input.feeRaw) : 0
  if (newFee < 0) return { success: false, error: 'Fee must be non-negative' }

  const oldDebit = transfer.amount + (transfer.fee ?? 0)
  const newDebit = newAmount + newFee

  const fromChanged = input.fromFundId !== transfer.fromFundId
  const toChanged = input.toFundId !== transfer.toFundId

  // Source balance check
  if (fromChanged) {
    const newSourceBal = await getFundBalance(input.fromFundId)
    if (newSourceBal < newDebit) {
      return {
        success: false,
        error: `Insufficient balance in ${newFromFund.name}. Available: ${formatPHP(newSourceBal)}`,
      }
    }
  } else if (newDebit > oldDebit) {
    const sourceBal = await getFundBalance(transfer.fromFundId)
    if (sourceBal < newDebit - oldDebit) {
      return {
        success: false,
        error: `Insufficient balance in ${newFromFund.name}. Available: ${formatPHP(sourceBal)}`,
      }
    }
  }

  // Destination balance check
  if (toChanged) {
    const oldDestBal = await getFundBalance(transfer.toFundId)
    if (oldDestBal < transfer.amount) {
      const oldToFund = await db.select().from(funds).where(eq(funds.id, transfer.toFundId)).get()
      return {
        success: false,
        error: `Cannot change destination — ${oldToFund?.name ?? 'destination fund'} would be overdrawn`,
      }
    }
  } else if (newAmount < transfer.amount) {
    const destBal = await getFundBalance(transfer.toFundId)
    if (destBal < transfer.amount - newAmount) {
      return {
        success: false,
        error: `Cannot reduce amount — ${newToFund.name} would be overdrawn`,
      }
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(transfers)
      .set({ fromFundId: input.fromFundId, toFundId: input.toFundId, amount: newAmount, fee: newFee, date: input.date, note: input.note || null })
      .where(eq(transfers.id, transferId))

    await tx
      .update(transactions)
      .set({ fundId: input.fromFundId, amount: newDebit, date: input.date, note: input.note || null })
      .where(and(eq(transactions.transferId, transferId), eq(transactions.type, 'transfer_out')))

    await tx
      .update(transactions)
      .set({ fundId: input.toFundId, amount: newAmount, date: input.date, note: input.note || null })
      .where(and(eq(transactions.transferId, transferId), eq(transactions.type, 'transfer_in')))
  })

  invalidateFundsCache()
  return { success: true, data: undefined }
}
