// Storage utility that works on both local development and Vercel production
// On Vercel, filesystem is read-only, so we use in-memory storage as fallback
// NOTE: In-memory storage on Vercel is per-function invocation and won't persist
// For production, consider using Vercel KV, Vercel Postgres, or MongoDB Atlas

import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "quiz-data.json")

// Default data structure
const DEFAULT_DATA = {
  rooms: [],
  lastUpdated: new Date().toISOString()
}

// In-memory storage for Vercel (where filesystem is read-only)
// WARNING: On Vercel, this may not persist between serverless function invocations
// For production use, migrate to Vercel KV, Vercel Postgres, or MongoDB Atlas
// Using a global Map to potentially persist across invocations in the same process
const globalStorage = new Map<string, any>()
const STORAGE_KEY = "quiz_data"

// Check if we're in a read-only filesystem environment (like Vercel)
function isReadOnlyFilesystem(): boolean {
  // On Vercel, process.env.VERCEL is set
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    return true
  }
  
  // Try to detect read-only filesystem by attempting to write
  try {
    const testFile = path.join(process.cwd(), ".vercel-test")
    fs.writeFileSync(testFile, "test")
    fs.unlinkSync(testFile)
    return false
  } catch {
    return true
  }
}

// Initialize storage
function initializeStorage() {
  const isReadOnly = isReadOnlyFilesystem()
  
  if (isReadOnly) {
    // Use in-memory storage
    if (!globalStorage.has(STORAGE_KEY)) {
      globalStorage.set(STORAGE_KEY, { ...DEFAULT_DATA })
    }
    return
  }
  
  // Try to use filesystem
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf-8")
    }
  } catch (error) {
    console.warn("[Storage] Filesystem initialization failed, using in-memory storage:", error)
    if (!globalStorage.has(STORAGE_KEY)) {
      globalStorage.set(STORAGE_KEY, { ...DEFAULT_DATA })
    }
  }
}

// Read data
export function readData() {
  try {
    initializeStorage()
    
    const isReadOnly = isReadOnlyFilesystem()
    
    if (isReadOnly || globalStorage.has(STORAGE_KEY)) {
      // Use in-memory storage
      const data = globalStorage.get(STORAGE_KEY)
      // Ensure we always return a valid object
      if (data && typeof data === 'object' && Array.isArray(data.rooms)) {
        return data
      }
      // If data is invalid, reset to default
      const defaultData = { ...DEFAULT_DATA }
      globalStorage.set(STORAGE_KEY, defaultData)
      return defaultData
    }
    
    // Try to read from filesystem
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileData = fs.readFileSync(DATA_FILE, "utf-8")
        const parsed = JSON.parse(fileData)
        // Validate parsed data
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.rooms)) {
          return parsed
        }
        // Invalid data, use default
        console.warn("[Storage] Invalid data in file, using default")
      }
    } catch (error) {
      console.warn("[Storage] Filesystem read failed, using in-memory storage:", error)
    }
    
    // Fallback to in-memory storage with default data
    if (!globalStorage.has(STORAGE_KEY)) {
      globalStorage.set(STORAGE_KEY, { ...DEFAULT_DATA })
    }
    return globalStorage.get(STORAGE_KEY) || { ...DEFAULT_DATA }
  } catch (error) {
    console.error("[Storage] Critical error in readData:", error)
    // Last resort: return default data
    return { ...DEFAULT_DATA }
  }
}

// Write data
export function writeData(data: any): boolean {
  initializeStorage()
  
  const isReadOnly = isReadOnlyFilesystem()
  
  // Update timestamp
  data.lastUpdated = new Date().toISOString()
  
  // Deep copy to avoid reference issues
  const dataCopy = JSON.parse(JSON.stringify(data))
  
  if (isReadOnly || globalStorage.has(STORAGE_KEY)) {
    // Use in-memory storage
    // NOTE: On Vercel, this may not persist between serverless function invocations
    globalStorage.set(STORAGE_KEY, dataCopy)
    if (isReadOnly) {
      console.log("[Storage] Using in-memory storage on Vercel (consider migrating to Vercel KV or database)")
    }
    return true
  }
  
  // Try to write to filesystem
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8")
    return true
  } catch (error) {
    console.warn("[Storage] Filesystem write failed, using in-memory storage:", error)
    // Fallback to in-memory storage
    globalStorage.set(STORAGE_KEY, dataCopy)
    return true
  }
}

// Get storage type (for debugging)
export function getStorageType(): "filesystem" | "memory" {
  const isReadOnly = isReadOnlyFilesystem()
  if (isReadOnly || globalStorage.has(STORAGE_KEY)) {
    return "memory"
  }
  return "filesystem"
}

