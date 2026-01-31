import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateAvailabilitySchema } from "@/lib/validations";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/events/[slug]/availability - Get combined availability
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        participants: {
          include: {
            availabilities: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Wydarzenie nie zostało znalezione" },
        { status: 404 }
      );
    }

    // Build availability heatmap
    const availability: Record<string, Record<number, string[]>> = {};
    const participantNames: Record<string, string> = {};

    for (const participant of event.participants) {
      participantNames[participant.id] = participant.name;

      for (const slot of participant.availabilities) {
        const dateKey = slot.date.toISOString().split("T")[0];

        if (!availability[dateKey]) {
          availability[dateKey] = {};
        }

        if (!availability[dateKey][slot.startTime]) {
          availability[dateKey][slot.startTime] = [];
        }

        availability[dateKey][slot.startTime].push(participant.id);
      }
    }

    return NextResponse.json({
      availability,
      participantNames,
      totalParticipants: event.participants.length,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania dostępności" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[slug]/availability - Update participant availability
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const { participantId, slots } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: "ID uczestnika jest wymagane" },
        { status: 400 }
      );
    }

    const validationResult = updateAvailabilitySchema.safeParse({ slots });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { slug },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Wydarzenie nie zostało znalezione" },
        { status: 404 }
      );
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });

    if (!participant || participant.eventId !== event.id) {
      return NextResponse.json(
        { error: "Uczestnik nie należy do tego wydarzenia" },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity and prevent race conditions
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Delete all existing availabilities for this participant
      await tx.availability.deleteMany({
        where: { participantId },
      });

      // Create new availabilities
      if (slots.length > 0) {
        await tx.availability.createMany({
          data: slots.map((slot: { date: string; time: number }) => ({
            participantId,
            date: new Date(slot.date),
            startTime: slot.time,
            endTime: slot.time + event.slotDuration,
          })),
        });
      }
    });

    // Fetch updated availabilities
    const updatedAvailabilities = await prisma.availability.findMany({
      where: { participantId },
    });

    return NextResponse.json({
      success: true,
      availabilities: updatedAvailabilities.map((a: { date: Date; startTime: number; endTime: number }) => ({
        date: a.date.toISOString().split("T")[0],
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji dostępności" },
      { status: 500 }
    );
  }
}
