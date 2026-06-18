import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, phone, service, message } = body;

    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO contacts (first_name, last_name, email, phone, service, message)
      VALUES (${first_name}, ${last_name}, ${email}, ${phone || null}, ${service || null}, ${message || null})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const contacts = await sql`
      SELECT * FROM contacts ORDER BY created_at DESC
    `;
    return NextResponse.json(contacts);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
