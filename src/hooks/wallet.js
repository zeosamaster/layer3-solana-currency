import React from "react";

const getProvider = async () => {
  if ("solana" in window) {
    const provider = window.solana;

    if (provider.isPhantom) {
      return provider;
    }
  } else {
    window.open("https://www.phantom.app/", "_blank");
  }
};

export function useWallet() {
  const [wallet, setWallet] = React.useState();

  const toggleConnection = React.useCallback(async () => {
    if (wallet !== undefined) {
      //Disconnect Wallet
      setWallet();
    } else {
      const userWallet = await getProvider();

      if (userWallet) {
        userWallet.on("connect", () => {
          setWallet(userWallet);
        });
        await userWallet.connect();
      }
    }
  }, [wallet]);

  return {
    wallet,
    toggleConnection,
  };
}
