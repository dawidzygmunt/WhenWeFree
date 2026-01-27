"use client";

interface AvailabilityLegendProps {
  mode: "edit" | "view";
}

export function AvailabilityLegend({ mode }: AvailabilityLegendProps) {
  if (mode === "edit") {
    return (
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slot-empty border" />
          <span>Niedostępny</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slot-available" />
          <span>Dostępny</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <span className="font-medium">Legenda:</span>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-slot-empty border" />
        <span>0%</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-slot-partial-25" />
        <span>25%</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-slot-partial-50" />
        <span>50%</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-slot-partial-75" />
        <span>75%</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-slot-full" />
        <span>100%</span>
      </div>
    </div>
  );
}
