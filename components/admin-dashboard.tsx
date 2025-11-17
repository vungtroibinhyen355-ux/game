"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import RoomCreator from "./room-creator"

interface AdminDashboardProps {
  rooms: any[]
  onCreateRoom: (roomData: any) => void
  onDeleteRoom: (roomId: string) => void
  onUpdateRoom: (room: any) => void
  onLogout: () => void
  onBack: () => void
}

export default function AdminDashboard({ rooms, onCreateRoom, onDeleteRoom, onUpdateRoom, onLogout, onBack }: AdminDashboardProps) {
  const router = useRouter()
  const [showRoomCreator, setShowRoomCreator] = useState(false)
  const [localRooms, setLocalRooms] = useState(rooms)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const roomsRes = await fetch("/api/rooms")
        const parsedRooms = await roomsRes.json()
        if (Array.isArray(parsedRooms)) {
          setLocalRooms(parsedRooms)
        }
      } catch (e) {
        console.error("[v0] Failed to load rooms:", e)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setLocalRooms(rooms)
  }, [rooms])

  const handleDeleteRoom = (roomId: string) => {
    if (confirm("Bạn có chắc muốn xóa phòng này?")) {
      onDeleteRoom(roomId)
    }
  }

  const handleRoomClick = (roomId: string) => {
    router.push(`/admin/room/${roomId}`)
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Quản lý phòng quiz và câu hỏi</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setShowRoomCreator(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30"
            >
              Tạo phòng mới
            </Button>
            <Button onClick={onLogout} variant="destructive">
              Đăng xuất
            </Button>
            <Button onClick={onBack} variant="outline">
              Quay lại
            </Button>
          </div>
        </div>

        {/* Main Content - Grid Layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Rooms List - Left Side (Compact) */}
          <div className="lg:col-span-12">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6">Các phòng hoạt động</h2>

              {localRooms.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg mb-4">Chưa có phòng nào</p>
                  <Button onClick={() => setShowRoomCreator(true)} className="bg-primary hover:bg-primary/90">
                    Tạo phòng đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localRooms.map((room) => (
                    <div
                      key={room.id}
                      className="group p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] bg-background border-border hover:border-primary/50"
                      onClick={() => handleRoomClick(room.id)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                              {room.name}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-1">{room.topic}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRoom(room.id)
                            }}
                            className="px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 text-xs font-medium transition-colors flex-shrink-0"
                          >
                            Xóa
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-full font-medium">
                            {room.questions?.length || 0} câu hỏi
                          </span>
                          <span className="text-xs px-3 py-1 bg-secondary/20 text-secondary rounded-full font-medium">
                            {room.teams?.length || 0} đội
                          </span>
                          {room.gameStarted && (
                            <span className="text-xs px-3 py-1 bg-success/20 text-success rounded-full font-medium animate-pulse">
                              🎮 Đang chơi
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-border">
                          <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors text-center">
                            Click để xem chi tiết và quản lý →
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRoomCreator && (
        <RoomCreator
          onCreate={(roomData) => {
            onCreateRoom(roomData)
            setShowRoomCreator(false)
          }}
          onClose={() => setShowRoomCreator(false)}
        />
      )}
    </div>
  )
}
