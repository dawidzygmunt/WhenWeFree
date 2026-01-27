"use client";

import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface Participant {
  id: string;
  name: string;
}

interface ParticipantListProps {
  participants: Participant[];
  currentParticipantId?: string;
}

export function ParticipantList({
  participants,
  currentParticipantId,
}: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Brak uczestników</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        Uczestnicy ({participants.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {participants.map((participant) => (
          <Badge
            key={participant.id}
            variant={participant.id === currentParticipantId ? "default" : "secondary"}
          >
            {participant.name}
            {participant.id === currentParticipantId && " (Ty)"}
          </Badge>
        ))}
      </div>
    </div>
  );
}
