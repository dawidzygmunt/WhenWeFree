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
  isMobile?: boolean; // Use tap-to-toggle instead of drag on mobile
}

interface SelectionState {
  isSelecting: boolean;
  mode: "select" | "deselect";
  startSlot: { dateIndex: number; timeIndex: number } | null;
  endSlot: { dateIndex: number; timeIndex: number } | null;
}

// Touch tracking for distinguishing tap from scroll
interface TouchState {
  startX: number;
  startY: number;
  slotKey: string | null;
  moved: boolean;
}

const TOUCH_MOVE_THRESHOLD = 10; // pixels - if finger moves more than this, it's a scroll not a tap

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
  isMobile = false,
}: UseTimeGridSelectionOptions) {
  const [state, setState] = useState<SelectionState>({
    isSelecting: false,
    mode: "select",
    startSlot: null,
    endSlot: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Track touch state for mobile tap detection
  const touchStateRef = useRef<TouchState | null>(null);

  const getSlotFromElement = useCallback((element: Element | null): string | null => {
    if (!element) return null;
    const slotElement = element.closest("[data-slot]");
    return slotElement?.getAttribute("data-slot") || null;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      // On mobile, handle via touch events instead (tap-to-toggle)
      // pointerType "touch" indicates a touch event on mobile
      if (isMobile && e.pointerType === "touch") {
        return; // Let touch events handle this
      }

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
    [disabled, existingSelection, getSlotFromElement, dates, times, isMobile]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // On mobile, don't handle pointer move for touch - allow native scroll
      if (isMobile && e.pointerType === "touch") {
        return;
      }

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
    [state.isSelecting, disabled, getSlotFromElement, dates, times, isMobile]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // On mobile touch, handled by touch events
      if (isMobile && e.pointerType === "touch") {
        return;
      }

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
    [state, existingSelection, onSelectionChange, dates, times, isMobile]
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

      // On mobile: record touch start position for tap detection
      // We'll decide on touchEnd whether it was a tap or scroll
      if (isMobile) {
        touchStateRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          slotKey: slotKey, // May be null if touched header or empty area
          moved: false,
        };
        return;
      }

      // Desktop touch: start drag selection
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
    [disabled, existingSelection, getSlotFromElement, dates, times, isMobile]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // On mobile: track if finger moved significantly (indicates scroll, not tap)
      if (isMobile && touchStateRef.current) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStateRef.current.startX);
        const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);

        if (deltaX > TOUCH_MOVE_THRESHOLD || deltaY > TOUCH_MOVE_THRESHOLD) {
          touchStateRef.current.moved = true;
        }
        return; // Allow native scroll
      }

      if (!state.isSelecting || disabled) return;

      e.preventDefault(); // Prevent scrolling (desktop touch only)

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
    [state.isSelecting, disabled, getSlotFromElement, dates, times, isMobile]
  );

  const handleTouchEnd = useCallback(() => {
    // On mobile: execute tap-to-toggle only if finger didn't move (wasn't scrolling)
    if (isMobile) {
      const touchState = touchStateRef.current;
      touchStateRef.current = null;

      if (touchState && !touchState.moved && touchState.slotKey) {
        const newSelection = new Set(existingSelection);
        if (newSelection.has(touchState.slotKey)) {
          newSelection.delete(touchState.slotKey);
        } else {
          newSelection.add(touchState.slotKey);
        }
        const slots = Array.from(newSelection).map(parseSlotKey);
        onSelectionChange(slots);
      }
      return;
    }

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
  }, [state, existingSelection, onSelectionChange, dates, times, isMobile]);

  // Bulk selection functions for mobile
  const selectColumn = useCallback(
    (dateIndex: number) => {
      if (disabled || dateIndex < 0 || dateIndex >= dates.length) return;

      const dateKey = dates[dateIndex];
      const columnSlots = times.map((time) => createSlotKey(dateKey, time));

      // Check if all slots in column are already selected
      const allSelected = columnSlots.every((slot) => existingSelection.has(slot));

      const newSelection = new Set(existingSelection);
      if (allSelected) {
        // Deselect all in column
        columnSlots.forEach((slot) => newSelection.delete(slot));
      } else {
        // Select all in column
        columnSlots.forEach((slot) => newSelection.add(slot));
      }

      const slots = Array.from(newSelection).map(parseSlotKey);
      onSelectionChange(slots);
    },
    [disabled, dates, times, existingSelection, onSelectionChange]
  );

  const selectRow = useCallback(
    (timeIndex: number) => {
      if (disabled || timeIndex < 0 || timeIndex >= times.length) return;

      const time = times[timeIndex];
      const rowSlots = dates.map((dateKey) => createSlotKey(dateKey, time));

      // Check if all slots in row are already selected
      const allSelected = rowSlots.every((slot) => existingSelection.has(slot));

      const newSelection = new Set(existingSelection);
      if (allSelected) {
        // Deselect all in row
        rowSlots.forEach((slot) => newSelection.delete(slot));
      } else {
        // Select all in row
        rowSlots.forEach((slot) => newSelection.add(slot));
      }

      const slots = Array.from(newSelection).map(parseSlotKey);
      onSelectionChange(slots);
    },
    [disabled, dates, times, existingSelection, onSelectionChange]
  );

  // Select all rows within an hour (from startTimeIndex for slotsPerHour count)
  const selectHour = useCallback(
    (startTimeIndex: number, slotsPerHour: number) => {
      if (disabled) return;

      // Collect all slots in this hour
      const hourSlots: string[] = [];
      for (let i = 0; i < slotsPerHour && (startTimeIndex + i) < times.length; i++) {
        const time = times[startTimeIndex + i];
        dates.forEach((dateKey) => {
          hourSlots.push(createSlotKey(dateKey, time));
        });
      }

      // Check if all slots in hour are already selected
      const allSelected = hourSlots.every((slot) => existingSelection.has(slot));

      const newSelection = new Set(existingSelection);
      if (allSelected) {
        // Deselect all in hour
        hourSlots.forEach((slot) => newSelection.delete(slot));
      } else {
        // Select all in hour
        hourSlots.forEach((slot) => newSelection.add(slot));
      }

      const slots = Array.from(newSelection).map(parseSlotKey);
      onSelectionChange(slots);
    },
    [disabled, dates, times, existingSelection, onSelectionChange]
  );

  const selectAll = useCallback(() => {
    if (disabled) return;

    const allSlots: string[] = [];
    dates.forEach((dateKey) => {
      times.forEach((time) => {
        allSlots.push(createSlotKey(dateKey, time));
      });
    });

    const slots = allSlots.map(parseSlotKey);
    onSelectionChange(slots);
  }, [disabled, dates, times, onSelectionChange]);

  const clearAll = useCallback(() => {
    if (disabled) return;
    onSelectionChange([]);
  }, [disabled, onSelectionChange]);

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
    // Bulk selection functions
    selectColumn,
    selectRow,
    selectHour,
    selectAll,
    clearAll,
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
