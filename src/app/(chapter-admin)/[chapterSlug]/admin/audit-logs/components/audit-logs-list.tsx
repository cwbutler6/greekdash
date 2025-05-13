import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { AuditFilters } from "./audit-filters";
import { Pagination } from "@/components/ui/pagination";
import { formatDistanceToNow } from "date-fns";
import { AuditLogDetails } from "./audit-log-details";

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

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface AuditLogsListProps {
  auditLogsData: {
    data: AuditLog[];
    pagination: PaginationInfo;
  };
  chapterSlug: string;
}

export function AuditLogsList({ auditLogsData, chapterSlug }: AuditLogsListProps) {
  const { data: auditLogs, pagination } = auditLogsData;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AuditFilters chapterSlug={chapterSlug} />
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
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
                        </TableCell>
                        <TableCell>
                          <span className="whitespace-nowrap">
                            {formatActionLabel(log.action)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="whitespace-nowrap">
                            {formatTargetType(log.targetType)}
                            {log.targetId ? ` #${truncateId(log.targetId)}` : ""}
                          </span>
                        </TableCell>
                        <TableCell>
                          <AuditLogDetails log={log} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                baseUrl={`/${chapterSlug}/admin/audit-logs`}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
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

function truncateId(id: string): string {
  return id.length > 8 ? id.substring(0, 8) : id;
}
