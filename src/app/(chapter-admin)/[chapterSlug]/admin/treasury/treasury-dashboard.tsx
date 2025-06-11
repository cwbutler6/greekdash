"use client";

import React, { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { JsonValue } from "@prisma/client/runtime/library";
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Wallet, Settings, BarChart3, Shield 
} from "lucide-react";
// formatCurrency is used in balance panel component
import { TreasuryBalancePanel } from "./components/treasury-balance-panel";
import { TreasuryTransactionsTable } from "./components/treasury-transactions-table";
import { TreasuryDepositForm } from "./components/treasury-deposit-form";
import { TreasuryWithdrawForm } from "./components/treasury-withdraw-form";
import { TreasuryAutoInvestSettings } from "./components/treasury-auto-invest-settings";
import { TreasuryTransactionType } from "@/generated/prisma";

/* Using type definitions for Treasury transactions */
interface TreasuryTransaction {
  id: string;
  amount: number;
  type: TreasuryTransactionType;
  txHash?: string | null;
  apy?: number | null;
  protocol?: string | null;
  createdAt: Date;
  metadata?: JsonValue; // Using JsonValue to match Prisma schema
  chapterId: string; // Added to match Prisma schema
}

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Simple loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
  </div>
);

interface TreasuryDashboardProps {
  chapterSlug: string;
  initialTreasuryData: {
    details: {
      id: string;
      name: string;
      chapterTreasuryBalance: number;
      autoInvestEnabled: boolean;
      autoInvestStrategy: string | null;
      walletAddress: string | null;
      treasuryLastYield: number | null;
      treasuryLastYieldDate: Date | null;
    };
    transactions: TreasuryTransaction[];
  };
}

export default function TreasuryDashboard({ 
  chapterSlug, 
  initialTreasuryData 
}: TreasuryDashboardProps) {
  // Using toast directly from sonner
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch treasury data
  const { data: treasuryData, isLoading } = useQuery({
    queryKey: ['treasury', chapterSlug],
    queryFn: async () => {
      const res = await fetch(`/api/treasury?chapterSlug=${chapterSlug}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch treasury data");
      }
      return res.json();
    },
    initialData: initialTreasuryData,
  });

  // Setup wallet mutation
  const setupWalletMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/treasury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterSlug,
          operation: 'setupWallet'
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to set up wallet");
      }
      
      return res.json();
    },
    onSuccess: () => {
      const refreshTreasuryData = () => {
        queryClient.invalidateQueries({queryKey: ['treasury', chapterSlug]});
      };
      refreshTreasuryData();
      toast.success("Wallet Created", {
        description: "Your chapter wallet has been successfully created",
      });
    },
    onError: (error) => {
      toast.error("Error", {
        description: (error as Error).message || "Failed to set up wallet",
      });
    },
  });

  const handleSetupWallet = () => {
    setupWalletMutation.mutate();
  };

  // Derived values
  const hasWallet = !!treasuryData?.details.walletAddress;
  const totalYieldEarned = treasuryData?.transactions
    .filter((tx: TreasuryTransaction) => tx.type === TreasuryTransactionType.YIELD_EARNED)
    .reduce((sum: number, tx: TreasuryTransaction) => sum + tx.amount, 0) || 0;
  
  // We can calculate this if needed in the future
  // const totalDeposited = treasuryData?.transactions
  //  .filter((tx: TreasuryTransaction) => tx.type === TreasuryTransactionType.DEPOSIT)
  //  .reduce((sum: number, tx: TreasuryTransaction) => sum + tx.amount, 0) || 0;
  
  const autoInvestEnabled = treasuryData?.details.autoInvestEnabled || false;
  const autoInvestStrategy = treasuryData?.details.autoInvestStrategy || "balanced";
  
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Treasury DeFi</h1>
        <p className="text-muted-foreground mt-2">
          Manage your chapter treasury and DeFi investments
        </p>
      </div>

      {!hasWallet && (
        <Alert className="bg-amber-50">
          <Shield className="h-4 w-4" />
          <AlertTitle>No wallet configured</AlertTitle>
          <AlertDescription>
            Your chapter needs a wallet address to use DeFi features.
            <Button 
              variant="outline" 
              onClick={handleSetupWallet} 
              disabled={setupWalletMutation.isPending}
              className="ml-4"
            >
              {setupWalletMutation.isPending ? "Creating..." : "Create Wallet"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deposit" disabled={!hasWallet}>Deposit</TabsTrigger>
          <TabsTrigger value="withdraw" disabled={!hasWallet}>Withdraw</TabsTrigger>
          <TabsTrigger value="auto-invest" disabled={!hasWallet}>Auto-Invest</TabsTrigger>
          <TabsTrigger value="transactions">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TreasuryBalancePanel 
              balance={treasuryData.details.chapterTreasuryBalance} 
              lastYield={treasuryData.details.treasuryLastYield}
              lastYieldDate={treasuryData.details.treasuryLastYieldDate}
              totalYield={totalYieldEarned}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>DeFi Status</span>
                  {autoInvestEnabled && (
                    <Badge variant="outline" className="bg-green-50">Enabled</Badge>
                  )}
                </CardTitle>
                <CardDescription>Auto-invest configuration</CardDescription>
              </CardHeader>
              <CardContent>
                {autoInvestEnabled ? (
                  <div className="space-y-2">
                    <p>Auto-invest is <span className="font-bold text-green-600">active</span></p>
                    <p>Strategy: <span className="font-medium capitalize">{autoInvestStrategy}</span></p>
                  </div>
                ) : (
                  <p>Auto-invest is <span className="font-bold text-amber-600">disabled</span></p>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setActiveTab("auto-invest")}
                  disabled={!hasWallet}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Auto-Invest
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wallet</CardTitle>
                <CardDescription>Chapter blockchain wallet</CardDescription>
              </CardHeader>
              <CardContent>
                {hasWallet ? (
                  <div className="space-y-2">
                    <p className="font-mono text-xs break-all">
                      {treasuryData.details.walletAddress}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      On Polygon network
                    </p>
                  </div>
                ) : (
                  <p>No wallet configured</p>
                )}
              </CardContent>
              <CardFooter>
                {!hasWallet && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleSetupWallet}
                    disabled={setupWalletMutation.isPending}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    {setupWalletMutation.isPending ? "Creating..." : "Create Wallet"}
                  </Button>
                )}
                {hasWallet && (
                  <a 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground px-4 py-2 mt-2" 
                    href={`https://polygonscan.com/address/${treasuryData.details.walletAddress}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View on Polygonscan
                  </a>
                )}
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Last {Math.min(treasuryData.transactions.length, 5)} transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TreasuryTransactionsTable 
                  transactions={treasuryData.transactions.slice(0, 5)} 
                />
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("transactions")}
                >
                  <LineChart className="h-4 w-4 mr-2" />
                  View All Transactions
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Deposit Tab */}
        <TabsContent value="deposit">
          <Card>
            <CardHeader>
              <CardTitle>Deposit to DeFi</CardTitle>
              <CardDescription>
                Deposit idle funds into Aave lending protocol to earn interest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TreasuryDepositForm 
                chapterSlug={chapterSlug}
                currentBalance={treasuryData.details.chapterTreasuryBalance}
                onSuccess={() => {
                  const refreshTreasuryData = () => {
                    queryClient.invalidateQueries({queryKey: ['treasury', chapterSlug]});
                  };
                  refreshTreasuryData();
                  setActiveTab("overview");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdraw Tab */}
        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw from DeFi</CardTitle>
              <CardDescription>
                Withdraw funds from Aave lending protocol back to treasury
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TreasuryWithdrawForm 
                chapterSlug={chapterSlug}
                onSuccess={() => {
                  const refreshTreasuryData = () => {
                    queryClient.invalidateQueries({queryKey: ['treasury', chapterSlug]});
                  };
                  refreshTreasuryData();
                  setActiveTab("overview");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Invest Tab */}
        <TabsContent value="auto-invest">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Invest Settings</CardTitle>
              <CardDescription>
                Enable Morpheus to automatically optimize your treasury yield
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TreasuryAutoInvestSettings 
                chapterSlug={chapterSlug}
                initialEnabled={autoInvestEnabled}
                initialStrategy={autoInvestStrategy as "balanced" | "conservative" | "aggressive"}
                onSuccess={() => {
                  const refreshTreasuryData = () => {
                    queryClient.invalidateQueries({queryKey: ['treasury', chapterSlug]});
                  };
                  refreshTreasuryData();
                  setActiveTab("overview");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Complete history of treasury transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TreasuryTransactionsTable 
                transactions={treasuryData.transactions} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
