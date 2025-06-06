import { useEffect } from "react";
import { FAUCET_URL, RPC_ENDPOINT_URL, CURRENCY_SYMBOL, CURRENCY_NAME, CHAIN_NAME, CHAIN_ID } from "@/lib/config";
import { useSyncProviders } from "@/lib/useSyncProviders";
import styles from "./Wallet.module.scss";
import layout from "@/styles/Layout.module.scss";
import Image from "next/image";
import Disclaimer from "@/components/Disclaimer";
import { walletApi } from "@/lib/wallet-api";

interface Attrs {
  setError: (error: string) => void;
  selectedWallet: EIP6963ProviderDetail | undefined;
  setSelectedWallet: (wallet: EIP6963ProviderDetail | undefined) => void;
  userAccount: string;
  setUserAccount: (user: string) => void;
}

// Detect immaterial metamask error
//
// See https://github.com/MetaMask/metamask-sdk/issues/1272
function isFauxError(e: MMError): boolean {
  if (!e.message) {
    return false;
  }
  return e.message.includes("is not a function");
}

// Add and switch to the GolemBase chain
//
// Debug-logs results. Doesn't propagate faux errors.
async function ensureGolemBaseChain(provider: EIP1193Provider) {
  try {
    await walletApi.addEthereumChain(provider, {
      chainId: CHAIN_ID,
      chainName: CHAIN_NAME,
      nativeCurrency: {
        decimals: 18,
        name: CURRENCY_NAME,
        symbol: CURRENCY_SYMBOL,
      },
      rpcUrls: [RPC_ENDPOINT_URL],
    });

    await walletApi.switchEthereumChain(provider, CHAIN_ID);
  } catch (error) {
    const mmError: MMError = error as MMError;
    if (!isFauxError(mmError)) {
      throw error;
    }
  }
}

export default function Wallet({ setError, selectedWallet, setSelectedWallet, userAccount, setUserAccount }: Attrs) {
  const providers = useSyncProviders();

  useEffect(() => {
    providers?.map(async (providerWithInfo: EIP6963ProviderDetail) => {
      const account = localStorage.getItem("web3-account");
      if (account) {
        const accountParsed = JSON.parse(account);
        const wallet = accountParsed.wallet;
        const providerName = accountParsed.provider;

        if (providerWithInfo.info.name !== providerName) {
          return;
        }

        try {
          setUserAccount(wallet);
          setSelectedWallet(providerWithInfo);

          await ensureGolemBaseChain(providerWithInfo.provider);
        } catch (error) {
          const mmError: MMError = error as MMError;
          console.error("Wallet error", error);
          setError(`Code: ${mmError.code} \nError Message: ${mmError.message}`);
        }
      }
    });
  }, [providers, setError, setSelectedWallet, setUserAccount]);

  // Display a readable user address.
  const formatAddress = (addr: string) => {
    const upperAfterLastTwo = addr.slice(0, 2) + addr.slice(2);
    return `${upperAfterLastTwo.substring(0, 5)}...${upperAfterLastTwo.substring(39)}`;
  };

  const handleDisconnect = () => {
    setSelectedWallet(undefined);
    setUserAccount("");
    localStorage.removeItem("web3-account");
  };

  const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
    try {
      const accounts = await walletApi.requestAccounts(providerWithInfo.provider);
      const account = accounts?.[0];

      setUserAccount(account);
      setSelectedWallet(providerWithInfo);

      const serializedAccount = JSON.stringify({
        wallet: accounts?.[0],
        provider: providerWithInfo.info.name,
      });
      localStorage.setItem("web3-account", serializedAccount);

      await ensureGolemBaseChain(providerWithInfo.provider);
    } catch (error) {
      const mmError: MMError = error as MMError;
      console.error(error);
      setError(`Code: ${mmError.code} \nError Message: ${mmError.message}`);
      await handleDisconnect();
    }
  };

  const walletSelected = selectedWallet != null;
  return (
    <div className={layout.sidebar}>
      <Disclaimer />
      {userAccount
        ? ""
        : <div className={styles.wallets}>
          <h2 className={styles.wallets__title}>Wallets available to use</h2>

          <div className={styles.wallets__list}>
            {providers.length > 0
              ? providers?.map((provider: EIP6963ProviderDetail) => (
                <button className={styles.wallets__item} key={provider.info.uuid} onClick={() => handleConnect(provider)}>
                  <Image width="35" height="33" src={provider.info.icon} alt={provider.info.name} />
                  <div>{provider.info.name}</div>
                </button>
              ))
              : <div className={styles.wallets__none}>
                dPaste requires <a href="https://metamask.io/download">MetaMask</a>
              </div>}
          </div>
          {(walletSelected || providers.length === 0)
            ? ""
            : (
              <div className={styles.wallets__info}>Select a wallet to continue.</div>
            )}
        </div>}
      {userAccount &&
        <div className={styles.wallets}>
          <h2 className={styles.wallets__title}>{userAccount ? "" : "No"} Selected wallet</h2>
          <div className={`${styles.wallets__item} ${styles.wallets__item_selected}`}>
            <div className={styles.wallets__item_data}>
              <Image width="35" height="33" src={selectedWallet?.info.icon ?? ""} alt={selectedWallet?.info.name ?? ""} />
              <h4>{selectedWallet?.info.name}</h4>
              <p>({formatAddress(userAccount)})</p>
              <button className="button button--secondary" onClick={() => handleDisconnect()}><svg height="1792" viewBox="0 0 1792 1792" width="1792" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M503 1271l-256 256q-10 9-23 9-12 0-23-9-9-10-9-23t9-23l256-256q10-9 23-9t23 9q9 10 9 23t-9 23zm169 41v320q0 14-9 23t-23 9-23-9-9-23v-320q0-14 9-23t23-9 23 9 9 23zm-224-224q0 14-9 23t-23 9h-320q-14 0-23-9t-9-23 9-23 23-9h320q14 0 23 9t9 23zm1264 128q0 120-85 203l-147 146q-83 83-203 83-121 0-204-85l-334-335q-21-21-42-56l239-18 273 274q27 27 68 27.5t68-26.5l147-146q28-28 28-67 0-40-28-68l-274-275 18-239q35 21 56 42l336 336q84 86 84 204zm-617-724l-239 18-273-274q-28-28-68-28-39 0-68 27l-147 146q-28 28-28 67 0 40 28 68l274 274-18 240q-35-21-56-42l-336-336q-84-86-84-204 0-120 85-203l147-146q83-83 203-83 121 0 204 85l334 335q21 21 42 56zm633 84q0 14-9 23t-23 9h-320q-14 0-23-9t-9-23 9-23 23-9h320q14 0 23 9t9 23zm-544-544v320q0 14-9 23t-23 9-23-9-9-23v-320q0-14 9-23t23-9 23 9 9 23zm407 151l-256 256q-11 9-23 9t-23-9q-9-10-9-23t9-23l256-256q10-9 23-9t23 9q9 10 9 23t-9 23z" /></svg></button>
            </div>
          </div>
        </div>}
      {userAccount &&
        <div className={styles.faucet}>
          <h2 className={styles.faucet__title}>Need funds?</h2>
          <div className={styles.faucet__item}>Check out the <a className={styles.faucet__link} href={FAUCET_URL}>Golem Base faucet<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g><path d="M0 0h24v24H0z" fill="none" /><path fill="#fff" d="M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6zm11-3v8h-2V6.413l-7.793 7.794-1.414-1.414L17.585 5H13V3h8z" /></g></svg></a> to get funds</div>
        </div>}
    </div>
  );
}
