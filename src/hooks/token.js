import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
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
  const [isSupplyCapped, setIsSupplyCapped] = React.useState(false);

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

  React.useEffect(() => {
    const storedValue = localStorage.getItem(
      "layer3-solana-currency-supply-capped"
    );
    if (storedValue === null) {
      return;
    }

    setIsSupplyCapped(Boolean(storedValue));
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

  React.useEffect(() => {
    if (isSupplyCapped === null) {
      return;
    }
    localStorage.setItem(
      "layer3-solana-currency-supply-capped",
      isSupplyCapped
    );
  }, [isSupplyCapped]);

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
      setIsSupplyCapped(false);

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
      if (isSupplyCapped) {
        return;
      }

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
    [wallet, setLoading, isSupplyCapped, tokenPublicKey, mintingWallet]
  );

  const transfer = React.useCallback(
    async (destinationPubKeyString, amount) => {
      console.log(`Transfer ${amount} tokens`, {
        destination: destinationPubKeyString,
      });

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

        const receiverWalletPublicKey = new PublicKey(destinationPubKeyString);
        const { origin, destination } = await getAccounts(
          creatorToken,
          wallet,
          { publicKey: receiverWalletPublicKey }
        );

        const transaction = new Transaction().add(
          Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            origin.address,
            destination.address,
            wallet.publicKey,
            [],
            amount * TOKENS_TO_MINT_MULTIPLIER
          )
        );
        transaction.feePayer = wallet.publicKey;

        const blockhashObj = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhashObj.blockhash;

        const signed = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(
          signed.serialize()
        );
        await connection.confirmTransaction(signature);

        console.log("Transfer succeeded");
      } catch (err) {
        console.log("Transfer failed");
        console.error(err);
      }

      console.log("Transfer finished");
      setLoading(false);
    },
    [wallet, setLoading, tokenPublicKey, mintingWallet]
  );

  const capSupply = React.useCallback(async () => {
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

      console.log(
        `Setting authority of ${newMintingWallet.publicKey.toString()} to null`
      );

      await creatorToken.setAuthority(
        tokenPublicKey,
        null,
        "MintTokens",
        newMintingWallet.publicKey,
        [newMintingWallet]
      );

      console.log(`Authority successfully changed`);

      setIsSupplyCapped(true);

      console.log("Supply cap successful");
    } catch (err) {
      console.log("Supply cap failed");
      console.error(err);
    }

    console.log("Supply cap finished");
    setLoading(false);
  }, [setLoading, mintingWallet, tokenPublicKey]);

  return {
    isSupplyCapped,
    mint,
    mintAgain: tokenPublicKey ? mintAgain : null,
    transfer: tokenPublicKey ? transfer : null,
    capSupply,
  };
}
