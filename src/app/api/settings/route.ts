import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`SELECT key, value FROM site_settings`;
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key as string] = row.value as string;
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const allowed = ["phone", "email", "location", "hours"];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        await sql`
          INSERT INTO site_settings (key, value)
          VALUES (${key}, ${body[key]})
          ON CONFLICT (key)
          DO UPDATE SET value = ${body[key]}, updated_at = NOW()
        `;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
