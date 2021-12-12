import {
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import React from "react";
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";

const DECIMALS = 6;
const TOKENS_TO_MINT_MULTIPLIER = Math.pow(10, DECIMALS);
const INITIAL_MINTED_TOKENS = 1;

export function useToken({ wallet, setLoading }) {
  const [tokenPublicKey, setTokenPublicKey] = React.useState(null);
  const [mintingWallet, setMintingWallet] = React.useState(null);

  const getConnection = React.useCallback(() => {
    return new Connection(clusterApiUrl("devnet"), "confirmed");
  }, []);

  const airdropMintingWallet = React.useCallback(
    async (connection, mintingWallet) => {
      console.log("Airdropping 1 SOL", {
        mintingWallet: mintingWallet.publicKey.toString(),
      });

      var tx = await connection.requestAirdrop(
        mintingWallet.publicKey,
        LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(tx, { commitment: "confirmed" });

      console.log("Airdrop completed");
    },
    []
  );

  const getAccounts = React.useCallback(
    async (creatorToken, originWallet) => {
      console.log("Getting accounts", { creatorToken, originWallet });
      const origin = await creatorToken.getOrCreateAssociatedAccountInfo(
        originWallet.publicKey
      );

      const destination = await creatorToken.getOrCreateAssociatedAccountInfo(
        wallet.publicKey
      );

      console.log("Got accounts", { origin, destination });

      return { origin, destination };
    },
    [wallet]
  );

  const transfer = React.useCallback(
    async (connection, origin, destination, mintWallet, amount) => {
      console.log(`Transfering ${amount} tokens`, {
        destination: destination.toString(),
        origin: origin.toString(),
      });

      const tx = new Transaction().add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          origin.address,
          destination.address,
          mintWallet.publicKey,
          [],
          amount
        )
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [mintWallet],
        {
          commitment: "confirmed",
        }
      );

      console.log("Tranfer completed", { signature });

      return signature;
    },
    []
  );

  const mint = React.useCallback(async () => {
    setLoading(true);

    console.log("Minting new token");

    try {
      const connection = getConnection();
      const newMintingWallet = Keypair.generate();
      setMintingWallet(newMintingWallet);

      await airdropMintingWallet(connection, newMintingWallet);

      const creatorToken = await Token.createMint(
        connection,
        newMintingWallet,
        newMintingWallet.publicKey,
        null,
        DECIMALS,
        TOKEN_PROGRAM_ID
      );

      const { origin, destination } = await getAccounts(
        creatorToken,
        newMintingWallet
      );

      await creatorToken.mintTo(
        origin.address,
        newMintingWallet.publicKey,
        [],
        INITIAL_MINTED_TOKENS * TOKENS_TO_MINT_MULTIPLIER
      );

      await transfer(
        connection,
        origin,
        destination,
        newMintingWallet,
        INITIAL_MINTED_TOKENS * TOKENS_TO_MINT_MULTIPLIER
      );

      setTokenPublicKey(creatorToken.publicKey);

      console.log("Minting successfull");
    } catch (err) {
      console.log("Error minting");
      console.error(err);
    }

    console.log("Minting finished");

    setLoading(false);
  }, [setLoading, getConnection, airdropMintingWallet, getAccounts, transfer]);

  const mintAgain = React.useCallback(
    async (amount) => {
      console.log("Minting additional tokens");

      setLoading(true);

      try {
        const connection = getConnection();
        const newMintingWallet = Keypair.fromSecretKey(
          Uint8Array.from(Object.values(mintingWallet.secretKey))
        );

        await airdropMintingWallet(connection, newMintingWallet);

        const creatorToken = new Token(
          connection,
          tokenPublicKey,
          TOKEN_PROGRAM_ID,
          newMintingWallet
        );

        const { origin, destination } = await getAccounts(
          creatorToken,
          newMintingWallet
        );

        await creatorToken.mintTo(
          origin.address,
          newMintingWallet.publicKey,
          [],
          amount * TOKENS_TO_MINT_MULTIPLIER
        );

        await transfer(
          connection,
          origin,
          destination,
          newMintingWallet,
          amount * TOKENS_TO_MINT_MULTIPLIER
        );

        console.log("Minting successfull");
      } catch (err) {
        console.log("Error minting");
        console.error(err);
      }

      console.log("Minting finished");

      setLoading(false);
    },
    [
      setLoading,
      tokenPublicKey,
      mintingWallet,
      getConnection,
      airdropMintingWallet,
      getAccounts,
      transfer,
    ]
  );

  return { mint, mintAgain: tokenPublicKey ? mintAgain : null };
}
