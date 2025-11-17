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

    const loadRooms = async () => {
      try {
        const roomsRes = await fetch("/api/rooms")
        const parsedRooms = await roomsRes.json()
        if (Array.isArray(parsedRooms)) {
          setRooms(parsedRooms)
        }
      } catch (e) {
        console.error("[Admin] Failed to load rooms:", e)
      }
    }
    loadRooms()
    
    const interval = setInterval(loadRooms, 1000)
    return () => clearInterval(interval)
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
      
      setRooms(updatedRooms)
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

