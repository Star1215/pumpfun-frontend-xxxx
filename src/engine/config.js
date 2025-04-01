
import { Connection, 
    clusterApiUrl
} from "@solana/web3.js";
import { 
    TxVersion, 
    MAINNET_PROGRAM_ID,
    DEVNET_PROGRAM_ID, 
    LOOKUP_TABLE_CACHE,
} from "@raydium-io/raydium-sdk";
import * as dotenv from "dotenv";


dotenv.config();

const IS_MAINNET = process.env.NEXT_PUBLIC_IS_MAINNET || "";

// export const isMainNet = IS_MAINNET === "true";
export const isMainNet = false;

export const networkUrl = !isMainNet 
    ? "https://api.devnet.solana.com"
    : 'https://mainnet.helius-rpc.com/?api-key=d28ab592-91c2-491b-ba48-39eb5a3f07dd';
export const PROGRAMIDS = isMainNet ? MAINNET_PROGRAM_ID : DEVNET_PROGRAM_ID;
export const BUNDLR_URL = isMainNet ? "https://node1.bundlr.network" : "https://devnet.bundlr.network";
export const addLookupTableInfo = isMainNet ? LOOKUP_TABLE_CACHE : undefined;

export const connection = new Connection(networkUrl, "confirmed");

export const makeTxVersion = TxVersion.V0; // LEGACY
