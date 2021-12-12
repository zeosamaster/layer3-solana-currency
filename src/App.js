import React from "react";
import { useWallet } from "./hooks/wallet";

const App = () => {
  const { wallet, toggleConnection } = useWallet();

  return (
    <div>
      <h1>Create your own token using JavaScript</h1>

      <button onClick={toggleConnection}>
        {!wallet ? "Connect Wallet" : "Disconnect Wallet"}
      </button>

      {wallet && (
        <p>
          <strong>Public Key:</strong> {wallet.publicKey.toString()}
        </p>
      )}
    </div>
  );
};

export default App;
