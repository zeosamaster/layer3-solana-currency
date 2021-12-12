import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";
import React from "react";
import {
  airdropMintingWallet,
  getAccounts,
  getConnection,
  sendTransfer,
} from "../utils/web3";

const DECIMALS = 6;
const TOKENS_TO_MINT_MULTIPLIER = Math.pow(10, DECIMALS);
const INITIAL_MINTED_TOKENS = 1;

export function useToken({ wallet, setLoading }) {
  const [tokenPublicKey, setTokenPublicKey] = React.useState(null);
  const [mintingWallet, setMintingWallet] = React.useState(null);

  // load stored values
  React.useEffect(() => {
    const storedKey = localStorage.getItem("layer3-solana-currency-token");
    if (!storedKey) {
      return;
    }

    const publicKey = new PublicKey(storedKey);
    setTokenPublicKey(publicKey);
  }, []);

  React.useEffect(() => {
    const storedKey = localStorage.getItem(
      "layer3-solana-currency-minting-wallet"
    );
    if (!storedKey) {
      return;
    }

    const storedWallet = Keypair.fromSecretKey(
      Uint8Array.from(Object.values(JSON.parse(storedKey)))
    );
    setMintingWallet(storedWallet);
  }, []);

  // store values
  React.useEffect(() => {
    if (!tokenPublicKey) {
      return;
    }
    localStorage.setItem(
      "layer3-solana-currency-token",
      tokenPublicKey.toString()
    );
  }, [tokenPublicKey]);

  React.useEffect(() => {
    if (!mintingWallet) {
      return;
    }
    localStorage.setItem(
      "layer3-solana-currency-minting-wallet",
      JSON.stringify(mintingWallet.secretKey)
    );
  }, [mintingWallet]);

  // methods
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
        newMintingWallet,
        wallet
      );

      await creatorToken.mintTo(
        origin.address,
        newMintingWallet.publicKey,
        [],
        INITIAL_MINTED_TOKENS * TOKENS_TO_MINT_MULTIPLIER
      );

      await sendTransfer(
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
  }, [wallet, setLoading]);

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
          newMintingWallet,
          wallet
        );

        await creatorToken.mintTo(
          origin.address,
          newMintingWallet.publicKey,
          [],
          amount * TOKENS_TO_MINT_MULTIPLIER
        );

        await sendTransfer(
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
    [wallet, setLoading, tokenPublicKey, mintingWallet]
  );

  return {
    mint,
    mintAgain: tokenPublicKey ? mintAgain : null,
  };
}
