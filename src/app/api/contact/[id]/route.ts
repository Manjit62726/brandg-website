import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { first_name, last_name, email, phone, service, message } = body;

    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    await sql`
      UPDATE contacts
      SET first_name = ${first_name},
          last_name = ${last_name},
          email = ${email},
          phone = ${phone || null},
          service = ${service || null},
          message = ${message || null}
      WHERE id = ${Number(id)}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
