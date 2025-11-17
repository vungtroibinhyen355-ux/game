import { NextRequest, NextResponse } from "next/server"
import { readData, writeData } from "@/lib/storage"

// GET - Read rooms
export async function GET() {
  try {
    const data = readData()
    return NextResponse.json(data.rooms || [])
  } catch (error) {
    console.error("[API] Error reading rooms:", error)
    return NextResponse.json([], { status: 200 })
  }
}

// POST - Save rooms
export async function POST(request: NextRequest) {
  try {
    const rooms = await request.json()
    const currentData = readData()
    currentData.rooms = rooms
    
    if (writeData(currentData)) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to save rooms" }, { status: 500 })
    }
  } catch (error) {
    console.error("[API] Error saving rooms:", error)
    return NextResponse.json({ error: "Failed to save rooms" }, { status: 500 })
  }
}

