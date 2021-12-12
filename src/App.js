import React from "react";
import { useAirdrop } from "./hooks/airdrop";
import { useToken } from "./hooks/token";
import { useWallet } from "./hooks/wallet";

import "./App.css";

const App = () => {
  const [loading, setLoading] = React.useState(false);
  const { wallet, toggleConnection } = useWallet();
  const { airdrop } = useAirdrop({ wallet, setLoading });
  const { isSupplyCapped, mint, mintAgain, transfer, capSupply } = useToken({
    wallet,
    setLoading,
  });

  const [transferWallet, setTransferWallet] = React.useState("");

  return (
    <div>
      <h1>Create your own token using JavaScript</h1>

      <div className="container">
        <button disabled={loading} onClick={toggleConnection}>
          {!wallet ? "Connect Wallet" : "Disconnect Wallet"}
        </button>
      </div>

      {wallet && (
        <div className="container">
          <span>
            <strong>Public Key:</strong> {wallet.publicKey.toString()}
          </span>
        </div>
      )}

      {wallet && (
        <div className="container">
          <span>Airdrop 1 SOL into your wallet</span>
          <button disabled={loading} onClick={airdrop}>
            Airdrop SOL
          </button>
        </div>
      )}

      {wallet && (
        <div className="container">
          <span>Create your own token</span>
          <button disabled={loading} onClick={mint}>
            Initial Mint
          </button>
        </div>
      )}

      {wallet && (
        <div className="container">
          <span>Mint 100 additional tokens</span>
          <button
            disabled={loading || !mintAgain || isSupplyCapped}
            onClick={() => mintAgain(100)}
          >
            Mint Again
          </button>
        </div>
      )}

      {wallet && (
        <div className="container">
          <span>Transfer 10 of your tokens to another wallet</span>
          <input
            type="text"
            value={transferWallet}
            onChange={(e) => setTransferWallet(e.target.value)}
          />
          <button
            disabled={loading || !transfer}
            onClick={() => transfer(transferWallet, 10)}
          >
            Transfer
          </button>
        </div>
      )}

      {wallet && (
        <div className="container">
          <span>Cap supply</span>
          <button disabled={loading || isSupplyCapped} onClick={capSupply}>
            Cap Supply
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
