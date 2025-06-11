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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LightbulbIcon } from "lucide-react";
import {
  treasuryAutoInvestSchema,
  TreasuryAutoInvestInput,
  strategyDescriptions,
} from "@/lib/validations/treasury";

interface TreasuryAutoInvestSettingsProps {
  chapterSlug: string;
  initialEnabled: boolean;
  initialStrategy: "balanced" | "conservative" | "aggressive";
  onSuccess: () => void;
}

export function TreasuryAutoInvestSettings({
  chapterSlug,
  initialEnabled = false,
  initialStrategy = "balanced",
  onSuccess,
}: TreasuryAutoInvestSettingsProps) {
  // Using sonner toast directly

  const form = useForm<TreasuryAutoInvestInput>({
    resolver: zodResolver(treasuryAutoInvestSchema),
    defaultValues: {
      enabled: initialEnabled,
      strategy: initialStrategy,
      chapterSlug,
    },
  });

  const autoInvestMutation = useMutation({
    mutationFn: async (data: TreasuryAutoInvestInput) => {
      const res = await fetch("/api/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterSlug: data.chapterSlug,
          operation: "autoInvest",
          enabled: data.enabled,
          strategy: data.strategy,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update auto-invest settings");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Auto-invest settings have been updated");
      onSuccess();
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to update settings");
    },
  });

  const onSubmit = (data: TreasuryAutoInvestInput) => {
    autoInvestMutation.mutate(data);
  };

  // Get the currently selected strategy for description display
  const selectedStrategy = form.watch("strategy");
  const isEnabled = form.watch("enabled");

  return (
    <div className="space-y-6">
      <Alert className="bg-purple-50">
        <LightbulbIcon className="h-4 w-4" />
        <AlertTitle>About Auto-Invest</AlertTitle>
        <AlertDescription>
          Morpheus auto-invest uses AI to optimize your treasury yield
          by automatically allocating funds across different DeFi protocols.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Auto-Invest</FormLabel>
                  <FormDescription>
                    Enable Morpheus to optimize your treasury yield
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {isEnabled && (
            <FormField
              control={form.control}
              name="strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strategy</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a strategy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {strategyDescriptions[selectedStrategy]}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={autoInvestMutation.isPending}
          >
            {autoInvestMutation.isPending
              ? "Updating..."
              : "Save Auto-Invest Settings"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
