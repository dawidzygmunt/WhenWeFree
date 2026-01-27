import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createParticipantSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/events/[slug]/participants - Get all participants
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        participants: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Wydarzenie nie zostało znalezione" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      participants: event.participants.map((p: { id: string; name: string; createdAt: Date }) => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania uczestników" },
      { status: 500 }
    );
  }
}

// POST /api/events/[slug]/participants - Add or get participant
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const validationResult = createParticipantSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name } = validationResult.data;

    const event = await prisma.event.findUnique({
      where: { slug },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Wydarzenie nie zostało znalezione" },
        { status: 404 }
      );
    }

    // Try to find existing participant or create new one
    let participant = await prisma.participant.findUnique({
      where: {
        eventId_name: {
          eventId: event.id,
          name: name.trim(),
        },
      },
      include: {
        availabilities: true,
      },
    });

    if (!participant) {
      participant = await prisma.participant.create({
        data: {
          name: name.trim(),
          eventId: event.id,
        },
        include: {
          availabilities: true,
        },
      });
    }

    return NextResponse.json({
      participant: {
        id: participant.id,
        name: participant.name,
        availabilities: participant.availabilities.map((a: { date: Date; startTime: number; endTime: number }) => ({
          date: a.date.toISOString().split("T")[0],
          startTime: a.startTime,
          endTime: a.endTime,
        })),
      },
    });
  } catch (error) {
    console.error("Error creating participant:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas dodawania uczestnika" },
      { status: 500 }
    );
  }
}
