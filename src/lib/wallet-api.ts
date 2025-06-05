import { z } from "zod/v4";

export interface Currency {
  decimals: number;
  name: string;
  symbol: string;
}

const AddEthereumChainResponseSchema = z.array(z.string());
export type AddEthereumChainResponse = z.infer<typeof AddEthereumChainResponseSchema>;

async function addEthereumChain(provider: EIP1193Provider, { chainId, chainName, nativeCurrency, rpcUrls }: { chainId: string; chainName: string; nativeCurrency: Currency; rpcUrls: string[] }) {
  AddEthereumChainResponseSchema.parse(await provider.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId,
        chainName,
        nativeCurrency,
        rpcUrls,
      },
    ],
  }));
}

const SwitchEthereumChainResponseSchema = z.null();
export type SwitchEthereumChainResponse = z.infer<typeof SwitchEthereumChainResponseSchema>;

async function switchEthereumChain(provider: EIP1193Provider, chainId: string) {
  SwitchEthereumChainResponseSchema.parse(await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId }],
  }));
}

const RequestAccountsResponseSchema = z.array(z.string());
export type RequestAccountsResponse = z.infer<typeof RequestAccountsResponseSchema>;

async function requestAccounts(provider: EIP1193Provider): Promise<RequestAccountsResponse> {
  return RequestAccountsResponseSchema.parse(await provider.request({
    method: "eth_requestAccounts",
  }));
}

const GetTransactionReceiptResponseSchema = z.object({
  logs: z.array(z.object({
    topics: z.array(z.string()),
    data: z.string(),
  })),
});
export type GetTransactionReceiptResponse = z.infer<typeof GetTransactionReceiptResponseSchema>;

async function getTransactionReceipt(provider: EIP1193Provider, transactionId: string): Promise<GetTransactionReceiptResponse> {
  const response = await provider.request({
    method: "eth_getTransactionReceipt",
    params: [transactionId],
  });
  return GetTransactionReceiptResponseSchema.parse(response);
}

export const walletApi = {
  addEthereumChain,
  switchEthereumChain,
  requestAccounts,
  getTransactionReceipt,
};
