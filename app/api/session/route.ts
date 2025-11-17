import { NextRequest, NextResponse } from "next/server"

// Session is now stored in localStorage, not in JSON file
// This API route is kept for backward compatibility but returns null

// Session is now stored in localStorage on client side
// These API routes are kept for backward compatibility but don't actually save to JSON

// GET - Read session (returns null, session is in localStorage)
export async function GET() {
  return NextResponse.json(null, { status: 200 })
}

// POST - Save session (no-op, session is in localStorage)
export async function POST(request: NextRequest) {
  // Session is stored in localStorage, not in JSON file
  return NextResponse.json({ success: true, message: "Session stored in localStorage" })
}

// DELETE - Clear session (no-op, session is in localStorage)
export async function DELETE() {
  // Session is stored in localStorage, not in JSON file
  return NextResponse.json({ success: true, message: "Session stored in localStorage" })
}

