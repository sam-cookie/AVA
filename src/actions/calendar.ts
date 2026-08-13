'use server'

import { getTransactions } from '@/services/transactions'
import type { TransactionWithFund } from '@/types'

export async function getDayTransactionsAction(date: string): Promise<TransactionWithFund[]> {
  return getTransactions({ dateFrom: date, dateTo: date }, 100, 0)
}
