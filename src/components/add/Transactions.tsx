import { useState } from "react";
import { GolemBaseRo } from "@/lib/golem-base";
import { TxState, loadTransactions, setCompleted } from "@/lib/transactions";
import styles from "./Transactions.module.scss";
import { DATE_FORMAT_OPTIONS } from "@/lib/config";
import { metamask } from "@/lib/metamask";
interface Attrs {
  walletId: string;
  provider: EIP1193Provider | undefined;
}

export default function Transactions({ walletId, provider }: Attrs) {
  const [isOpen, setIsOpen] = useState(false);
  const transactionsArray = [];

  if (typeof window !== "undefined") {
    const transactions = loadTransactions();

    if (walletId in transactions) {
      const userTransactions = transactions[walletId];
      if (provider) {
        for (const txId in userTransactions) {
          if (userTransactions[txId].type === "pending") {
            const fut = async () => {
              const receipt = await metamask.getTransactionReceipt(provider, txId);
              const golemBase = await GolemBaseRo.newRo();
              const { noteId, expirationDate } = await golemBase.parseReceipt(receipt);
              console.debug("Resolved transaction", txId, "from wallet", walletId, "for note", noteId, "which expires at", expirationDate);
              await setCompleted(walletId, txId, noteId, expirationDate.toString());
            };

            fut();
          }
        }
      } else {
        console.debug("No provider set");
      }
    }

    for (const key in transactions[walletId]) {
      if (Object.hasOwn(transactions[walletId], key)) {
        transactionsArray.push({ txId: key, txState: transactions[walletId][key] });
      }
    }
  }
  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };
  return (
    <div className={styles.wrapper}>
      {transactionsArray.length > 0
        ? <>
          <h3 onClick={handleToggle} className={styles.transactions__title}>
            <span>User transactions</span>
            <svg
              className={`${styles.transactions__expand} ${isOpen ? styles.open : ""}`}
              height="30px"
              viewBox="0 0 512 512"
              width="30px"
              fill="#fff"
            >
              <polygon points="396.6,160 416,180.7 256,352 96,180.7 115.3,160 256,310.5" />
            </svg>
          </h3>
          {isOpen &&
            <div className={styles.transactions}>
              {transactionsArray.map((entry: { txId: string; txState: TxState }, key) => {
                const shortId = `${entry.txId.substring(0, 10)}..${entry.txId.substring(54)}`;
                if (entry.txState.type === "pending") {
                  return (
                    <div className={styles.transaction} key={key}>
                      <span>{shortId}</span> → pending
                    </div>
                  );
                }
                const expirationDateString = new Date(entry.txState.expirationDate).toLocaleDateString("en-US", DATE_FORMAT_OPTIONS);
                return (
                  <div className={styles.transaction} key={key}>
                    <span>{shortId} expires at {expirationDateString}</span>
                    {" "}→{" "}
                    <a className="button button--link" href={`/view?id=${entry.txState.noteId}`}>view</a>
                  </div>
                );
              })}
            </div>}
        </>
        : ""}
    </div>
  );
}
