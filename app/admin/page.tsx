"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminDashboard from "@/components/admin-dashboard"

export default function AdminPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<any[]>([])

  // Check authentication once on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("teacher_session")
    if (!savedAuth) {
      router.push("/")
      return
    }
  }, []) // Chỉ check một lần khi mount

  useEffect(() => {
    // Double check authentication before starting polling
    const savedAuth = localStorage.getItem("teacher_session")
    if (!savedAuth) {
      return // Đã được handle ở useEffect trên
    }

    let isMounted = true

    const loadRooms = async () => {
      if (!isMounted) return
      
      // Check authentication again before each load
      const currentAuth = localStorage.getItem("teacher_session")
      if (!currentAuth) {
        // Auth lost, stop polling but don't redirect here (let first useEffect handle it)
        return
      }
      
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
          console.warn("[Admin] API returned non-OK status:", roomsRes.status)
          return // Giữ nguyên cached data
        }
        const parsedRooms = await roomsRes.json()
        if (Array.isArray(parsedRooms) && isMounted) {
          // Chỉ update nếu có data hợp lệ (không phải empty array do server reset)
          // Hoặc nếu cached data cũng empty thì update
          const cachedRooms = localStorage.getItem("quiz_rooms_cache")
          const hasCachedData = cachedRooms && JSON.parse(cachedRooms).rooms?.length > 0
          
          // Nếu server trả về empty nhưng có cached data, không overwrite
          if (parsedRooms.length === 0 && hasCachedData) {
            console.warn("[Admin] Server returned empty array, keeping cached data")
            return
          }
          
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
  }, []) // Không có router dependency để tránh re-run không cần thiết

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

