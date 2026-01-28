"use client";

import { useMemo, useCallback } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  useTimeGridSelection,
  createSlotKey,
} from "@/hooks/use-time-grid-selection";
import {
  generateDateRange,
  generateTimeSlots,
} from "@/lib/time-utils";

interface TimeSlot {
  date: string;
  time: number;
}

interface TimeGridProps {
  startDate: Date;
  endDate: Date;
  startTime: number;
  endTime: number;
  slotDuration: number;
  selectedSlots: TimeSlot[];
  onSelectionChange: (slots: TimeSlot[]) => void;
  disabled?: boolean;
  mode?: "edit" | "view";
  heatmapData?: Record<string, Record<number, string[]>>;
  totalParticipants?: number;
  participantNames?: Record<string, string>;
  isMobile?: boolean;
}

// Format hour for display (e.g., 960 -> "16:00")
function formatHourLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return `${hours}:00`;
}

export function TimeGrid({
  startDate,
  endDate,
  startTime,
  endTime,
  slotDuration,
  selectedSlots,
  onSelectionChange,
  disabled = false,
  mode = "edit",
  heatmapData,
  totalParticipants = 0,
  participantNames = {},
  isMobile = false,
}: TimeGridProps) {
  const dates = useMemo(
    () => generateDateRange(startDate, endDate),
    [startDate, endDate]
  );

  const timeSlots = useMemo(
    () => generateTimeSlots(startTime, endTime, slotDuration),
    [startTime, endTime, slotDuration]
  );

  // Arrays of date keys and time values for rectangle selection
  const dateKeys = useMemo(
    () => dates.map((date) => format(date, "yyyy-MM-dd")),
    [dates]
  );

  const selectedSet = useMemo(() => {
    const set = new Set<string>();
    selectedSlots.forEach((slot) => {
      set.add(createSlotKey(slot.date, slot.time));
    });
    return set;
  }, [selectedSlots]);

  const { containerRef, getSlotState, handlers, selectColumn, selectHour } = useTimeGridSelection({
    onSelectionChange,
    existingSelection: selectedSet,
    disabled: disabled || mode === "view",
    dates: dateKeys,
    times: timeSlots,
    isMobile,
  });

  // Calculate slots per hour
  const slotsPerHour = Math.floor(60 / slotDuration);

  const getHeatmapColor = useCallback(
    (dateKey: string, time: number): string => {
      if (!heatmapData || totalParticipants === 0) return "";

      const participants = heatmapData[dateKey]?.[time]?.length || 0;
      const ratio = participants / totalParticipants;

      if (participants === 0) return "bg-slot-empty";
      if (ratio <= 0.25) return "bg-slot-partial-25";
      if (ratio <= 0.5) return "bg-slot-partial-50";
      if (ratio <= 0.75) return "bg-slot-partial-75";
      return "bg-slot-full";
    },
    [heatmapData, totalParticipants]
  );

  const getParticipantsForSlot = useCallback(
    (dateKey: string, time: number): string[] => {
      if (!heatmapData) return [];
      const ids = heatmapData[dateKey]?.[time] || [];
      return ids.map((id) => participantNames[id] || id);
    },
    [heatmapData, participantNames]
  );

  // Cell height - larger on mobile for easier touch targets
  const cellHeight = mode === "view"
    ? (isMobile ? 24 : 14)
    : (isMobile ? 32 : 18); // pixels

  // Check if time is start of hour
  const isHourStart = (time: number) => time % 60 === 0;

  // Get position within hour (0-based)
  const getSlotIndexInHour = (time: number) => {
    const minutesIntoHour = time % 60;
    return Math.floor(minutesIntoHour / slotDuration);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-auto scrollbar-thin"
      {...(mode === "edit" ? handlers : {})}
    >
      <div className="inline-flex flex-col select-none min-w-full">
        {/* Header row - dates */}
        <div
          className="flex"
          style={{ minWidth: `${48 + dates.length * 50}px` }}
        >
          <div className="w-12 shrink-0 sticky left-0 z-10 bg-background" />
          {dates.map((date, dateIndex) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const isClickable = isMobile && mode === "edit" && !disabled;
            return (
              <div
                key={dateKey}
                className={cn(
                  "flex-1 min-w-[50px] p-1.5 text-center text-xs font-medium border-b border-l bg-muted/50",
                  isClickable && "cursor-pointer hover:bg-muted select-none"
                )}
                style={isClickable ? { touchAction: "manipulation" } : undefined}
                onTouchStart={isClickable ? (e) => e.stopPropagation() : undefined}
                onTouchEnd={isClickable ? (e) => e.stopPropagation() : undefined}
                onClick={isClickable ? () => selectColumn(dateIndex) : undefined}
              >
                <div className="text-muted-foreground text-[10px]">
                  {format(date, "EEE", { locale: pl })}
                </div>
                <div className="text-[11px]">{format(date, "d.MM")}</div>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        {timeSlots.map((time, timeIndex) => {
          const showLabel = isHourStart(time);
          const slotIndexInHour = getSlotIndexInHour(time);
          const isLastSlotInHour = slotIndexInHour === slotsPerHour - 1;

          return (
            <div
              key={`row-${time}`}
              className="flex"
              style={{ minWidth: `${48 + dates.length * 50}px` }}
            >
              {/* Time label - only show for hour starts, clickable on mobile */}
              <div
                className={cn(
                  "w-12 shrink-0 sticky left-0 z-10 bg-background text-right pr-2 flex items-start justify-end",
                  isLastSlotInHour && "border-b",
                  isMobile && mode === "edit" && !disabled && showLabel && "cursor-pointer hover:bg-muted"
                )}
                style={{
                  height: `${cellHeight}px`,
                  ...(isMobile && mode === "edit" && !disabled && showLabel ? { touchAction: "manipulation" } : {})
                }}
                onTouchStart={
                  isMobile && mode === "edit" && !disabled && showLabel
                    ? (e) => e.stopPropagation()
                    : undefined
                }
                onTouchEnd={
                  isMobile && mode === "edit" && !disabled && showLabel
                    ? (e) => e.stopPropagation()
                    : undefined
                }
                onClick={
                  isMobile && mode === "edit" && !disabled && showLabel
                    ? () => selectHour(timeIndex, slotsPerHour)
                    : undefined
                }
              >
                {showLabel && (
                  <span className={cn(
                    "text-[11px] text-muted-foreground -mt-0.5",
                    isMobile && "select-none"
                  )}>
                    {formatHourLabel(time)}
                  </span>
                )}
              </div>

              {/* Slots for each date */}
              {dates.map((date) => {
                const dateKey = format(date, "yyyy-MM-dd");
                const slotKey = createSlotKey(dateKey, time);
                const slotState = getSlotState(slotKey);

                if (mode === "view") {
                  const heatmapColor = getHeatmapColor(dateKey, time);
                  const participants = getParticipantsForSlot(dateKey, time);

                  return (
                    <div
                      key={slotKey}
                      data-slot={slotKey}
                      className={cn(
                        "flex-1 min-w-[50px] border-l transition-colors",
                        isLastSlotInHour ? "border-b" : "border-b border-b-border/20",
                        heatmapColor,
                        "hover:ring-1 hover:ring-primary/50 hover:z-10"
                      )}
                      style={{ height: `${cellHeight}px` }}
                      title={
                        participants.length > 0
                          ? `${participants.length} dostępnych: ${participants.join(", ")}`
                          : "Nikt nie jest dostępny"
                      }
                    />
                  );
                }

                return (
                  <div
                    key={slotKey}
                    data-slot={slotKey}
                    className={cn(
                      "flex-1 min-w-[50px] border-l transition-colors cursor-pointer",
                      isLastSlotInHour ? "border-b" : "border-b border-b-border/20",
                      slotState === "empty" && "bg-slot-empty hover:bg-muted",
                      slotState === "selected" && "bg-slot-available",
                      slotState === "selecting" && "bg-slot-available/70",
                      slotState === "deselecting" && "bg-slot-unavailable/70",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                    style={{ height: `${cellHeight}px` }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

    </div>
  );
}
