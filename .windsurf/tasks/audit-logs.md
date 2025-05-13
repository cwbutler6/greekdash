# Implement Audit Logging for Member Activity Tracking

## Overview

Develop a robust audit logging system to monitor user and member activities within GreekDash. This includes tracking events such as payments, profile updates, logins, RSVPs, and administrative actions. The system should provide administrators with a clear and accessible dashboard to review and analyze these activities.

---

## Database Models (Prisma)

### AuditLog

```prisma
model AuditLog {
  id         Int      @id @default(autoincrement())
  user       User     @relation(fields: [userId], references: [id])
  userId     Int
  action     String
  targetType String
  targetId   Int?
  metadata   Json?
  createdAt  DateTime @default(now())
}
````

* **userId**: References the user performing the action.
* **action**: Describes the action taken (e.g., "payment\_made", "profile\_updated").
* **targetType** and **targetId**: Identify the entity affected by the action.
* **metadata**: Stores additional context in JSON format.

---

## Server Actions

Create a utility function to log audit entries:

```ts
// lib/audit.ts
import { prisma } from '@/lib/prisma';

export async function logAuditEntry({
  userId,
  action,
  targetType,
  targetId,
  metadata,
}: {
  userId: number;
  action: string;
  targetType: string;
  targetId?: number;
  metadata?: Record<string, any>;
}) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      targetType,
      targetId,
      metadata,
    },
  });
}
```

Integrate `logAuditEntry` into existing server actions to record significant events.

---

## Admin Dashboard Page

### Route

`/[chapterSlug]/admin/audit-logs`

### Features

* Display a paginated list of audit logs.
* Filter logs by user, action type, date range, and target entity.
* Search functionality for specific keywords within metadata.
* Utilize shadcn/ui components for a responsive and user-friendly interface.

---

## Components

* **AuditLogTable**: Displays audit logs in a tabular format with sorting and filtering capabilities.
* **AuditLogFilters**: Provides UI controls for filtering logs based on various criteria.
* **AuditLogDetailsModal**: Shows detailed information about a specific audit log entry.

---

## Constraints

* Ensure that only users with administrative privileges can access the audit logs dashboard.
* Implement server-side validation and error handling for all audit-related operations.
* Maintain performance and scalability when dealing with large volumes of audit data.

---

## Output

* Prisma model for `AuditLog`.
* Utility function `logAuditEntry` in `lib/audit.ts`.
* Admin dashboard page at `app/[chapterSlug]/admin/audit-logs/page.tsx`.
* Associated components in `components/audit-logs/`.

---
