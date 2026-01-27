"use client";

import { useState, useCallback, useRef } from "react";

interface TimeSlot {
  date: string;
  time: number;
}

interface UseTimeGridSelectionOptions {
  onSelectionChange: (slots: TimeSlot[]) => void;
  existingSelection: Set<string>;
  disabled?: boolean;
  dates: string[]; // Array of date keys in order
  times: number[]; // Array of time slots in order
}

interface SelectionState {
  isSelecting: boolean;
  mode: "select" | "deselect";
  startSlot: { dateIndex: number; timeIndex: number } | null;
  endSlot: { dateIndex: number; timeIndex: number } | null;
}

export function createSlotKey(date: string, time: number): string {
  return `${date}:${time}`;
}

export function parseSlotKey(key: string): TimeSlot {
  const [date, timeStr] = key.split(":");
  return { date, time: parseInt(timeStr, 10) };
}

function getSlotIndices(
  slotKey: string,
  dates: string[],
  times: number[]
): { dateIndex: number; timeIndex: number } | null {
  const { date, time } = parseSlotKey(slotKey);
  const dateIndex = dates.indexOf(date);
  const timeIndex = times.indexOf(time);

  if (dateIndex === -1 || timeIndex === -1) return null;
  return { dateIndex, timeIndex };
}

function getSlotsInRectangle(
  start: { dateIndex: number; timeIndex: number },
  end: { dateIndex: number; timeIndex: number },
  dates: string[],
  times: number[]
): Set<string> {
  const slots = new Set<string>();

  const minDateIndex = Math.min(start.dateIndex, end.dateIndex);
  const maxDateIndex = Math.max(start.dateIndex, end.dateIndex);
  const minTimeIndex = Math.min(start.timeIndex, end.timeIndex);
  const maxTimeIndex = Math.max(start.timeIndex, end.timeIndex);

  for (let di = minDateIndex; di <= maxDateIndex; di++) {
    for (let ti = minTimeIndex; ti <= maxTimeIndex; ti++) {
      slots.add(createSlotKey(dates[di], times[ti]));
    }
  }

  return slots;
}

export function useTimeGridSelection({
  onSelectionChange,
  existingSelection,
  disabled = false,
  dates,
  times,
}: UseTimeGridSelectionOptions) {
  const [state, setState] = useState<SelectionState>({
    isSelecting: false,
    mode: "select",
    startSlot: null,
    endSlot: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const getSlotFromElement = useCallback((element: Element | null): string | null => {
    if (!element) return null;
    const slotElement = element.closest("[data-slot]");
    return slotElement?.getAttribute("data-slot") || null;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      const slotKey = getSlotFromElement(e.target as Element);
      if (!slotKey) return;

      const indices = getSlotIndices(slotKey, dates, times);
      if (!indices) return;

      e.preventDefault();

      const mode = existingSelection.has(slotKey) ? "deselect" : "select";

      setState({
        isSelecting: true,
        mode,
        startSlot: indices,
        endSlot: indices,
      });

      // Capture pointer for smooth dragging
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [disabled, existingSelection, getSlotFromElement, dates, times]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!state.isSelecting || disabled) return;

      const element = document.elementFromPoint(e.clientX, e.clientY);
      const slotKey = getSlotFromElement(element);

      if (!slotKey) return;

      const indices = getSlotIndices(slotKey, dates, times);
      if (!indices) return;

      setState((prev) => ({
        ...prev,
        endSlot: indices,
      }));
    },
    [state.isSelecting, disabled, getSlotFromElement, dates, times]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!state.isSelecting || !state.startSlot || !state.endSlot) return;

      // Compute rectangle selection
      const rectangleSlots = getSlotsInRectangle(state.startSlot, state.endSlot, dates, times);

      // Apply selection/deselection
      const newSelection = new Set(existingSelection);

      rectangleSlots.forEach((slotKey) => {
        if (state.mode === "select") {
          newSelection.add(slotKey);
        } else {
          newSelection.delete(slotKey);
        }
      });

      // Convert to array and call callback
      const slots = Array.from(newSelection).map(parseSlotKey);
      onSelectionChange(slots);

      // Release pointer capture
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if already released
      }

      setState({
        isSelecting: false,
        mode: "select",
        startSlot: null,
        endSlot: null,
      });
    },
    [state, existingSelection, onSelectionChange, dates, times]
  );

  // Prevent context menu during selection
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (state.isSelecting) {
      e.preventDefault();
    }
  }, [state.isSelecting]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const slotKey = getSlotFromElement(element);

      if (!slotKey) return;

      const indices = getSlotIndices(slotKey, dates, times);
      if (!indices) return;

      const mode = existingSelection.has(slotKey) ? "deselect" : "select";

      setState({
        isSelecting: true,
        mode,
        startSlot: indices,
        endSlot: indices,
      });
    },
    [disabled, existingSelection, getSlotFromElement, dates, times]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!state.isSelecting || disabled) return;

      e.preventDefault(); // Prevent scrolling

      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const slotKey = getSlotFromElement(element);

      if (!slotKey) return;

      const indices = getSlotIndices(slotKey, dates, times);
      if (!indices) return;

      setState((prev) => ({
        ...prev,
        endSlot: indices,
      }));
    },
    [state.isSelecting, disabled, getSlotFromElement, dates, times]
  );

  const handleTouchEnd = useCallback(() => {
    if (!state.isSelecting || !state.startSlot || !state.endSlot) return;

    // Compute rectangle selection
    const rectangleSlots = getSlotsInRectangle(state.startSlot, state.endSlot, dates, times);

    // Apply selection/deselection
    const newSelection = new Set(existingSelection);

    rectangleSlots.forEach((slotKey) => {
      if (state.mode === "select") {
        newSelection.add(slotKey);
      } else {
        newSelection.delete(slotKey);
      }
    });

    const slots = Array.from(newSelection).map(parseSlotKey);
    onSelectionChange(slots);

    setState({
      isSelecting: false,
      mode: "select",
      startSlot: null,
      endSlot: null,
    });
  }, [state, existingSelection, onSelectionChange, dates, times]);

  // Calculate slot state for rendering
  const getSlotState = useCallback(
    (slotKey: string): "empty" | "selected" | "selecting" | "deselecting" => {
      const isSelected = existingSelection.has(slotKey);

      if (state.isSelecting && state.startSlot && state.endSlot) {
        const previewSlots = getSlotsInRectangle(state.startSlot, state.endSlot, dates, times);
        const isInPreview = previewSlots.has(slotKey);

        if (isInPreview) {
          return state.mode === "select" ? "selecting" : "deselecting";
        }
      }

      return isSelected ? "selected" : "empty";
    },
    [state, existingSelection, dates, times]
  );

  return {
    containerRef,
    state,
    getSlotState,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerUp,
      onContextMenu: handleContextMenu,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
