import { BLOCK_INTERVAL, CHAIN_ID, RPC_ENDPOINT_URL, RPC_ENDPOINT_URL_WS } from "./config";
import { createClient, EntityMetaData, GolemBaseClient, Hex } from "golem-base-sdk";
import Browser from "hex-encoding";
import { Note } from "./note";
import { z } from "zod/v4";
import { GetTransactionReceiptResponse } from "@/lib/metamask";

const DUMMY_PRIVATE_KEY = Browser.decode("08320436da8db8a206e77a918387b8f46afbad57993a5a4bf5bf3ac85bcad74b");
const GetCurrentBlockNumberResponse = z.object({
  number: z.string()
});
type GetCurrentBlockNumberResponse = z.infer<typeof GetCurrentBlockNumberResponse>;

export interface NewNoteData {
  noteId: string;
  expirationDate: Date;
}

export class GolemBaseRo {
  client: GolemBaseClient;

  static newRo = async () => {
    const client = await createClient(
      Number(CHAIN_ID),
      {
        tag: "privatekey",
        data: DUMMY_PRIVATE_KEY,
      },
      RPC_ENDPOINT_URL,
      RPC_ENDPOINT_URL_WS,
    );

    return new GolemBaseRo(client);
  };

  constructor(client: GolemBaseClient) {
    this.client = client;
  }

  async getEntityMetaData(entity: string): Promise<EntityMetaData> {
    return await this.client.getEntityMetaData(entity as Hex);
  }

  async getStorageValue(entity: string): Promise<Uint8Array> {
    return await this.client.getStorageValue(entity as Hex);
  }

  async getCurrentBlockNumber(): Promise<number> {
    const res = GetCurrentBlockNumberResponse.parse(await this.client
      .getRawClient()
      .httpClient
      .request({
        method: "eth_getBlockByNumber",
        params: ["latest", false],
      }));
    return Number(res.number);
  }

  async estimateBlockDate(block: number): Promise<Date> {
    const current = await this.getCurrentBlockNumber();
    const newLocal = (block - current) * BLOCK_INTERVAL;
    const ttlSecs = newLocal;
    return new Date(Date.now() + (ttlSecs * 1000));
  }

  async parseReceipt(receipt: GetTransactionReceiptResponse): Promise<NewNoteData> {
    const noteId = receipt.logs[0].topics[1];
    const expirationBlock = Number(receipt.logs[0].data);
    const expirationDate = await this.estimateBlockDate(expirationBlock);
    return { noteId, expirationDate };
  }
}

export class GolemBaseRw extends GolemBaseRo {
  static newRw = async (prov: EIP1193Provider) => {
    const client = await createClient(
      Number(CHAIN_ID),
      {
        tag: "ethereumprovider",
        data: prov,
      },
      RPC_ENDPOINT_URL,
      RPC_ENDPOINT_URL_WS,
    );

    return new GolemBaseRw(client);
  };

  async createNote(note: Note, args?: { txHashCallback: (txHash: Hex) => void }): Promise<string> {
    const receipts = await this.client.createEntities([note.intoGolemBaseCreate()], {
      txHashCallback: args?.txHashCallback,
    });
    return receipts[0].entityKey;
  }
}
