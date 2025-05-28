import { EntityMetaData, NumericAnnotation, StringAnnotation } from "golem-base-sdk";
import {
  APP_ID, KEY_APP_ID, KEY_PASTE_CREATED_AT, KEY_PASTE_ENCRYPTED,
  KEY_PASTE_LANGUAGE, KEY_PASTE_VERSION, PASTE_VERSION,
} from "./config";
import { KVPair } from "./util";

export enum ValidationError {
  InvalidVersion,
}

export type ValidationResult =
  | { result: "valid"; annotation: Annotation }
  | { result: "invalid"; error: ValidationError };

export class Annotation {
  "app-id": string;
  "created-at": number;
  "language": string;
  "version": string;
  "ttl"?: number;
  "expiresAtBlock"?: number;
  "encrypted": boolean;

  private constructor({
    "app-id": appId,
    "created-at": createdAt,
    language,
    version,
    ttl,
    expiresAtBlock,
    encrypted,
  }: {
    "app-id": string;
    "created-at": number;
    "language": string;
    "version": string;
    "ttl"?: number;
    "expiresAtBlock"?: number;
    "encrypted": boolean;
  }) {
    this["app-id"] = appId;
    this["created-at"] = createdAt;
    this["language"] = language;
    this["version"] = version;
    if (ttl != null) {
      this["ttl"] = ttl;
    }
    if (expiresAtBlock != null) {
      this["expiresAtBlock"] = expiresAtBlock;
    }
    this["encrypted"] = encrypted;
  }

  static create({
    language,
    ttl,
    encrypted,
  }: {
    language: string;
    ttl: number;
    encrypted: boolean;
  }): Annotation {
    return new Annotation({
      "app-id": APP_ID,
      "created-at": Math.floor(new Date().getTime() / 1000),
      language,
      "version": "1.0.0",
      ttl,
      encrypted,
    });
  }

  private validate(): ValidationError | null {
    if (this["version"] !== PASTE_VERSION) {
      console.error(`Invalid note version. Expected 1.0.0, got ${this["version"]}`);
      return ValidationError.InvalidVersion;
    }
    return null;
  }

  static fromRaw(metadata: EntityMetaData): ValidationResult {
    const stringAnnotations = intoRecord<string>(metadata.stringAnnotations);
    const numericAnnotations = intoRecord<number>(metadata.numericAnnotations);
    const annotation = new Annotation({
      "app-id": stringAnnotations[KEY_APP_ID],
      "created-at": numericAnnotations[KEY_PASTE_CREATED_AT],
      "language": stringAnnotations[KEY_PASTE_LANGUAGE],
      "version": stringAnnotations[KEY_PASTE_VERSION],
      "expiresAtBlock": Number(metadata.expiresAtBlock),
      "encrypted": stringAnnotations[KEY_PASTE_ENCRYPTED] === "true",
    });
    const validationResult = annotation.validate();

    if (validationResult == null) {
      return { result: "valid", annotation };
    }
    return { result: "invalid", error: validationResult };
  }

  stringAnnotations(): StringAnnotation[] {
    return [
      { key: KEY_PASTE_VERSION, value: "1.0.0" },
      { key: KEY_PASTE_LANGUAGE, value: this.language },
      { key: KEY_APP_ID, value: APP_ID },
      { key: KEY_PASTE_ENCRYPTED, value: String(this["encrypted"]) },
    ];
  }

  numericAnnotations(): NumericAnnotation[] {
    return [{ key: KEY_PASTE_CREATED_AT, value: this["created-at"] }];
  }
}

function intoRecord<T>(pairs: KVPair<T>[]): Record<string, T> {
  return pairs.reduce((acc: Record<string, T>, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {});
}
