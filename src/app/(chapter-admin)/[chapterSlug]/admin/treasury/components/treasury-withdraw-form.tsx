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
import { treasuryWithdrawSchema, TreasuryWithdrawInput } from "@/lib/validations/treasury";

interface TreasuryWithdrawFormProps {
  chapterSlug: string;
  onSuccess: () => void;
}

export function TreasuryWithdrawForm({
  chapterSlug,
  onSuccess,
}: TreasuryWithdrawFormProps) {
  // Using sonner toast directly
  // No need for local loading state as we're using mutation state
  
  const form = useForm<TreasuryWithdrawInput>({
    resolver: zodResolver(treasuryWithdrawSchema),
    defaultValues: {
      amount: 0,
      chapterSlug,
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: TreasuryWithdrawInput) => {
      const res = await fetch('/api/treasury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          operation: 'withdraw',
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to withdraw funds");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast.success(`$${form.getValues().amount} has been withdrawn from your treasury`);
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to withdraw funds");
    },
  });

  const onSubmit = (data: TreasuryWithdrawInput) => {
    withdrawMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-orange-50">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>About Withdrawals</AlertTitle>
        <AlertDescription>
          Withdrawing funds from Aave will transfer them back to your chapter treasury.
          Note that you will stop earning interest on the withdrawn amount.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Withdrawal Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Enter the amount you want to withdraw from Aave
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={withdrawMutation.isPending || !form.formState.isValid}
          >
            {withdrawMutation.isPending ? "Processing..." : "Withdraw Funds"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
