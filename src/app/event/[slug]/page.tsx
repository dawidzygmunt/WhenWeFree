"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TimeGrid } from "@/components/availability/time-grid";
import { AvailabilityLegend } from "@/components/availability/availability-legend";
import { ParticipantList } from "@/components/availability/participant-list";
import {
  Calendar,
  Clock,
  Loader2,
  Users,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { formatTimeForDisplay } from "@/lib/time-utils";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface TimeSlot {
  date: string;
  time: number;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  startTime: number;
  endTime: number;
  slotDuration: number;
  timezone: string;
}

interface Participant {
  id: string;
  name: string;
}

interface EventData {
  event: Event;
  participants: Participant[];
  availability: Record<string, Record<number, string[]>>;
  totalParticipants: number;
}

export default function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Participant state
  const [participantName, setParticipantName] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [joiningEvent, setJoiningEvent] = useState(false);

  // Availability state
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit");

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${resolvedParams.slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Wydarzenie nie zostało znalezione");
          } else {
            setError("Wystąpił błąd podczas pobierania wydarzenia");
          }
          return;
        }
        const data = await response.json();
        setEventData(data);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Wystąpił błąd podczas pobierania wydarzenia");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [resolvedParams.slug]);

  // Check for saved participant in localStorage
  useEffect(() => {
    if (!eventData) return;

    const savedParticipant = localStorage.getItem(
      `participant_${eventData.event.id}`
    );
    if (savedParticipant) {
      const { id, name, slots } = JSON.parse(savedParticipant);
      setParticipantId(id);
      setParticipantName(name);
      setSelectedSlots(slots || []);
    }
  }, [eventData]);

  // Join event
  const handleJoinEvent = async () => {
    if (!participantName.trim()) {
      toast.error("Podaj swoje imię");
      return;
    }

    setJoiningEvent(true);

    try {
      const response = await fetch(
        `/api/events/${resolvedParams.slug}/participants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: participantName.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd");
      }

      setParticipantId(data.participant.id);

      // Load existing availability if returning participant
      if (data.participant.availabilities?.length > 0) {
        const slots = data.participant.availabilities.map(
          (a: { date: string; startTime: number }) => ({
            date: a.date,
            time: a.startTime,
          })
        );
        setSelectedSlots(slots);
      }

      // Save to localStorage
      localStorage.setItem(
        `participant_${eventData?.event.id}`,
        JSON.stringify({
          id: data.participant.id,
          name: participantName.trim(),
          slots: data.participant.availabilities?.map(
            (a: { date: string; startTime: number }) => ({
              date: a.date,
              time: a.startTime,
            })
          ) || [],
        })
      );

      // Refresh event data
      const eventResponse = await fetch(`/api/events/${resolvedParams.slug}`);
      const eventDataNew = await eventResponse.json();
      setEventData(eventDataNew);

      toast.success("Dołączyłeś do wydarzenia!");
    } catch (err) {
      console.error("Error joining event:", err);
      toast.error(
        err instanceof Error ? err.message : "Nie udało się dołączyć"
      );
    } finally {
      setJoiningEvent(false);
    }
  };

  // Save availability (debounced)
  const saveAvailability = useCallback(
    async (slots: TimeSlot[]) => {
      if (!participantId) return;

      setSaving(true);

      try {
        const response = await fetch(
          `/api/events/${resolvedParams.slug}/availability`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participantId,
              slots,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        setLastSaved(new Date());

        // Update localStorage
        localStorage.setItem(
          `participant_${eventData?.event.id}`,
          JSON.stringify({
            id: participantId,
            name: participantName,
            slots,
          })
        );

        // Refresh event data for heatmap
        const eventResponse = await fetch(`/api/events/${resolvedParams.slug}`);
        const eventDataNew = await eventResponse.json();
        setEventData(eventDataNew);
      } catch (err) {
        console.error("Error saving availability:", err);
        toast.error("Nie udało się zapisać zmian");
      } finally {
        setSaving(false);
      }
    },
    [participantId, resolvedParams.slug, participantName, eventData?.event.id]
  );

  // Handle selection change with debounce
  const handleSelectionChange = useCallback(
    (slots: TimeSlot[]) => {
      setSelectedSlots(slots);

      // Debounce save
      const timeout = setTimeout(() => {
        saveAvailability(slots);
      }, 500);

      return () => clearTimeout(timeout);
    },
    [saveAvailability]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">😢</div>
            <h1 className="text-xl font-bold mb-2">
              {error || "Wydarzenie nie istnieje"}
            </h1>
            <p className="text-muted-foreground mb-4">
              Sprawdź czy link jest poprawny lub poproś organizatora o nowy link.
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Wróć na stronę główną
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { event, participants, availability, totalParticipants } = eventData;
  const participantNames = Object.fromEntries(
    participants.map((p) => [p.id, p.name])
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold">{event.title}</h1>
              {event.description && (
                <p className="text-sm text-muted-foreground">
                  {event.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                {totalParticipants} uczestników
              </Badge>
              {lastSaved && (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Zapisano
                </Badge>
              )}
              {saving && (
                <Badge variant="outline">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Zapisywanie...
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(event.startDate), "d MMM", { locale: pl })}
                {event.startDate !== event.endDate && (
                  <>
                    {" - "}
                    {format(new Date(event.endDate), "d MMM yyyy", {
                      locale: pl,
                    })}
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {formatTimeForDisplay(event.startTime)} -{" "}
                {formatTimeForDisplay(event.endTime)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Join form or participant info */}
        {!participantId ? (
          <Card>
            <CardHeader>
              <CardTitle>Dołącz do wydarzenia</CardTitle>
              <CardDescription>
                Podaj swoje imię, aby zaznaczyć swoją dostępność
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="name" className="sr-only">
                    Twoje imię
                  </Label>
                  <Input
                    id="name"
                    placeholder="Twoje imię"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleJoinEvent();
                    }}
                    maxLength={50}
                  />
                </div>
                <Button onClick={handleJoinEvent} disabled={joiningEvent}>
                  {joiningEvent && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Dołącz
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Zalogowano jako:
                  </p>
                  <p className="font-medium">{participantName}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "edit" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("edit")}
                  >
                    Edytuj dostępność
                  </Button>
                  <Button
                    variant={viewMode === "view" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("view")}
                  >
                    Zobacz wszystkich
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Grid */}
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === "edit"
                ? "Zaznacz swoją dostępność"
                : "Wspólna dostępność"}
            </CardTitle>
            <CardDescription>
              {viewMode === "edit"
                ? "Kliknij i przeciągnij, aby zaznaczyć kiedy jesteś dostępny"
                : "Ciemniejszy kolor = więcej osób dostępnych"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AvailabilityLegend mode={viewMode} />
            <Separator />
            <TimeGrid
              startDate={new Date(event.startDate)}
              endDate={new Date(event.endDate)}
              startTime={event.startTime}
              endTime={event.endTime}
              slotDuration={event.slotDuration}
              selectedSlots={selectedSlots}
              onSelectionChange={handleSelectionChange}
              disabled={!participantId}
              mode={viewMode}
              heatmapData={viewMode === "view" ? availability : undefined}
              totalParticipants={totalParticipants}
              participantNames={participantNames}
            />
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardContent className="pt-6">
            <ParticipantList
              participants={participants}
              currentParticipantId={participantId || undefined}
            />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-4">
        <div className="container text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            WhenWeFree
          </Link>{" "}
          - Znajdź wspólny czas ze znajomymi
        </div>
      </footer>
    </div>
  );
}
