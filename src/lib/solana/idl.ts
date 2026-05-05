import type { Idl } from "@coral-xyz/anchor";

export const AVAX_POINTS_EXCHANGE_IDL: Idl = {
  version: "0.1.0",
  name: "avax_points_exchange",
  instructions: [
    {
      name: "exchangePoints",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "config", isMut: true, isSigner: false },
        { name: "userPoints", isMut: true, isSigner: false },
        { name: "exchangeRecord", isMut: true, isSigner: false },
        { name: "avaxMint", isMut: false, isSigner: false },
        { name: "vaultAuthority", isMut: false, isSigner: false },
        { name: "vaultTokenAccount", isMut: true, isSigner: false },
        { name: "userTokenAccount", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "globalConfig",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "isPaused", type: "bool" },
          { name: "pointsPerExchange", type: "u64" },
          { name: "avaxPerExchange", type: "u64" },
          { name: "avaxMint", type: "publicKey" },
          { name: "exchangeCounter", type: "u64" },
        ],
      },
    },
    {
      name: "userPoints",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "points", type: "u64" },
          { name: "exchangeCount", type: "u64" },
          { name: "lastExchangeTime", type: "i64" },
        ],
      },
    },
    {
      name: "exchangeRecord",
      type: {
        kind: "struct",
        fields: [
          { name: "user", type: "publicKey" },
          { name: "pointsUsed", type: "u64" },
          { name: "avaxReceived", type: "u64" },
          { name: "timestamp", type: "i64" },
          { name: "exchangeId", type: "u64" },
        ],
      },
    },
  ],
} as Idl;
