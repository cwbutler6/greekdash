"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { TreasuryTransaction, TreasuryTransactionType } from "@/generated/prisma";

interface TreasuryTransactionsTableProps {
  transactions: TreasuryTransaction[];
}

export function TreasuryTransactionsTable({ transactions }: TreasuryTransactionsTableProps) {
  if (transactions.length === 0) {
    return <p className="text-muted-foreground text-sm">No transactions found</p>;
  }

  const getTransactionTypeColor = (type: TreasuryTransactionType) => {
    switch (type) {
      case TreasuryTransactionType.DEPOSIT:
        return "bg-blue-50 text-blue-700 hover:bg-blue-100";
      case TreasuryTransactionType.WITHDRAW:
        return "bg-orange-50 text-orange-700 hover:bg-orange-100";
      case TreasuryTransactionType.AUTOINVEST:
        return "bg-purple-50 text-purple-700 hover:bg-purple-100";
      case TreasuryTransactionType.YIELD_EARNED:
        return "bg-green-50 text-green-700 hover:bg-green-100";
      default:
        return "bg-gray-50 text-gray-700 hover:bg-gray-100";
    }
  };

  const formatTransactionType = (type: TreasuryTransactionType) => {
    switch (type) {
      case TreasuryTransactionType.DEPOSIT:
        return "Deposit";
      case TreasuryTransactionType.WITHDRAW:
        return "Withdraw";
      case TreasuryTransactionType.AUTOINVEST:
        return "Auto-Invest";
      case TreasuryTransactionType.YIELD_EARNED:
        return "Yield Earned";
      default:
        return type;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Protocol</TableHead>
          <TableHead className="text-right">Transaction</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">
              {new Date(transaction.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge 
                variant="outline"
                className={getTransactionTypeColor(transaction.type)}
              >
                {formatTransactionType(transaction.type)}
              </Badge>
            </TableCell>
            <TableCell>
              {transaction.type === TreasuryTransactionType.AUTOINVEST ? (
                "-"
              ) : (
                formatCurrency(transaction.amount)
              )}
            </TableCell>
            <TableCell>{transaction.protocol || "-"}</TableCell>
            <TableCell className="text-right">
              {transaction.txHash ? (
                <a 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 py-2 px-3"
                  href={`https://polygonscan.com/tx/${transaction.txHash}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </a>
              ) : (
                "-"
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
