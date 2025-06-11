"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatters";
import { TrendingUp } from "lucide-react";

interface TreasuryBalancePanelProps {
  balance: number;
  lastYield: number | null;
  lastYieldDate: Date | null;
  totalYield: number;
}

export function TreasuryBalancePanel({
  balance,
  lastYield,
  lastYieldDate,
  totalYield,
}: TreasuryBalancePanelProps) {
  // Format the last yield date
  const formattedLastYieldDate = lastYieldDate
    ? new Date(lastYieldDate).toLocaleDateString()
    : "N/A";

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Treasury Balance
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold">
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available funds in treasury
            </p>
          </div>
          
          <div className="border-t pt-3 grid grid-cols-2 gap-1">
            <div>
              <p className="text-xs text-muted-foreground">Last Yield</p>
              <p className="font-medium">
                {lastYield ? formatCurrency(lastYield) : "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastYield ? `on ${formattedLastYieldDate}` : "No yield yet"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Yield</p>
              <p className="font-medium">
                {formatCurrency(totalYield)}
              </p>
              <p className="text-xs text-muted-foreground">
                Lifetime earnings
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
