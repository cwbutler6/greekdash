import { z } from "zod";

export const eventFormSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100, { message: "Title cannot exceed 100 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(5000, { message: "Description cannot exceed 5000 characters" }),
  location: z
    .string()
    .min(3, { message: "Location must be at least 3 characters" })
    .max(200, { message: "Location cannot exceed 200 characters" }),
  startDate: z.coerce
    .date({ required_error: "Start date is required" })
    .refine((date) => date > new Date(), {
      message: "Start date must be in the future",
    }),
  endDate: z.coerce
    .date({ required_error: "End date is required" })
    .refine((date) => date > new Date(), {
      message: "End date must be in the future",
    }),
  capacity: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .transform((val) => (val === 0 ? null : val)),
  isPublic: z.boolean().default(true),
});

// Add refinement to ensure endDate is after startDate
export const eventFormSchemaWithRefinement = eventFormSchema.refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

// Type inferred from the schema
export type EventFormValues = z.infer<typeof eventFormSchema>;

export const rsvpSchema = z.object({
  status: z.enum(["GOING", "NOT_GOING", "MAYBE"], {
    required_error: "RSVP status is required",
  }),
});

export type RsvpFormValues = z.infer<typeof rsvpSchema>;
