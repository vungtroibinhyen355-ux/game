"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminDashboard from "@/components/admin-dashboard"

export default function AdminPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<any[]>([])

  useEffect(() => {
    // Check authentication
    const savedAuth = localStorage.getItem("teacher_session")
    if (!savedAuth) {
      router.push("/")
      return
    }

    let isMounted = true

    const loadRooms = async () => {
      if (!isMounted) return
      
      // Load từ cache trước để hiển thị ngay
      const cachedRooms = localStorage.getItem("quiz_rooms_cache")
      if (cachedRooms && isMounted) {
        try {
          const cached = JSON.parse(cachedRooms)
          if (Array.isArray(cached.rooms)) {
            setRooms(cached.rooms)
          }
        } catch (e) {
          console.warn("[Admin] Failed to parse cached rooms:", e)
        }
      }
      
      try {
        const roomsRes = await fetch("/api/rooms")
        if (!roomsRes.ok) {
          return
        }
        const parsedRooms = await roomsRes.json()
        if (Array.isArray(parsedRooms) && isMounted) {
          setRooms(parsedRooms)
          // Cache rooms để dùng khi reload
          localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
            rooms: parsedRooms, 
            timestamp: Date.now() 
          }))
        }
      } catch (e) {
        console.error("[Admin] Failed to load rooms:", e)
        // Nếu API fail, giữ nguyên cached data đã load ở trên
      }
    }
    
    // Load immediately
    loadRooms()
    
    // Poll every 3 seconds instead of 1 second to reduce API calls
    const interval = setInterval(loadRooms, 3000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [router])

  const handleCreateRoom = async (roomData: any) => {
    const newRoom = {
      id: Math.random().toString(36).substr(2, 9),
      ...roomData,
      createdAt: new Date(),
      questions: [],
      teams: [],
      gameStarted: false,
      lesson: "",
      thinkingTime: 20,
      resultTime: 5,
      nextQuestionTrigger: null,
    }
    
    try {
      const roomsRes = await fetch("/api/rooms")
      if (!roomsRes.ok) {
        throw new Error(`HTTP error! status: ${roomsRes.status}`)
      }
      const allRooms = await roomsRes.json()
      const updatedRooms = [...allRooms, newRoom]
      
      const saveRes = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRooms),
      })
      
      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to save: ${saveRes.status}`)
      }
      
      const result = await saveRes.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to save room")
      }
      
      // Update local state immediately - no need to poll right away
      setRooms(updatedRooms)
      // Cache rooms để dùng khi reload
      localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
        rooms: updatedRooms, 
        timestamp: Date.now() 
      }))
    } catch (e: any) {
      console.error("[Admin] Failed to create room:", e)
      alert(e?.message || "Không thể tạo phòng. Vui lòng thử lại.")
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const updatedRooms = rooms.filter((r) => r.id !== roomId)
      const saveRes = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRooms),
      })
      
      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to delete: ${saveRes.status}`)
      }
      
      const result = await saveRes.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to delete room")
      }
      
      setRooms(updatedRooms)
      // Cache rooms để dùng khi reload
      localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
        rooms: updatedRooms, 
        timestamp: Date.now() 
      }))
    } catch (e: any) {
      console.error("[Admin] Failed to delete room:", e)
      alert(e?.message || "Không thể xóa phòng. Vui lòng thử lại.")
    }
  }

  const handleUpdateRoom = async (updatedRoom: any) => {
    try {
      const updatedRooms = rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
      const saveRes = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRooms),
      })
      
      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to update: ${saveRes.status}`)
      }
      
      const result = await saveRes.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to update room")
      }
      
      setRooms(updatedRooms)
      // Cache rooms để dùng khi reload
      localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
        rooms: updatedRooms, 
        timestamp: Date.now() 
      }))
    } catch (e: any) {
      console.error("[Admin] Failed to update room:", e)
      alert(e?.message || "Không thể cập nhật phòng. Vui lòng thử lại.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("teacher_session")
    router.push("/")
  }

  return (
    <AdminDashboard
      rooms={rooms}
      onCreateRoom={handleCreateRoom}
      onDeleteRoom={handleDeleteRoom}
      onUpdateRoom={handleUpdateRoom}
      onLogout={handleLogout}
      onBack={() => router.push("/")}
    />
  )
}

