// Type declarations for treasury components

import React from 'react';

// TreasuryBalancePanel component
export interface TreasuryBalancePanelProps {
  balance: number;
  lastYield?: number | null;
  lastYieldDate?: Date | null;
  totalYield: number;
}

export const TreasuryBalancePanel: React.FC<TreasuryBalancePanelProps>;

// TreasuryTransactionsTable component
export interface TreasuryTransaction {
  id: string;
  amount: number;
  type: string;
  txHash?: string | null;
  apy?: number | null;
  protocol?: string | null;
  createdAt: Date;
}

export interface TreasuryTransactionsTableProps {
  transactions: TreasuryTransaction[];
}

export const TreasuryTransactionsTable: React.FC<TreasuryTransactionsTableProps>;

// TreasuryDepositForm component
export interface TreasuryDepositFormProps {
  chapterSlug: string;
  currentBalance: number;
  onSuccess: () => void;
}

export const TreasuryDepositForm: React.FC<TreasuryDepositFormProps>;

// TreasuryWithdrawForm component
export interface TreasuryWithdrawFormProps {
  chapterSlug: string;
  onSuccess: () => void;
}

export const TreasuryWithdrawForm: React.FC<TreasuryWithdrawFormProps>;

// TreasuryAutoInvestSettings component
export interface TreasuryAutoInvestSettingsProps {
  chapterSlug: string;
  initialEnabled: boolean;
  initialStrategy: "balanced" | "conservative" | "aggressive";
  onSuccess: () => void;
}

export const TreasuryAutoInvestSettings: React.FC<TreasuryAutoInvestSettingsProps>;

// TreasuryWalletSetup component
export interface TreasuryWalletSetupProps {
  chapterSlug: string;
  onSuccess: () => void;
}

export const TreasuryWalletSetup: React.FC<TreasuryWalletSetupProps>;
