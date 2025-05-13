# Event Management System for GreekDash

## Overview

Implement a comprehensive event management system for GreekDash chapters. This includes features for event creation, RSVP handling, attendance tracking, calendar views, and analytics. All functionalities should be scoped per chapter and accessible through the admin dashboard.

---

## Pages to Scaffold

### 1. Create/Edit Event Page

**Route:** `/[chapterSlug]/admin/events/new` and `/[chapterSlug]/admin/events/[eventId]/edit`

**Features:**
- Form to create or edit events with fields:
  - Title
  - Description
  - Location
  - Start and End Date/Time
  - Capacity (optional)
  - Recurrence options (e.g., weekly, monthly)
- Validation using Zod
- Utilize shadcn/ui components for form inputs

**Server Actions:**
- `createEvent`
- `updateEvent`

---

### 2. Event Details Page

**Route:** `/[chapterSlug]/events/[eventId]`

**Features:**
- Display event details
- RSVP buttons: Going, Not Going, Maybe
- Show list of attendees (if public)
- Admin controls for editing or deleting the event

**Server Actions:**
- `rsvpToEvent`
- `cancelRsvp`

---

### 3. Event Calendar Page

**Route:** `/[chapterSlug]/events`

**Features:**
- Monthly calendar view displaying upcoming events
- Ability to filter events by category or tag
- Click on a date to view events scheduled for that day

**Components:**
- Calendar component using shadcn/ui
- Event list for selected date

---

### 4. Attendance Tracking Page

**Route:** `/[chapterSlug]/admin/events/[eventId]/attendance`

**Features:**
- List of RSVPed members
- Check-in functionality (e.g., checkbox or QR code scanning)
- Export attendance list as CSV

**Server Actions:**
- `checkInMember`
- `exportAttendance`

---

### 5. Event Analytics Dashboard

**Route:** `/[chapterSlug]/admin/events/analytics`

**Features:**
- Graphs showing:
  - Number of events over time
  - Average attendance
  - RSVP rates
- Use charting library compatible with shadcn/ui

**Data Fetching:**
- Aggregate data per chapter
- Display insights for admins

---

## Database Models (Prisma)

```prisma
model Event {
  id          Int       @id @default(autoincrement())
  chapter     Chapter   @relation(fields: [chapterId], references: [id])
  chapterId   Int
  title       String
  description String
  location    String
  startTime   DateTime
  endTime     DateTime
  capacity    Int?
  recurrence  String?
  rsvps       RSVP[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model RSVP {
  id        Int      @id @default(autoincrement())
  event     Event    @relation(fields: [eventId], references: [id])
  eventId   Int
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  status    RSVPStatus
  checkedIn Boolean  @default(false)
  createdAt DateTime @default(now())
}

enum RSVPStatus {
  GOING
  NOT_GOING
  MAYBE
}
