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
      const allRooms = await roomsRes.json()
      const updatedRooms = [...allRooms, newRoom]
      
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRooms),
      })
      
      setRooms(updatedRooms)
    } catch (e) {
      console.error("[Admin] Failed to create room:", e)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const updatedRooms = rooms.filter((r) => r.id !== roomId)
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRooms),
      })
      setRooms(updatedRooms)
    } catch (e) {
      console.error("[Admin] Failed to delete room:", e)
    }
  }

  const handleUpdateRoom = async (updatedRoom: any) => {
    try {
      const updatedRooms = rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRooms),
      })
      setRooms(updatedRooms)
    } catch (e) {
      console.error("[Admin] Failed to update room:", e)
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

