import { z } from "zod";

export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, "Tytuł jest wymagany")
    .max(100, "Tytuł może mieć maksymalnie 100 znaków"),
  description: z
    .string()
    .max(500, "Opis może mieć maksymalnie 500 znaków")
    .optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Nieprawidłowa data początkowa",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Nieprawidłowa data końcowa",
  }),
  startTime: z
    .number()
    .min(0, "Godzina musi być między 0 a 1439")
    .max(1439, "Godzina musi być między 0 a 1439"),
  endTime: z
    .number()
    .min(0, "Godzina musi być między 0 a 1439")
    .max(1439, "Godzina musi być między 0 a 1439"),
  slotDuration: z.number().refine((val) => [15, 30, 60].includes(val), {
    message: "Czas trwania slotu musi wynosić 15, 30 lub 60 minut",
  }).optional(),
  timezone: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: "Data końcowa musi być późniejsza lub równa dacie początkowej",
  path: ["endDate"],
}).refine((data) => {
  return data.startTime < data.endTime;
}, {
  message: "Godzina końcowa musi być późniejsza niż godzina początkowa",
  path: ["endTime"],
});

export const createParticipantSchema = z.object({
  name: z
    .string()
    .min(1, "Imię jest wymagane")
    .max(50, "Imię może mieć maksymalnie 50 znaków")
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9\s-]+$/, "Imię zawiera niedozwolone znaki"),
});

export const timeSlotSchema = z.object({
  date: z.string().refine((date) => /^\d{4}-\d{2}-\d{2}$/.test(date), {
    message: "Data musi być w formacie YYYY-MM-DD",
  }),
  time: z.number().min(0).max(1439),
});

export const updateAvailabilitySchema = z.object({
  slots: z.array(timeSlotSchema),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
