"use client";

import React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Wallet } from "lucide-react";

interface TreasuryWalletSetupProps {
  chapterSlug: string;
  onSuccess: () => void;
}

export function TreasuryWalletSetup({
  chapterSlug,
  onSuccess,
}: TreasuryWalletSetupProps) {
  // Using sonner toast directly

  const setupWalletMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/treasury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterSlug,
          operation: 'setupWallet',
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to set up wallet");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast.success("Your treasury wallet is now ready to use");
      onSuccess();
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to set up wallet");
    },
  });

  return (
    <div className="space-y-6">
      <Alert className="bg-amber-50">
        <Shield className="h-4 w-4" />
        <AlertTitle>Create Your Chapter Wallet</AlertTitle>
        <AlertDescription>
          To use DeFi features, your chapter needs a blockchain wallet. 
          This wallet will be created on the Polygon network and securely managed by GreekDash.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col items-center justify-center space-y-4 p-6 border rounded-lg text-center">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-xl font-semibold">No Wallet Configured</h3>
        <p className="text-sm text-muted-foreground">
          Your chapter needs a blockchain wallet to deposit into DeFi protocols.
          Creating a wallet is free and only takes a few seconds.
        </p>
        
        <Button 
          onClick={() => setupWalletMutation.mutate()}
          disabled={setupWalletMutation.isPending}
          className="mt-4"
        >
          {setupWalletMutation.isPending ? "Creating..." : "Create Wallet"}
        </Button>
      </div>
    </div>
  );
}
