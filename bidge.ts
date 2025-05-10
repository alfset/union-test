import { privateKeyToAccount } from "viem/accounts";
import { createUnionClient, http } from "@unionlabs/client";
import type { TransferAssetsParameters } from "@unionlabs/client";
import { ethers } from "ethers";


const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
];

async function logTokenBalance(tokenAddress: string, walletAddress: string, rpcUrl: string) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  const [name, symbol, decimals, rawBalance] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.balanceOf(walletAddress),
  ]);

  const formattedBalance = rawBalance;

  console.log(`\n🔎 Token Info for ${tokenAddress}`);
  console.log(`🪙 Name: ${name}`);
  console.log(`🔤 Symbol: ${symbol}`);
  console.log(`🔢 Decimals: ${decimals}`);
  console.log(`💰 Balance of ${walletAddress}: ${formattedBalance} ${symbol}`);
}

const unionClient = createUnionClient({
  chainId: "11155111",
    //EvmClientParameters.chainId: "11155111" | "534351" | "421614" | "80084"
  account: privateKeyToAccount("PK"),
  transport: http("https://eth-sepolia.public.blastapi.io"),
});

const amount = ethers.parseUnits("0.000001", 18);
console.log(amount);

const transferPayload ={
  amount: 1n,
  autoApprove: false,
  destinationChainId: "17000",
  receiver: "address",
  denomAddress: "0x7b79995e5f793a07bc00c21412e50ecae098e7f9", //WETH
} satisfies TransferAssetsParameters<"11155111">

console.log(transferPayload);

async function runTransfer() {
  await logTokenBalance(
  transferPayload.denomAddress,
  unionClient.account.address,
  "https://eth-sepolia.public.blastapi.io"
);

  try {
    console.log("🚀 Sending assets to Holesky...");
    console.log("📦 Transfer Payload:", transferPayload);

    const transfer = await unionClient.transferAsset(transferPayload);

    console.log("🔍 Raw Transfer Response:", transfer);

    if (transfer.isErr()) {
      console.error("❌ Transfer failed!");
      console.error("📛 Error object:", transfer.error);
      console.error("📛 Error message:", transfer.error.message);
      if ((transfer.error as any).cause) {
        console.error("📛 Error cause:", (transfer.error as any).cause);
      }
      process.exit(1);
    }

    console.log(`🎉 Transfer success! Hash: ${transfer.value}`);
  } catch (error) {
    console.error("❌ Unhandled error during transfer:", error);
  }
}

runTransfer().catch(console.error);
