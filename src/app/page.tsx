"use client";

import { ConfirmDialogProvider } from '@omit/react-confirm-dialog'

import { useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import Form from "@/components/add/Form";
import Transactions from "@/components/add/Transactions";
import Wallet from "@/components/add/Wallet";
import layout from "@/styles/Layout.module.scss";

export default function Add() {
  const [error, setError] = useState("");
  const [user, setUser] = useState("");
  const [wallet, setWallet] = useState<EIP6963ProviderDetail>();

  return (
    <ConfirmDialogProvider>
      <ErrorMessage error={error} setError={setError} />
      <div className={layout.wrapper}>

        <Wallet
          setError={setError}
          userAccount={user} setUserAccount={setUser}
          selectedWallet={wallet} setSelectedWallet={setWallet}
        />
        <Form setError={setError} selectedWallet={wallet} userAccount={user} />
      </div>
      <Transactions walletId={user} provider={wallet?.provider} />
    </ConfirmDialogProvider>
  );
}
