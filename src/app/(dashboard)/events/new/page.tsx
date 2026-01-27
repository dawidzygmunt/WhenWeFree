"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatTimeForDisplay } from "@/lib/time-utils";
import { DateRange } from "react-day-picker";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => ({
  value: i * 30,
  label: formatTimeForDisplay(i * 30),
}));

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [timeRange, setTimeRange] = useState<[number, number]>([960, 1380]); // 16:00 - 23:00
  const [slotDuration, setSlotDuration] = useState(30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Podaj tytuł wydarzenia");
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Wybierz zakres dat");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          startDate: format(dateRange.from, "yyyy-MM-dd"),
          endDate: format(dateRange.to, "yyyy-MM-dd"),
          startTime: timeRange[0],
          endTime: timeRange[1],
          slotDuration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd");
      }

      toast.success("Wydarzenie zostało utworzone!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(
        error instanceof Error ? error.message : "Nie udało się utworzyć wydarzenia"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nowe wydarzenie</h1>
        <p className="text-muted-foreground mt-1">
          Utwórz wydarzenie i udostępnij link znajomym
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Szczegóły wydarzenia</CardTitle>
            <CardDescription>
              Podaj podstawowe informacje o wydarzeniu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tytuł wydarzenia *</Label>
              <Input
                id="title"
                placeholder="np. Wyjście na piwo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Opis (opcjonalnie)</Label>
              <Input
                id="description"
                placeholder="Dodatkowe informacje..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Zakres dat *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "d MMM yyyy", { locale: pl })} -{" "}
                          {format(dateRange.to, "d MMM yyyy", { locale: pl })}
                        </>
                      ) : (
                        format(dateRange.from, "d MMM yyyy", { locale: pl })
                      )
                    ) : (
                      <span>Wybierz daty</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={pl}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Range */}
            <div className="space-y-4">
              <Label>Przedział czasowy</Label>
              <div className="px-2">
                <Slider
                  value={timeRange}
                  onValueChange={(value) => setTimeRange(value as [number, number])}
                  min={0}
                  max={1440}
                  step={30}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Od:</span>
                  <Select
                    value={timeRange[0].toString()}
                    onValueChange={(v) => setTimeRange([parseInt(v), timeRange[1]])}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.filter((t) => t.value < timeRange[1]).map(
                        (time) => (
                          <SelectItem key={time.value} value={time.value.toString()}>
                            {time.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Do:</span>
                  <Select
                    value={timeRange[1].toString()}
                    onValueChange={(v) => setTimeRange([timeRange[0], parseInt(v)])}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.filter((t) => t.value > timeRange[0]).map(
                        (time) => (
                          <SelectItem key={time.value} value={time.value.toString()}>
                            {time.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Slot Duration */}
            <div className="space-y-2">
              <Label>Długość slotu czasowego</Label>
              <Select
                value={slotDuration.toString()}
                onValueChange={(v) => setSlotDuration(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minut</SelectItem>
                  <SelectItem value="30">30 minut</SelectItem>
                  <SelectItem value="60">1 godzina</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Anuluj
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Utwórz wydarzenie
          </Button>
        </div>
      </form>
    </div>
  );
}
