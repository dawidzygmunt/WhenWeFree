"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Link as LinkIcon,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { formatTimeForDisplay } from "@/lib/time-utils";
import { toast } from "sonner";

interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  startTime: number;
  endTime: number;
  createdAt: string;
  _count: {
    participants: number;
  };
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Nie udało się pobrać wydarzeń");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/event/${slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link skopiowany do schowka!");
  };

  const deleteEvent = async (slug: string) => {
    if (!confirm("Czy na pewno chcesz usunąć to wydarzenie?")) return;

    setDeleting(slug);
    try {
      const response = await fetch(`/api/events/${slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEvents(events.filter((e) => e.slug !== slug));
        toast.success("Wydarzenie zostało usunięte");
      } else {
        toast.error("Nie udało się usunąć wydarzenia");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Wystąpił błąd podczas usuwania");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Twoje wydarzenia</h1>
            <p className="text-muted-foreground mt-1">
              Zarządzaj swoimi wydarzeniami i sprawdzaj dostępność uczestników
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Twoje wydarzenia</h1>
          <p className="text-muted-foreground mt-1">
            Zarządzaj swoimi wydarzeniami i sprawdzaj dostępność uczestników
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="h-4 w-4 mr-2" />
            Nowe wydarzenie
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brak wydarzeń</h3>
            <p className="text-muted-foreground text-center mb-4">
              Nie masz jeszcze żadnych wydarzeń. Utwórz pierwsze!
            </p>
            <Button asChild>
              <Link href="/events/new">
                <Plus className="h-4 w-4 mr-2" />
                Utwórz wydarzenie
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="group relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="truncate">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {event.description || "Brak opisu"}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    <Users className="h-3 w-3 mr-1" />
                    {event._count.participants}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTimeForDisplay(event.startTime)} -{" "}
                    {formatTimeForDisplay(event.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyLink(event.slug)}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Kopiuj link
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/event/${event.slug}`}>Zobacz</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteEvent(event.slug)}
                    disabled={deleting === event.slug}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
