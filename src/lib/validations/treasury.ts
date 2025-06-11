import { z } from "zod";

export const treasuryDepositSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  chapterSlug: z.string(),
});

export const treasuryWithdrawSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  chapterSlug: z.string(),
});

export const treasuryAutoInvestSchema = z.object({
  enabled: z.boolean(),
  strategy: z.enum(["balanced", "conservative", "aggressive"]),
  chapterSlug: z.string(),
});

export type TreasuryDepositInput = z.infer<typeof treasuryDepositSchema>;
export type TreasuryWithdrawInput = z.infer<typeof treasuryWithdrawSchema>;
export type TreasuryAutoInvestInput = z.infer<typeof treasuryAutoInvestSchema>;

export const strategyDescriptions = {
  balanced: "Moderate risk with a mix of lending protocols and stablecoin pairs",
  conservative: "Low risk with focus on established lending protocols",
  aggressive: "Higher risk with yield farming and liquidity provision",
};
