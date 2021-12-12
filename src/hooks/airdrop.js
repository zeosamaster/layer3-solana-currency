import {
  Connection,
  clusterApiUrl,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export function useAirdrop({ wallet, setLoading }) {
  const airdrop = async () => {
    setLoading(true);

    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const pubKey = new PublicKey(wallet.publicKey);

      const tx = await connection.requestAirdrop(pubKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(tx, { commitment: "confirmed" });

      console.log(
        `1 SOL airdropped to your wallet ${wallet.publicKey.toString()} successfully`
      );
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  return { airdrop };
}
