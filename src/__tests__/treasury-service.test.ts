import { describe, it, expect, beforeEach } from 'vitest';
import { Chapter, TreasuryTransaction, TreasuryTransactionType, Prisma } from '@/generated/prisma';
import { treasuryService } from '@/lib/services/treasury-service';
import { db } from '@/lib/db';
import type { MockedFunction } from 'vitest';
import crypto from 'node:crypto';

// Mock external dependencies
vi.mock('@/lib/db');
vi.mock('ethers', () => {
  const mockWallet = {
    address: '0x1234567890123456789012345678901234567890',
    privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
  };
  
  // Create a proper Wallet mock that can be used as both constructor and has static methods
  const MockWallet = vi.fn().mockImplementation(() => mockWallet) as vi.MockedFunction<new (...args: unknown[]) => typeof mockWallet> & {
    createRandom: vi.MockedFunction<() => typeof mockWallet>;
  };
  // Add the static createRandom method directly to the mock function
  MockWallet.createRandom = vi.fn().mockReturnValue(mockWallet);
  
  const MockJsonRpcProvider = vi.fn().mockImplementation(() => ({
    getBalance: vi.fn(),
    getTransactionCount: vi.fn(),
    sendTransaction: vi.fn(),
  }));
  
  return {
    // Direct exports that match the import pattern: import { Wallet, JsonRpcProvider } from 'ethers'
    Wallet: MockWallet,
    JsonRpcProvider: MockJsonRpcProvider,
    // Main ethers object for any ethers.* usage patterns
    ethers: {
      Wallet: MockWallet,
      JsonRpcProvider: MockJsonRpcProvider,
    },
    Contract: vi.fn(),
    formatEther: vi.fn(),
    parseEther: vi.fn(),
  };
});
vi.mock('node:crypto', () => ({
  default: {
    getRandomValues: vi.fn(),
    randomBytes: vi.fn(),
    createCipheriv: vi.fn(),
    createDecipheriv: vi.fn(),
  },
}));

// Create properly typed mocks using vi.mocked
const mockDb = {
  chapter: {
    findUnique: vi.fn() as MockedFunction<typeof db.chapter.findUnique>,
    update: vi.fn() as MockedFunction<typeof db.chapter.update>,
  },
  treasuryTransaction: {
    findMany: vi.fn() as MockedFunction<typeof db.treasuryTransaction.findMany>,
    create: vi.fn() as MockedFunction<typeof db.treasuryTransaction.create>,
  },
};

// Type-safe mock assignment function (DRY principle)
const assignMocksToDb = () => {
  const mockedDb = vi.mocked(db);
  Object.assign(mockedDb.chapter, mockDb.chapter);
  Object.assign(mockedDb.treasuryTransaction, mockDb.treasuryTransaction);
};

// Initialize mocks
assignMocksToDb();

// Test constants
const TEST_CONSTANTS = {
  CHAPTER_SLUG: 'test-chapter',
  CHAPTER_ID: 'chapter-123',
  WALLET_ADDRESS: '0x1234567890123456789012345678901234567890',
  ENCRYPTED_PRIVATE_KEY: '1234567890123456:encrypteddata',
  TREASURY_BALANCE: 1000,
  DEPOSIT_AMOUNT: 500,
  YIELD_AMOUNT: 25,
} as const;

// Create a type-safe mock that handles Prisma's select return type
type ChapterTreasurySelect = {
  chapterTreasuryBalance: number;
  autoInvestEnabled: boolean;
  autoInvestStrategy: string | null;
  walletAddress: string | null;
  treasuryLastYield: number | null;
  treasuryLastYieldDate: Date | null;
};

// Factory functions
const createMockChapter = (overrides: Partial<Chapter> = {}): Chapter => ({
  id: TEST_CONSTANTS.CHAPTER_ID,
  name: 'Test Chapter',
  slug: TEST_CONSTANTS.CHAPTER_SLUG,
  joinCode: 'TEST123',
  publicInfo: null,
  primaryColor: '#000000',
  schoolName: 'Test University',
  createdAt: new Date(),
  updatedAt: new Date(),
  stripeCustomerId: null,
  chapterTreasuryBalance: TEST_CONSTANTS.TREASURY_BALANCE,
  autoInvestEnabled: false,
  autoInvestStrategy: null,
  walletAddress: TEST_CONSTANTS.WALLET_ADDRESS,
  walletPrivateKey: TEST_CONSTANTS.ENCRYPTED_PRIVATE_KEY,
  treasuryLastYield: null,
  treasuryLastYieldDate: null,
  ...overrides,
});

const createMockTransaction = (overrides: Partial<TreasuryTransaction> = {}): TreasuryTransaction => ({
  id: 'tx-123',
  chapterId: TEST_CONSTANTS.CHAPTER_ID,
  amount: TEST_CONSTANTS.DEPOSIT_AMOUNT,
  type: TreasuryTransactionType.DEPOSIT,
  txHash: null,
  apy: null,
  protocol: 'POLYGON',
  metadata: {},
  createdAt: new Date(),
  ...overrides,
});

// Update the createMockTreasuryData to return a proper mock that satisfies both types
const createMockTreasuryDataForSelect = (overrides: Partial<ChapterTreasurySelect> = {}): Pick<Chapter, keyof ChapterTreasurySelect> => ({
  chapterTreasuryBalance: TEST_CONSTANTS.TREASURY_BALANCE,
  autoInvestEnabled: false,
  autoInvestStrategy: null,
  walletAddress: TEST_CONSTANTS.WALLET_ADDRESS,
  treasuryLastYield: null,
  treasuryLastYieldDate: null,
  ...overrides,
});

// Setup functions
const setupCryptoMocks = () => {
  const mockedCrypto = vi.mocked(crypto);
  
  mockedCrypto.getRandomValues.mockImplementation(<T extends BufferSource>(typedArray: T): T => {
    const view = new Uint8Array(typedArray as ArrayBuffer);
    for (let i = 0; i < view.length; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
    return typedArray;
  });
  
  mockedCrypto.randomBytes.mockImplementation((size: number) => {
    const buffer = Buffer.alloc(size);
    for (let i = 0; i < size; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  });
  
  // Create a mock object that implements the Cipher interface methods we need
  const mockCipher = {
    update: vi.fn().mockReturnValue('encrypted'),
    final: vi.fn().mockReturnValue(''),
    setAutoPadding: vi.fn().mockReturnThis(),
  };
  
  // Create a mock object that implements the Decipher interface methods we need
  const mockDecipher = {
    update: vi.fn().mockReturnValue('decrypted'),
    final: vi.fn().mockReturnValue(''),
    setAutoPadding: vi.fn().mockReturnThis(),
  };
  
  // Cast to Cipher and Decipher using type assertions
  mockedCrypto.createCipheriv.mockReturnValue(mockCipher as unknown as crypto.Cipher);
  mockedCrypto.createDecipheriv.mockReturnValue(mockDecipher as unknown as crypto.Decipher);
};

const setupMocks = () => {
  vi.clearAllMocks();
  setupCryptoMocks();
};

// Expectation helpers
const expectChapterFindUniqueCall = (
  selectFields: Prisma.ChapterSelect,
  chapterSlug: string = TEST_CONSTANTS.CHAPTER_SLUG
) => {
  expect(mockDb.chapter.findUnique).toHaveBeenCalledWith({
    where: { slug: chapterSlug },
    select: selectFields,
  });
};

const expectChapterUpdateCall = (
  updateData: Prisma.ChapterUpdateInput,
  whereClause: Prisma.ChapterWhereUniqueInput = { id: TEST_CONSTANTS.CHAPTER_ID }
) => {
  expect(mockDb.chapter.update).toHaveBeenCalledWith({
    where: whereClause,
    data: updateData,
  });
};

describe('treasuryService', () => {
  const service = treasuryService({ chapterSlug: TEST_CONSTANTS.CHAPTER_SLUG });

  beforeEach(() => {
    setupMocks();
  });

  describe('getTreasuryDetails', () => {
    it('should return treasury details for a chapter', async () => {
      const mockTreasuryData = createMockTreasuryDataForSelect();
      // Fix: Use type assertion to satisfy the mock while maintaining type safety
      (mockDb.chapter.findUnique as vi.Mock).mockResolvedValue(mockTreasuryData);
      
      const result = await service.getTreasuryDetails();
      
      expectChapterFindUniqueCall({
        chapterTreasuryBalance: true,
        autoInvestEnabled: true,
        autoInvestStrategy: true,
        walletAddress: true,
        treasuryLastYield: true,
        treasuryLastYieldDate: true,
      });
      expect(result).toEqual(mockTreasuryData);
    });

    it('should throw error if chapter not found', async () => {
      mockDb.chapter.findUnique.mockResolvedValue(null);

      await expect(service.getTreasuryDetails()).rejects.toThrow('Chapter not found');
    });
  });

  describe('getTreasuryTransactions', () => {
    it('should return treasury transactions for a chapter', async () => {
      const mockChapter = createMockChapter();
      const mockTransactions = [createMockTransaction(), createMockTransaction({ id: 'tx-456' })];
      
      mockDb.chapter.findUnique.mockResolvedValue(mockChapter);
      mockDb.treasuryTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getTreasuryTransactions();

      expectChapterFindUniqueCall({ id: true });
      expect(mockDb.treasuryTransaction.findMany).toHaveBeenCalledWith({
        where: { chapterId: TEST_CONSTANTS.CHAPTER_ID },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockTransactions);
    });
  });

  // Remove this duplicate mock block entirely (lines 246-256)
  // vi.mock('ethers', () => ({
  //   Wallet: {
  //     createRandom: vi.fn(() => ({
  //       address: '0x1234567890123456789012345678901234567890',
  //       privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
  //     })),
  //   },
  //   ethers: {
  //     Wallet: vi.fn(),
  //   },
  // }));
  
  describe('depositToAave', () => {
    it('should successfully deposit funds to Aave', async () => {
      mockDb.chapter.findUnique.mockResolvedValue(createMockChapter({
        chapterTreasuryBalance: 5000,
        autoInvestEnabled: true,
      }));
      mockDb.chapter.update.mockResolvedValue(createMockChapter({
        chapterTreasuryBalance: 6000,
      }));
      mockDb.treasuryTransaction.create.mockResolvedValue(createMockTransaction());

      const result = await service.depositToAave(
        TEST_CONSTANTS.DEPOSIT_AMOUNT
      );

      expectChapterFindUniqueCall({
        id: true,
        chapterTreasuryBalance: true,
        walletAddress: true,
        walletPrivateKey: true,
      });

      expectChapterUpdateCall({
        chapterTreasuryBalance: { decrement: TEST_CONSTANTS.DEPOSIT_AMOUNT },
      });

      expect(mockDb.treasuryTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          chapterId: TEST_CONSTANTS.CHAPTER_ID,
          type: TreasuryTransactionType.DEPOSIT,
          amount: TEST_CONSTANTS.DEPOSIT_AMOUNT,
          protocol: 'POLYGON',
          txHash: expect.stringMatching(/^0x[a-f0-9]{64}$/),
          metadata: expect.objectContaining({
            network: 'Polygon',
            token: 'USDC',
            processingTime: expect.any(String),
          }),
        }),
      });

      expect(result).toEqual({
        transaction: expect.objectContaining({
          id: 'tx-123',
          type: TreasuryTransactionType.DEPOSIT,
          amount: TEST_CONSTANTS.DEPOSIT_AMOUNT,
        }),
        txHash: expect.stringMatching(/^0x[a-f0-9]{64}$/),
        explorerUrl: expect.stringMatching(/^https:\/\/polygonscan\.com\/tx\/0x[a-f0-9]{64}$/),
      });
    });

    const testDepositErrors = [
      {
        name: 'should throw error if chapter not found',
        setup: () => mockDb.chapter.findUnique.mockResolvedValue(null),
        expectedError: 'Chapter not found',
      },
      {
        name: 'should throw error if wallet not configured',
        setup: () => mockDb.chapter.findUnique.mockResolvedValue(
          createMockChapter({ walletAddress: null, walletPrivateKey: null })
        ),
        expectedError: 'Chapter wallet not configured',
      },
      {
        name: 'should throw error if insufficient funds',
        setup: () => mockDb.chapter.findUnique.mockResolvedValue(
          createMockChapter({ chapterTreasuryBalance: 100 })
        ),
        expectedError: 'Insufficient funds in treasury',
      },
    ];

    testDepositErrors.forEach(({ name, setup, expectedError }) => {
      it(name, async () => {
        setup();
        await expect(service.depositToAave(TEST_CONSTANTS.DEPOSIT_AMOUNT))
          .rejects.toThrow(expectedError);
      });
    });
  });

  describe('toggleAutoInvest', () => {
    it('should enable auto-invest with strategy', async () => {
      const mockChapter = createMockChapter();
      const updatedChapter = createMockChapter({ autoInvestEnabled: true, autoInvestStrategy: 'balanced' });
      const mockTransaction = createMockTransaction({
        amount: 0,
        type: TreasuryTransactionType.AUTOINVEST,
        protocol: 'Morpheus',
      });
      
      mockDb.chapter.findUnique.mockResolvedValue(mockChapter);
      mockDb.chapter.update.mockResolvedValue(updatedChapter);
      mockDb.treasuryTransaction.create.mockResolvedValue(mockTransaction);

      const result = await service.toggleAutoInvest(true, 'balanced');

      expectChapterFindUniqueCall({ id: true });
      expectChapterUpdateCall({
        autoInvestEnabled: true,
        autoInvestStrategy: 'balanced',
      });
      expect(result).toEqual(updatedChapter);
    });

    it('should disable auto-invest', async () => {
      const mockChapter = createMockChapter();
      const updatedChapter = createMockChapter({ autoInvestEnabled: false, autoInvestStrategy: null });
      
      mockDb.chapter.findUnique.mockResolvedValue(mockChapter);
      mockDb.chapter.update.mockResolvedValue(updatedChapter);

      const result = await service.toggleAutoInvest(false);

      expectChapterUpdateCall({
        autoInvestEnabled: false,
        autoInvestStrategy: null,
      });
      expect(mockDb.treasuryTransaction.create).not.toHaveBeenCalled();
      expect(result).toEqual(updatedChapter);
    });
  });

  describe('setupChapterWallet', () => {
    it('should create new wallet if none exists', async () => {
      const mockChapter = createMockChapter({ walletAddress: null });
      
      mockDb.chapter.findUnique.mockResolvedValue(mockChapter);
      mockDb.chapter.update.mockResolvedValue(mockChapter);

      const result = await service.setupChapterWallet();

      expectChapterFindUniqueCall({ id: true, walletAddress: true });
      expect(result).toEqual({
        address: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        explorerUrl: expect.stringContaining('https://polygonscan.com/address/0x'),
      });
    });

    it('should return existing wallet if already configured', async () => {
      const mockChapter = createMockChapter();
      
      mockDb.chapter.findUnique.mockResolvedValue(mockChapter);

      const result = await service.setupChapterWallet();

      expect(mockDb.chapter.update).not.toHaveBeenCalled();
      expect(result).toEqual({
        address: TEST_CONSTANTS.WALLET_ADDRESS,
        explorerUrl: `https://polygonscan.com/address/${TEST_CONSTANTS.WALLET_ADDRESS}`,
      });
    });
  });

  describe('recordYieldEarning', () => {
    it('should record yield earning and update treasury', async () => {
      const mockChapter = createMockChapter();
      const mockTransaction = createMockTransaction({
        amount: TEST_CONSTANTS.YIELD_AMOUNT,
        type: TreasuryTransactionType.YIELD_EARNED,
        protocol: 'Aave',
      });
      
      mockDb.chapter.findUnique.mockResolvedValue(mockChapter);
      mockDb.treasuryTransaction.create.mockResolvedValue(mockTransaction);
      mockDb.chapter.update.mockResolvedValue(mockChapter);

      const result = await service.recordYieldEarning(TEST_CONSTANTS.YIELD_AMOUNT);

      expectChapterFindUniqueCall({ id: true });
      expectChapterUpdateCall({
        chapterTreasuryBalance: { increment: TEST_CONSTANTS.YIELD_AMOUNT },
        treasuryLastYield: TEST_CONSTANTS.YIELD_AMOUNT,
        treasuryLastYieldDate: expect.any(Date),
      });
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.chapter.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getTreasuryDetails()).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid chapter slug across all methods', async () => {
      mockDb.chapter.findUnique.mockResolvedValue(null);

      // Test methods without parameters
      await expect(service.getTreasuryDetails()).rejects.toThrow('Chapter not found');
      await expect(service.getTreasuryTransactions()).rejects.toThrow('Chapter not found');
      await expect(service.setupChapterWallet()).rejects.toThrow('Chapter not found');
      
      // Test methods with number parameter
      await expect(service.depositToAave(100)).rejects.toThrow('Chapter not found');
      await expect(service.recordYieldEarning(25)).rejects.toThrow('Chapter not found');
      
      // Test method with boolean parameter
      await expect(service.toggleAutoInvest(true)).rejects.toThrow('Chapter not found');
    });
  });
});