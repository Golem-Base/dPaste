import { GolemBaseCreate } from "golem-base-sdk";
import { Annotation } from "./annotation";
import { decrypt, encrypt } from "./crypto";
import { GolemBaseRo } from "./golem-base";
import { LANGUAGES } from "./language";

type Payload =
  | { type: "plaintext"; text: string }
  | { type: "encrypted"; data: Uint8Array };

export class Note {
  payload: Payload;
  metadata: Annotation;

  private constructor({ payload, metadata }: { payload: Payload; metadata: Annotation }) {
    this.payload = payload;
    this.metadata = metadata;
  }

  getPlaintextPayload(): string | null {
    if (this.payload.type === "plaintext") {
      return this.payload.text;
    }
    return null;
  }

  async decrypt(password: string) {
    if (this.payload.type !== "encrypted") {
      throw Error("Decryption error. Note is not encrypted.");
    }

    const decrypted = new TextDecoder().decode(await decrypt(this.payload.data, password));
    this.metadata.encrypted = false;
    this.payload = {
      type: "plaintext",
      text: decrypted,
    };
  }

  isEncrypted(): boolean {
    return this.payload.type === "encrypted";
  }

  static async fetch(entity: string): Promise<Note> {
    const golemBase = await GolemBaseRo.newRo();
    const metaData = await golemBase.getEntityMetaData(entity);
    const annotation = Annotation.fromRaw(metaData);
    if (annotation.result === "invalid") {
      throw annotation.error;
    }

    if (!LANGUAGES.includes(annotation.annotation.language)) {
      annotation.annotation.language = "plaintext";
    }

    const data = await golemBase.getStorageValue(entity);
    let payload: Payload;
    if (annotation.annotation.encrypted === true) {
      payload = { type: "encrypted", data };
    } else {
      payload = { type: "plaintext", text: new TextDecoder().decode(data) };
    }
    return new Note({ payload, metadata: annotation.annotation });
  }

  static async create({
    note,
    ttl,
    language,
    password,
  }: {
    note: string;
    ttl: number;
    language: string;
    password: string | null;
  }): Promise<Note> {
    let payload: Payload;
    const encrypted = password != null;
    if (encrypted) {
      const encryptedData = await encrypt(note, password);
      payload = { type: "encrypted", data: encryptedData };
    } else {
      payload = { type: "plaintext", text: note };
    }
    return new Note({
      payload,
      metadata: Annotation.create({ language, ttl, encrypted }),
    });
  }

  intoGolemBaseCreate(): GolemBaseCreate {
    if (this.metadata.ttl == null) {
      throw Error("TTL is null");
    }
    let data;
    if (this.payload.type === "encrypted") {
      data = this.payload.data;
    } else {
      data = new TextEncoder().encode(this.payload.text);
    }

    return {
      data,
      btl: this.metadata.ttl,
      stringAnnotations: this.metadata.stringAnnotations(),
      numericAnnotations: this.metadata.numericAnnotations(),
    };
  }
}
