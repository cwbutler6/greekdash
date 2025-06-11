"use client";

import React from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { treasuryDepositSchema, TreasuryDepositInput } from "@/lib/validations/treasury";

interface TreasuryDepositFormProps {
  chapterSlug: string;
  currentBalance: number;
  onSuccess: () => void;
}

export function TreasuryDepositForm({
  chapterSlug,
  currentBalance,
  onSuccess,
}: TreasuryDepositFormProps) {
  // Using sonner toast directly
  
  const form = useForm<TreasuryDepositInput>({
    resolver: zodResolver(treasuryDepositSchema),
    defaultValues: {
      amount: 0,
      chapterSlug,
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: TreasuryDepositInput) => {
      const res = await fetch('/api/treasury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          operation: 'deposit',
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to deposit funds");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast.success(`$${form.getValues().amount} has been deposited into Aave`);
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to deposit funds");
    },
  });

  const onSubmit = (data: TreasuryDepositInput) => {
    depositMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>About DeFi Deposits</AlertTitle>
        <AlertDescription>
          Depositing funds to Aave will earn interest on your idle treasury balance.
          Current APY is approximately 3-5% for stablecoin deposits.
        </AlertDescription>
      </Alert>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Available Balance</p>
          <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deposit Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Enter the amount you want to deposit into Aave
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={depositMutation.isPending || !form.formState.isValid || form.getValues().amount > currentBalance}
          >
            {depositMutation.isPending ? "Processing..." : "Deposit Funds"}
          </Button>
          
          {form.getValues().amount > currentBalance && (
            <p className="text-sm text-red-500 mt-2">
              Amount exceeds available balance
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}
