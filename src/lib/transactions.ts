import { z } from "zod/v4";

const TRANSACTIONS_LOCAL_STORAGE_KEY = "transactions";

const TxState = z.union([
  z.object({
    type: z.literal("pending")
  }),
  z.object({
    type: z.literal("complete"),
    noteId: z.string(),
    expirationDate: z.string()
  })
]);
export type TxState = z.infer<typeof TxState>;

// tx-id -> TxState
const UserTransactions = z.record(z.string(), TxState);
export type UserTransactions = z.infer<typeof UserTransactions>;

// wallet-id -> UserTransactions
const TransactionList = z.record(z.string(), UserTransactions);
const TransactionListFromJsonString = z.preprocess((value: any, ctx) => JSON.parse(value), TransactionList);
export type TransactionList = z.infer<typeof TransactionList>;
export type TransactionListFromJsonString = z.infer<typeof TransactionListFromJsonString>;

export function loadTransactions(): TransactionList {
  try {
    const transactions = TransactionListFromJsonString.parse(localStorage.getItem(TRANSACTIONS_LOCAL_STORAGE_KEY));
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

export function setCompleted(walletId: string, txId: string, noteId: string, expirationDate: Date) {
  const transactions = loadTransactions();
  if (!(walletId in transactions)) {
    transactions[walletId] = {};
  }
  transactions[walletId][txId] = { type: "complete", noteId, expirationDate };
  localStorage.setItem(TRANSACTIONS_LOCAL_STORAGE_KEY, JSON.stringify(transactions));
}
