import { AnchorProvider, BN, Program, web3, type Idl } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  clusterApiUrl,
} from "@solana/web3.js";
import { AVAX_POINTS_EXCHANGE_IDL } from "./idl";

// Deployed devnet program id from
// https://github.com/54CandyChan/Demo-Wenzhou
export const PROGRAM_ID = new PublicKey(
  "Hs768q1NX13tbbBHJZrHXEhGtMv666UANzVjy2AakqX1"
);

// Placeholder AVAX SPL mint on devnet (admin must update post deploy)
export const AVAX_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

export const POINTS_PER_EXCHANGE = 1000;

const enc = new TextEncoder();
const GLOBAL_CONFIG_SEED = enc.encode("global-config");
const USER_POINTS_SEED = enc.encode("user-points");
const EXCHANGE_RECORD_SEED = enc.encode("exchange-record");
const VAULT_AUTHORITY_SEED = enc.encode("vault-authority");

export function getConnection() {
  return new Connection(clusterApiUrl("devnet"), "confirmed");
}

export type PhantomProvider = {
  isPhantom?: boolean;
  publicKey: PublicKey | null;
  isConnected: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction: <T = web3.Transaction>(t: T) => Promise<T>;
  signAllTransactions: <T = web3.Transaction>(ts: T[]) => Promise<T[]>;
};

export function getPhantom(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { solana?: PhantomProvider; phantom?: { solana?: PhantomProvider } };
  const p = w.phantom?.solana ?? w.solana;
  return p && p.isPhantom ? p : null;
}

export async function connectPhantom(): Promise<string> {
  const p = getPhantom();
  if (!p) {
    window.open("https://phantom.app/", "_blank");
    throw new Error("未检测到 Phantom 钱包，请先安装 Phantom 后再试");
  }
  const res = await p.connect();
  return res.publicKey.toBase58();
}

async function deriveAddresses(user: PublicKey, connection: Connection, idl: Idl) {
  const [configPda] = PublicKey.findProgramAddressSync([GLOBAL_CONFIG_SEED], PROGRAM_ID);
  const [userPointsPda] = PublicKey.findProgramAddressSync(
    [USER_POINTS_SEED, user.toBuffer()],
    PROGRAM_ID
  );

  let exchangeCounter = new BN(0);
  try {
    const provider = new AnchorProvider(
      connection,
      { publicKey: user, signTransaction: async (t) => t, signAllTransactions: async (ts) => ts } as never,
      { commitment: "confirmed" }
    );
    const program = new Program(idl, PROGRAM_ID, provider);
    const cfg = await program.account.globalConfig.fetchNullable(configPda);
    if (cfg) exchangeCounter = (cfg as { exchangeCounter: BN }).exchangeCounter;
  } catch {
    // config not initialized; keep counter 0 for demo
  }

  const [exchangeRecordPda] = PublicKey.findProgramAddressSync(
    [EXCHANGE_RECORD_SEED, Uint8Array.from(exchangeCounter.toArray("le", 8))],
    PROGRAM_ID
  );
  const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
    [VAULT_AUTHORITY_SEED, configPda.toBuffer()],
    PROGRAM_ID
  );
  const vaultTokenAccount = getAssociatedTokenAddressSync(AVAX_MINT, vaultAuthorityPda, true);
  const userTokenAccount = getAssociatedTokenAddressSync(AVAX_MINT, user);

  return { configPda, userPointsPda, exchangeRecordPda, vaultAuthorityPda, vaultTokenAccount, userTokenAccount };
}

export async function exchangePoints(phantom: PhantomProvider): Promise<string> {
  if (!phantom.publicKey) throw new Error("钱包未连接");
  const connection = getConnection();
  const idl = AVAX_POINTS_EXCHANGE_IDL;

  const provider = new AnchorProvider(
    connection,
    {
      publicKey: phantom.publicKey,
      signTransaction: phantom.signTransaction.bind(phantom),
      signAllTransactions: phantom.signAllTransactions.bind(phantom),
    } as never,
    { commitment: "confirmed" }
  );
  const program = new Program(idl, PROGRAM_ID, provider);
  const a = await deriveAddresses(phantom.publicKey, connection, idl);

  return program.methods
    .exchangePoints()
    .accounts({
      user: phantom.publicKey,
      config: a.configPda,
      userPoints: a.userPointsPda,
      exchangeRecord: a.exchangeRecordPda,
      avaxMint: AVAX_MINT,
      vaultAuthority: a.vaultAuthorityPda,
      vaultTokenAccount: a.vaultTokenAccount,
      userTokenAccount: a.userTokenAccount,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}
