import { format, addDays, eachDayOfInterval, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

/**
 * Convert minutes from midnight to time string (e.g., 960 -> "16:00")
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Convert time string to minutes from midnight (e.g., "16:00" -> 960)
 */
export function timeStringToMinutes(time: string): number {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

/**
 * Format minutes for display (e.g., 960 -> "16:00" or "4:00 PM")
 */
export function formatTimeForDisplay(
  minutes: number,
  format: "12h" | "24h" = "24h"
): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (format === "24h") {
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

/**
 * Generate time slots between start and end time
 */
export function generateTimeSlots(
  startTime: number,
  endTime: number,
  duration: number
): number[] {
  const slots: number[] = [];
  for (let time = startTime; time < endTime; time += duration) {
    slots.push(time);
  }
  return slots;
}

/**
 * Generate array of dates between start and end date
 */
export function generateDateRange(startDate: Date, endDate: Date): Date[] {
  return eachDayOfInterval({ start: startDate, end: endDate });
}

/**
 * Format date for display in Polish
 */
export function formatDateForDisplay(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE, d MMMM", { locale: pl });
}

/**
 * Format short date (e.g., "Pon 15.01")
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEE d.MM", { locale: pl });
}

/**
 * Get date string in ISO format (YYYY-MM-DD)
 */
export function getDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Create slot key from date and time
 */
export function createSlotKey(date: Date | string, time: number): string {
  const dateStr = typeof date === "string" ? date : getDateKey(date);
  return `${dateStr}:${time}`;
}

/**
 * Parse slot key to get date and time
 */
export function parseSlotKey(key: string): { date: string; time: number } {
  const [date, timeStr] = key.split(":");
  return { date, time: parseInt(timeStr, 10) };
}

/**
 * Check if two date ranges overlap
 */
export function dateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1;
}

/**
 * Get the end time of a slot based on duration
 */
export function getSlotEndTime(startTime: number, duration: number): number {
  return startTime + duration;
}
