import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ isBlocked: false });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email }
        ]
      },
      select: { isBlocked: true }
    });

    return NextResponse.json({ isBlocked: !!user?.isBlocked });
  } catch (error) {
    return NextResponse.json({ isBlocked: false });
  }
}
