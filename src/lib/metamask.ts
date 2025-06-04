import { Switch } from "@radix-ui/react-switch";
import { z } from "zod/v4";

export interface Currency {
    decimals: number,
    name: string,
    symbol: string
};

const AddEthereumChainResponse = z.array(z.string());
export type AddEthereumChainResponse = z.infer<typeof AddEthereumChainResponse>;

async function addEthereumChain(provider: EIP1193Provider, {chainId, chainName, nativeCurrency, rpcUrls }: { chainId: string, chainName: string, nativeCurrency: Currency, rpcUrls: string[] }) {
    AddEthereumChainResponse.parse(await provider.request({
        method: "wallet_addEthereumChain",
        params: [
            {
                chainId: chainId,
                chainName: chainName,
                nativeCurrency: nativeCurrency,
                rpcUrls: rpcUrls
            }
        ]
    }));
}

const SwitchEthereumChainResponse = z.null();
export type SwitchEthereumChainResponse = z.infer<typeof SwitchEthereumChainResponse>;

async function switchEthereumChain(provider: EIP1193Provider, chainId: string) {
    SwitchEthereumChainResponse.parse(await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainId }]
    }));
}

const RequestAccountsResponse = z.array(z.string());
export type RequestAccountsResponse = z.infer<typeof RequestAccountsResponse>;

async function requestAccounts(provider: EIP1193Provider): Promise<RequestAccountsResponse> {
    return RequestAccountsResponse.parse(await provider.request({
        method: "eth_requestAccounts"
    }));
}

const GetTransactionReceiptResponse = z.object({
  logs: z.array(
    z.object({
      topics: z.array(z.string()),
      data: z.string()
    })
  )
});
export type GetTransactionReceiptResponse = z.infer<typeof GetTransactionReceiptResponse>;

async function getTransactionReceipt(provider: EIP1193Provider, transactionId: string): Promise<GetTransactionReceiptResponse> {
    const response = await provider.request({
        method: "eth_getTransactionReceipt",
        params: [transactionId]
    });
    return GetTransactionReceiptResponse.parse(response);
}

export const metamask = {
    addEthereumChain: addEthereumChain,
    switchEthereumChain: switchEthereumChain,
    requestAccounts: requestAccounts,
    getTransactionReceipt: getTransactionReceipt
};