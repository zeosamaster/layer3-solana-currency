import React from "react";
import { useAirdrop } from "./hooks/airdrop";
import { useToken } from "./hooks/token";
import { useWallet } from "./hooks/wallet";

const App = () => {
  const [loading, setLoading] = React.useState(false);
  const { wallet, toggleConnection } = useWallet();
  const { airdrop } = useAirdrop({ wallet, setLoading });
  const { mint, mintAgain } = useToken({ wallet, setLoading });

  return (
    <div>
      <h1>Create your own token using JavaScript</h1>

      <button disabled={loading} onClick={toggleConnection}>
        {!wallet ? "Connect Wallet" : "Disconnect Wallet"}
      </button>

      {wallet && (
        <p>
          <strong>Public Key:</strong> {wallet.publicKey.toString()}
        </p>
      )}

      {wallet && (
        <div>
          <p>Airdrop 1 SOL into your wallet</p>
          <button disabled={loading} onClick={airdrop}>
            AirDrop SOL
          </button>
        </div>
      )}

      {wallet && (
        <div>
          <p>Create your own token</p>
          <button disabled={loading} onClick={mint}>
            Initial Mint
          </button>
        </div>
      )}

      {wallet && (
        <div>
          <p>Mint 100 additional tokens</p>
          <button
            disabled={loading || !mintAgain}
            onClick={() => mintAgain(100)}
          >
            Mint Again
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
