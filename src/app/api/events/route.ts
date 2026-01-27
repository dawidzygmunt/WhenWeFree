import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import prisma from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations";

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Musisz być zalogowany, aby utworzyć wydarzenie" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = createEventSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Create user if doesn't exist (fallback for webhook)
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: `${userId}@placeholder.com`, // Will be updated by webhook
        },
      });
    }

    // Generate unique slug
    const slug = `${data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 30)}-${nanoid(8)}`;

    const event = await prisma.event.create({
      data: {
        slug,
        title: data.title,
        description: data.description || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        startTime: data.startTime,
        endTime: data.endTime,
        slotDuration: data.slotDuration || 30,
        timezone: data.timezone || "Europe/Warsaw",
        creatorId: user.id,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia wydarzenia" },
      { status: 500 }
    );
  }
}

// GET /api/events - Get all events for the current user
export async function GET() {
  try {
    const { userId } = await auth();

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
      return NextResponse.json({ events: [] });
    }

    const events = await prisma.event.findMany({
      where: { creatorId: user.id },
      include: {
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania wydarzeń" },
      { status: 500 }
    );
  }
}
