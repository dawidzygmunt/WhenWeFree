export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startDate: Date | string;
  endDate: Date | string;
  startTime: number;
  endTime: number;
  slotDuration: number;
  timezone: string;
  createdAt: Date | string;
  creatorId: string;
}

export interface Participant {
  id: string;
  name: string;
  eventId: string;
  createdAt: Date | string;
}

export interface Availability {
  id: string;
  date: Date | string;
  startTime: number;
  endTime: number;
  participantId: string;
}

export interface TimeSlot {
  date: string; // YYYY-MM-DD format
  time: number; // Minutes from midnight
}

export interface AvailabilityHeatmapData {
  [dateKey: string]: {
    [timeSlot: number]: string[]; // Array of participant IDs
  };
}

export interface EventWithParticipants extends Event {
  participants: Participant[];
}

export interface ParticipantWithAvailability extends Participant {
  availabilities: Availability[];
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime: number;
  endTime: number;
  slotDuration?: number;
  timezone?: string;
}

export interface CreateParticipantInput {
  name: string;
  eventSlug: string;
}

export interface UpdateAvailabilityInput {
  participantId: string;
  slots: TimeSlot[];
}

export interface EventResponse {
  event: Event;
  participants: Participant[];
  availability: AvailabilityHeatmapData;
  totalParticipants: number;
}
