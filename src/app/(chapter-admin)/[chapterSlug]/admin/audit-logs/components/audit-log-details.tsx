'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import Image from "next/image";
// Removed specific type imports to make it compatible with runtime data
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface AuditLogUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  user: AuditLogUser;
}

interface AuditLogDetailsProps {
  log: AuditLog;
}

export function AuditLogDetails({ log }: AuditLogDetailsProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Eye className="h-4 w-4 mr-1" />
        Details
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Activity recorded on {new Date(log.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Action</span>
                <Badge variant="outline" className="mt-1 justify-start">
                  {formatActionLabel(log.action)}
                </Badge>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Target Type</span>
                <Badge variant="outline" className="mt-1 justify-start">
                  {formatTargetType(log.targetType)}
                </Badge>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Target ID</span>
                <span className="text-sm truncate font-mono">
                  {log.targetId || 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Performed By</span>
              <div className="flex items-center gap-2 mt-1">
                {log.user.image && (
                  <Image
                    src={log.user.image}
                    alt={log.user.name || "User"}
                    className="w-8 h-8 rounded-full object-cover"
                    width={32}
                    height={32}
                  />
                )}
                <div>
                  <div className="font-medium">{log.user.name || "Unknown User"}</div>
                  <div className="text-xs text-muted-foreground">{log.user.email}</div>
                </div>
              </div>
            </div>
            
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  Additional Details
                </span>
                <div className="p-3 bg-muted rounded-md mt-1 overflow-auto max-h-52">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper functions to format the display of audit log data
function formatActionLabel(action: string): string {
  return action
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatTargetType(targetType: string): string {
  return targetType.charAt(0).toUpperCase() + targetType.slice(1);
}
