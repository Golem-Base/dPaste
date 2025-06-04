import { z } from "zod/v4";

const TRANSACTIONS_LOCAL_STORAGE_KEY = "transactions";

const TxStateSchema = z.union([
  z.object({
    type: z.literal("pending"),
  }),
  z.object({
    type: z.literal("complete"),
    noteId: z.string(),
    expirationDate: z.string(),
  }),
]);
export type TxState = z.infer<typeof TxStateSchema>;

// tx-id -> TxState
const UserTransactionsSchema = z.record(z.string(), TxStateSchema);
export type UserTransactions = z.infer<typeof UserTransactionsSchema>;

// wallet-id -> UserTransactions
const TransactionListSchema = z.record(z.string(), UserTransactionsSchema);
const TransactionListFromJsonStringSchema = z.preprocess((value: any, _ctx) => JSON.parse(value), TransactionListSchema);
export type TransactionList = z.infer<typeof TransactionListSchema>;
export type TransactionListFromJsonString = z.infer<typeof TransactionListFromJsonStringSchema>;

export function loadTransactions(): TransactionList {
  try {
    const transactions = TransactionListFromJsonStringSchema.parse(localStorage.getItem(TRANSACTIONS_LOCAL_STORAGE_KEY));
    return transactions;
  } catch (e) {
    console.error(e);
    return {};
  }
}

export function setPending(walletId: string, txId: string) {
  const transactions = loadTransactions();
  if (!(walletId in transactions)) {
    transactions[walletId] = {};
  }
  transactions[walletId][txId] = { type: "pending" };
  localStorage.setItem(TRANSACTIONS_LOCAL_STORAGE_KEY, JSON.stringify(transactions));
}

export function setCompleted(walletId: string, txId: string, noteId: string, expirationDate: string) {
  const transactions = loadTransactions();
  if (!(walletId in transactions)) {
    transactions[walletId] = {};
  }
  transactions[walletId][txId] = { type: "complete", noteId, expirationDate };
  localStorage.setItem(TRANSACTIONS_LOCAL_STORAGE_KEY, JSON.stringify(transactions));
}
