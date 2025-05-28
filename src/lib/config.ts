// configuration
export const RPC_ENDPOINT_URL = process.env.NEXT_PUBLIC_RPC_ENDPOINT_URL as string;
export const RPC_ENDPOINT_URL_WS = process.env.NEXT_PUBLIC_RPC_ENDPOINT_URL_WS as string;
export const FAUCET_URL = process.env.NEXT_PUBLIC_FAUCET_URL as string;
export const BLOCK_INTERVAL = Number(process.env.NEXT_PUBLIC_BLOCK_INTERVAL ?? 2);
export const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "ETH";
export const CURRENCY_NAME = process.env.NEXT_PUBLIC_CURRENCY_NAME || "Ether";
export const CHAIN_NAME = process.env.NEXT_PUBLIC_CHAIN_NAME || "Golem Base L3 TESTNET";
export const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "0xE434A";
export const ANALYTICS_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || "https://analytics.golem-base.io";
export const ANALYTICS_SITE_ID = process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID || "";
export const DOCUMENTATION_URL = process.env.NEXT_PUBLIC_DOCUMENTATION_URL || "";
export const MAX_NOTE_SIZE = Number(process.env.NEXT_PUBLIC_MAX_NOTE_SIZE || "1024");

// features
export const FEATURE_ENCRYPTION_ENABLED =
    process.env.NEXT_PUBLIC_FEATURE_ENCRYPTION_ENABLED === "1" ||
    process.env.NEXT_PUBLIC_FEATURE_ENCRYPTION_ENABLED === "true";

// constants
export const KEY_APP_ID = "app-id";
export const APP_ID: string = "59c2a455-ee2f-45cb-8e2c-cc74e79f6748";
export const KEY_COMMON_NAMESPACE = "io.golem-base.dpaste";
export const KEY_PASTE_CREATED_AT = `${KEY_COMMON_NAMESPACE}.created-at`;
export const KEY_PASTE_LANGUAGE = `${KEY_COMMON_NAMESPACE}.language`;
export const KEY_PASTE_VERSION = `${KEY_COMMON_NAMESPACE}.version`;
export const PASTE_VERSION = "1.0.0";
export const KEY_PASTE_ENCRYPTED = `${KEY_COMMON_NAMESPACE}.encrypted`;
export const RPC_TIMEOUT_SECONDS = 30;
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" };
