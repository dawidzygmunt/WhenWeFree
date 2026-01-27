import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/events/[slug] - Get event details (public)
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

    for (const participant of event.participants) {
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
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        slotDuration: event.slotDuration,
        timezone: event.timezone,
        createdAt: event.createdAt,
      },
      participants: event.participants.map((p: { id: string; name: string }) => ({
        id: p.id,
        name: p.name,
      })),
      availability,
      totalParticipants: event.participants.length,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania wydarzenia" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[slug] - Delete event (owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { slug } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "Musisz być zalogowany" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Użytkownik nie istnieje" },
        { status: 404 }
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

    if (event.creatorId !== user.id) {
      return NextResponse.json(
        { error: "Nie masz uprawnień do usunięcia tego wydarzenia" },
        { status: 403 }
      );
    }

    await prisma.event.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania wydarzenia" },
      { status: 500 }
    );
  }
}
