export type TxState =
  | { type: "pending" }
  | { type: "complete"; noteId: string; expirationDate: Date };

// tx-id -> TxState
export type UserTransactions = Record<string, TxState>;

// wallet-id -> UserTransactions
export type TransactionList = Record<string, UserTransactions>;


export function loadTransactions(): TransactionList {
  const transactionsStr = localStorage.getItem("transactions");
  if (transactionsStr) {
    const transactions = JSON.parse(transactionsStr) as TransactionList;
    console.debug(transactions);
    return transactions;
  }
  return {};
}

export function setPending(walletId: string, txId: string) {
  const transactions = loadTransactions();
  if (!(walletId in transactions)) {
    transactions[walletId] = {};
  }
  transactions[walletId][txId] = { type: "pending" };
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

export function setCompleted(walletId: string, txId: string, noteId: string, expirationDate: Date) {
  const transactions = loadTransactions();
  if (!(walletId in transactions)) {
    transactions[walletId] = {};
  }
  transactions[walletId][txId] = { type: "complete", noteId, expirationDate };
  localStorage.setItem("transactions", JSON.stringify(transactions));
}
