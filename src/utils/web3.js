import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";

export function getConnection() {
  return new Connection(clusterApiUrl("devnet"), "confirmed");
}

export async function airdropMintingWallet(connection, mintingWallet) {
  console.log("Airdropping 1 SOL", {
    mintingWallet: mintingWallet.publicKey.toString(),
  });

  var tx = await connection.requestAirdrop(
    mintingWallet.publicKey,
    LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(tx, { commitment: "confirmed" });

  console.log("Airdrop completed");
}

export async function getAccounts(creatorToken, from, to) {
  console.log("Getting accounts", { creatorToken, from, to });
  const origin = await creatorToken.getOrCreateAssociatedAccountInfo(
    from.publicKey
  );

  const destination = await creatorToken.getOrCreateAssociatedAccountInfo(
    to.publicKey
  );

  console.log("Got accounts", { origin, destination });

  return { origin, destination };
}

export async function sendTransfer(
  connection,
  origin,
  destination,
  mintWallet,
  amount
) {
  console.log(`Transferring ${amount} tokens`, {
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
}
