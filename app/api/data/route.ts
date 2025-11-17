import { NextRequest, NextResponse } from "next/server"
import { readData, writeData } from "@/lib/storage"

// Default data structure - only rooms (questions, teams, scores, rank)
const DEFAULT_DATA = {
  rooms: [],
  lastUpdated: new Date().toISOString()
}

// GET - Read all data
export async function GET() {
  try {
    const data = readData()
    return NextResponse.json(data || DEFAULT_DATA)
  } catch (error) {
    console.error("[API] Error reading data:", error)
    return NextResponse.json(DEFAULT_DATA, { status: 200 })
  }
}

// POST - Update data (full or partial)
export async function POST(request: NextRequest) {
  try {
    const updateData = await request.json()
    const currentData = readData()
    
    // Merge update data with current data
    const newData = {
      ...currentData,
      ...updateData,
      lastUpdated: new Date().toISOString()
    }
    
    // If updating specific fields
    if (updateData.rooms !== undefined) {
      newData.rooms = updateData.rooms
    }
    // Session is not stored in JSON, it's in localStorage
    
    if (writeData(newData)) {
      return NextResponse.json({ success: true, data: newData })
    } else {
      return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
    }
  } catch (error) {
    console.error("[API] Error saving data:", error)
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
  }
}

// PUT - Replace entire data
export async function PUT(request: NextRequest) {
  try {
    const newData = await request.json()
    if (writeData(newData)) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
    }
  } catch (error) {
    console.error("[API] Error replacing data:", error)
    return NextResponse.json({ error: "Failed to replace data" }, { status: 500 })
  }
}

