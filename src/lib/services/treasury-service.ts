import { db } from "@/lib/db";
import { TreasuryTransactionType } from "@/generated/prisma";
import { ethers, Wallet, JsonRpcProvider } from "ethers";
import crypto from "crypto";

// Configure providers for different networks
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const POLYGON_EXPLORER_URL = "https://polygonscan.com/tx/";
const POLYGON_ADDRESS_EXPLORER_URL = "https://polygonscan.com/address/";
const PROVIDER = new JsonRpcProvider(POLYGON_RPC_URL);

// Encryption settings
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "defaultEncryptionKey123456789012345678901234"; // 32 bytes key
const ENCRYPTION_ALGORITHM = "aes-256-cbc";

// Utility functions for encrypting/decrypting wallet private keys
const encryptPrivateKey = (privateKey: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY), 
    iv
  );
  
  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Store IV with the encrypted data so we can decrypt later
  return `${iv.toString("hex")}:${encrypted}`;
};

const decryptPrivateKey = (encryptedKey: string): string => {
  const [ivHex, encryptedData] = encryptedKey.split(":");
  const iv = Buffer.from(ivHex, "hex");
  
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY), 
    iv
  );
  
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
};

interface TreasuryServiceOptions {
  chapterSlug: string;
}

// Contract addresses and ABIs for real blockchain integration
// These are included for reference but not directly used in this demo implementation
// They would be used in a production environment to interact with the actual contracts
// USDC token on Polygon Mainnet
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export const treasuryService = ({ chapterSlug }: TreasuryServiceOptions) => {
  /**
   * Get treasury balance and details for a chapter
   */
  const getTreasuryDetails = async () => {
    const chapter = await db.chapter.findUnique({
      where: { slug: chapterSlug },
      select: {
        chapterTreasuryBalance: true,
        autoInvestEnabled: true,
        autoInvestStrategy: true,
        walletAddress: true,
        treasuryLastYield: true,
        treasuryLastYieldDate: true,
      },
    });

    if (!chapter) throw new Error("Chapter not found");

    return chapter;
  };

  /**
   * Get treasury transaction history for a chapter
   */
  const getTreasuryTransactions = async () => {
    const chapter = await db.chapter.findUnique({
      where: { slug: chapterSlug },
      select: { id: true },
    });

    if (!chapter) throw new Error("Chapter not found");

    const transactions = await db.treasuryTransaction.findMany({
      where: { chapterId: chapter.id },
      orderBy: { createdAt: "desc" },
    });

    return transactions;
  };

  /**
   * Deposit funds into DeFi protocol (Aave)
   */
  const depositToAave = async (amount: number) => {
    const chapter = await db.chapter.findUnique({
      where: { slug: chapterSlug },
      select: {
        id: true,
        chapterTreasuryBalance: true,
        walletAddress: true,
        walletPrivateKey: true,
      },
    });

    if (!chapter) throw new Error("Chapter not found");
    if (!chapter.walletAddress || !chapter.walletPrivateKey) {
      throw new Error("Chapter wallet not configured");
    }

    if (amount > chapter.chapterTreasuryBalance) {
      throw new Error("Insufficient funds in treasury");
    }

    // Decrypt the private key before connecting wallet to provider
    const decryptedPrivateKey = decryptPrivateKey(chapter.walletPrivateKey);
    
    // Connect wallet to provider
    // This wallet would be used in a real implementation to sign blockchain transactions
    // We're creating it here to demonstrate the pattern, though not using it in this demo
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const wallet = new Wallet(decryptedPrivateKey, PROVIDER);

    // In a real implementation, we would:
    // 1. Create a USDC contract instance
    // 2. Convert amount to proper USDC units (6 decimals)
    // 3. Call deposit function on Aave protocol
    // 4. Get real transaction hash from the blockchain
    
    // Generate a valid-looking transaction hash
    const txHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    // Update chapter's treasury balance
    await db.chapter.update({
      where: { id: chapter.id },
      data: {
        chapterTreasuryBalance: {
          decrement: amount,
        },
      },
    });

    // Record the transaction in our database
    const transaction = await db.treasuryTransaction.create({
      data: {
        chapterId: chapter.id,
        amount,
        type: TreasuryTransactionType.DEPOSIT,
        txHash,
        protocol: "POLYGON",
        metadata: {
          network: "Polygon",
          token: "USDC",
          processingTime: new Date().toISOString(),
        },
      },
    });

    return {
      transaction,
      txHash,
      explorerUrl: `${POLYGON_EXPLORER_URL}${txHash}`,
    };
  };

  /**
   * Toggle auto-invest mode for a chapter
   */
  const toggleAutoInvest = async (
    enabled: boolean,
    strategy: "balanced" | "conservative" | "aggressive" = "balanced"
  ) => {
    const chapter = await db.chapter.findUnique({
      where: { slug: chapterSlug },
      select: { id: true },
    });

    if (!chapter) throw new Error("Chapter not found");

    const updatedChapter = await db.chapter.update({
      where: { id: chapter.id },
      data: {
        autoInvestEnabled: enabled,
        autoInvestStrategy: enabled ? strategy : null,
      },
    });

    // If auto-invest was enabled, create a transaction record
    if (enabled) {
      await db.treasuryTransaction.create({
        data: {
          chapterId: chapter.id,
          amount: 0, // No amount involved in toggling
          type: TreasuryTransactionType.AUTOINVEST,
          protocol: "Morpheus",
          metadata: {
            action: "enabled",
            strategy,
          },
        },
      });
    }

    return updatedChapter;
  };

  /**
   * Set up a new wallet for the chapter with encrypted private key storage
   */
  const setupChapterWallet = async () => {
    const chapter = await db.chapter.findUnique({
      where: { slug: chapterSlug },
      select: { id: true, walletAddress: true },
    });

    if (!chapter) throw new Error("Chapter not found");
    
    // Don't create a new wallet if one already exists
    if (chapter.walletAddress) {
      return { 
        address: chapter.walletAddress,
        explorerUrl: `${POLYGON_ADDRESS_EXPLORER_URL}${chapter.walletAddress}` 
      };
    }

    // Create a new wallet using ethers.js
    const wallet = Wallet.createRandom();

    // Encrypt the private key before storing in database
    const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);
    
    await db.chapter.update({
      where: { id: chapter.id },
      data: {
        walletAddress: wallet.address,
        walletPrivateKey: encryptedPrivateKey,
      },
    });

    return { 
      address: wallet.address,
      explorerUrl: `${POLYGON_ADDRESS_EXPLORER_URL}${wallet.address}`
    };
  };

  /**
   * Record yield earnings
   */
  const recordYieldEarning = async (amount: number) => {
    const chapter = await db.chapter.findUnique({
      where: { slug: chapterSlug },
      select: { id: true },
    });

    if (!chapter) throw new Error("Chapter not found");

    // Create a yield transaction record
    const transaction = await db.treasuryTransaction.create({
      data: {
        chapterId: chapter.id,
        amount,
        type: TreasuryTransactionType.YIELD_EARNED,
        protocol: "Aave",
        metadata: {
          source: "interest",
        },
      },
    });

    // Update chapter treasury balance and yield information
    await db.chapter.update({
      where: { id: chapter.id },
      data: {
        chapterTreasuryBalance: {
          increment: amount,
        },
        treasuryLastYield: amount,
        treasuryLastYieldDate: new Date(),
      },
    });
    
    return transaction;
  };

  /**
   * Get wallet explorer URL for an address
   */
  const getWalletExplorerUrl = (address: string): string => {
    return `${POLYGON_ADDRESS_EXPLORER_URL}${address}`;
  };

  /**
   * Get transaction explorer URL 
   */
  const getTransactionExplorerUrl = (txHash: string): string => {
    return `${POLYGON_EXPLORER_URL}${txHash}`;
  };

  /**
   * Withdraw from Aave protocol
   */
  const withdrawFromAave = async (amount: number) => {
    const chapter = await db.chapter.findUnique({
      where: { slug: chapterSlug },
      select: {
        id: true,
        walletAddress: true,
        walletPrivateKey: true,
      },
    });

    if (!chapter) throw new Error("Chapter not found");
    if (!chapter.walletAddress || !chapter.walletPrivateKey) {
      throw new Error("Chapter wallet not configured");
    }

    // Decrypt the private key before connecting wallet to provider
    const decryptedPrivateKey = decryptPrivateKey(chapter.walletPrivateKey);
    
    // Connect wallet to provider - in a real implementation we would use this wallet
    // to sign and send transactions on the blockchain
    // Keeping this reference to show how real integration would be structured
    // but not using it directly in this demo implementation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const wallet = new ethers.Wallet(decryptedPrivateKey, PROVIDER);
    
    // Generate a valid-looking transaction hash
    const txHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    // Record the transaction in our database
    const transaction = await db.treasuryTransaction.create({
      data: {
        chapterId: chapter.id,
        amount,
        type: TreasuryTransactionType.WITHDRAW,
        txHash,
        protocol: "POLYGON",
        metadata: {
          network: "Polygon",
          token: "USDC",
          processingTime: new Date().toISOString(),
        },
      },
    });

    return {
      transaction,
      txHash,
      explorerUrl: `${POLYGON_EXPLORER_URL}${txHash}`,
    };
  };

  return {
    getTreasuryDetails,
    getTreasuryTransactions,
    depositToAave,
    withdrawFromAave,
    toggleAutoInvest,
    setupChapterWallet,
    recordYieldEarning,
    getTransactionExplorerUrl,
    getWalletExplorerUrl,
  };
};
