import * as z from "zod";
import {
  PlanType,
  SubscriptionStatus,
  MembershipRole,
  EventStatus,
  RSVPStatus
} from "@/generated/prisma";

// These are imported directly in their respective validation files
// so we don't need to re-export them from here

// Re-export all schema definitions from validation files
export * from "@/lib/validations/finance";
export * from "@/lib/validations/event";
export * from "@/lib/validations/treasury";

// This ensures we re-export the enums used by these schemas too
export { TransactionType, ExpenseStatus, BudgetStatus } from "@/generated/prisma";

// Chapter schemas
export const chapterSchema = z.object({
  name: z.string().min(1, "Chapter name is required"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/i, "Slug can only contain letters, numbers, and hyphens"),
  joinCode: z.string().uuid().optional(),
  publicInfo: z.string().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  schoolName: z.string().optional().nullable(),
});

export type ChapterFormData = z.infer<typeof chapterSchema>;

// User schemas
export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  image: z.string().url().optional().nullable(),
});

export type UserFormData = z.infer<typeof userSchema>;

// Membership schemas
export const membershipSchema = z.object({
  role: z.nativeEnum(MembershipRole).default("MEMBER"),
  userId: z.string().cuid("Invalid user ID"),
  chapterId: z.string().cuid("Invalid chapter ID"),
});

export type MembershipFormData = z.infer<typeof membershipSchema>;

// Subscription schemas
export const subscriptionSchema = z.object({
  plan: z.nativeEnum(PlanType).default("FREE"),
  status: z.nativeEnum(SubscriptionStatus).default("ACTIVE"),
  stripeSubscriptionId: z.string().optional().nullable(),
  chapterId: z.string().cuid("Invalid chapter ID"),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

// Invite schemas
export const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(MembershipRole).default("MEMBER"),
  chapterId: z.string().cuid("Invalid chapter ID"),
});

export type InviteFormData = z.infer<typeof inviteSchema>;

// Event schemas
export const eventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional().nullable(),
  location: z.string().min(1, "Event location is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  capacity: z.number().int().positive().optional().nullable(),
  isPublic: z.boolean().default(true),
  status: z.nativeEnum(EventStatus).default("UPCOMING"),
  chapterId: z.string().cuid("Invalid chapter ID"),
});

export type EventFormData = z.infer<typeof eventSchema>;

// RSVP schemas
export const rsvpSchema = z.object({
  status: z.nativeEnum(RSVPStatus),
  eventId: z.string().cuid("Invalid event ID"),
  userId: z.string().cuid("Invalid user ID"),
});

export type RsvpFormData = z.infer<typeof rsvpSchema>;

// Profile schemas
export const profileSchema = z.object({
  phone: z.string().optional().nullable(),
  phoneVerified: z.boolean().default(false),
  smsEnabled: z.boolean().default(true),
  userId: z.string().cuid("Invalid user ID"),
  chapterId: z.string().cuid("Invalid chapter ID"),
  membershipId: z.string().cuid("Invalid membership ID"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Contact message schema
export const contactMessageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  chapterId: z.string().cuid("Invalid chapter ID"),
});

export type ContactMessageFormData = z.infer<typeof contactMessageSchema>;

// File schema
export const fileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  url: z.string().url("Invalid URL"),
  sizeInBytes: z.number().int().positive(),
  mimeType: z.string(),
  chapterId: z.string().cuid("Invalid chapter ID"),
  uploaderId: z.string().cuid("Invalid uploader ID"),
});

export type FileFormData = z.infer<typeof fileSchema>;
