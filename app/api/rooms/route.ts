import { NextRequest, NextResponse } from "next/server"
import { readData, writeData } from "@/lib/storage"

// GET - Read rooms
export async function GET() {
  try {
    const data = readData()
    // Ensure we always return an array
    const rooms = Array.isArray(data?.rooms) ? data.rooms : []
    return NextResponse.json(rooms, { status: 200 })
  } catch (error) {
    console.error("[API] Error reading rooms:", error)
    // Always return an array, even on error
    return NextResponse.json([], { status: 200 })
  }
}

// POST - Save rooms
export async function POST(request: NextRequest) {
  try {
    const rooms = await request.json()
    
    // Validate input
    if (!Array.isArray(rooms)) {
      return NextResponse.json({ error: "Invalid data format: expected array" }, { status: 400 })
    }
    
    const currentData = readData()
    if (!currentData) {
      return NextResponse.json({ error: "Failed to read current data" }, { status: 500 })
    }
    
    currentData.rooms = rooms
    
    if (writeData(currentData)) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to save rooms" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[API] Error saving rooms:", error)
    const errorMessage = error?.message || "Failed to save rooms"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

