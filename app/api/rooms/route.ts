import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "quiz-data.json")

// Default data structure - only rooms, questions, teams, scores, rank
const DEFAULT_DATA = {
  rooms: [],
  lastUpdated: new Date().toISOString()
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Initialize file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf-8")
}

// Helper function to read data
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("[API] Error reading data:", error)
    return DEFAULT_DATA
  }
}

// Helper function to write data
function writeData(data: any) {
  try {
    data.lastUpdated = new Date().toISOString()
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8")
    return true
  } catch (error) {
    console.error("[API] Error writing data:", error)
    return false
  }
}

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

