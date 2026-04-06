import { PeraWalletConnect } from "@perawallet/connect";

export const peraWallet = new PeraWalletConnect({
    chainId: 416002, // Algorand TestNet
});

export const connectPeraWallet = async () => {
    try {
        const newAccounts = await peraWallet.connect();
        // Setup the reconnect callback
        peraWallet.connector?.on("disconnect", () => {
            console.log("Disconnected from Pera Wallet");
        });
        return newAccounts[0];
    } catch (e) {
        console.error("Error connecting to Pera Wallet:", e);
        return null;
    }
};

export const disconnectPeraWallet = async () => {
    await peraWallet.disconnect();
};
