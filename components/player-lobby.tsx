"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import QRCodeReader from "./qr-code-reader"

interface PlayerLobbyProps {
  rooms: any[]
  onJoinRoom: (roomId: string, teamName: string) => void
  onBack: () => void
}

const ANIMALS = [
  { emoji: "🐱", name: "Mèo" },
  { emoji: "🐶", name: "Chó" },
  { emoji: "🐰", name: "Thỏ" },
  { emoji: "🦊", name: "Cáo" },
  { emoji: "🐼", name: "Gấu Trúc" },
  { emoji: "🐮", name: "Bò" },
  { emoji: "🐷", name: "Lợn" },
  { emoji: "🐸", name: "Ếu" },
  { emoji: "🦁", name: "Sư tử" },
  { emoji: "🐯", name: "Hổ" },
  { emoji: "🦄", name: "Kỳ lân" },
  { emoji: "🦋", name: "Bướm" },
]

const getRandomAnimal = () => ANIMALS[Math.floor(Math.random() * ANIMALS.length)]

export default function PlayerLobby({ rooms, onJoinRoom, onBack }: PlayerLobbyProps) {
  const [useQR, setUseQR] = useState(false)
  const [roomId, setRoomId] = useState("")
  const [teamName, setTeamName] = useState("")
  const [selectedAnimal] = useState(getRandomAnimal())

  const handleJoin = () => {
    if (roomId && teamName) {
      const roomExists = rooms.some(r => r.id === roomId)
      if (!roomExists) {
        alert("Phòng không tồn tại. Vui lòng kiểm tra ID hoặc quét QR lại.")
        return
      }
      
      // Check for duplicate team name in the selected room
      const selectedRoom = rooms.find(r => r.id === roomId)
      if (selectedRoom) {
        const existingTeam = (selectedRoom.teams || []).find((t: any) => {
          const name = typeof t === "string" ? t : t.name
          return name.toLowerCase().trim() === teamName.toLowerCase().trim()
        })
        
        if (existingTeam) {
          alert("Tên đội đã tồn tại trong phòng này. Vui lòng chọn tên khác.")
          return
        }
      }
      
      onJoinRoom(roomId, teamName.trim())
    }
  }

  const handleQRScanned = (data: string) => {
    try {
      let extractedRoomId = data
      try {
        const parsed = JSON.parse(data)
        extractedRoomId = parsed.roomId || data
      } catch {
        // Not JSON, assume it's plain roomId
        extractedRoomId = data
      }
      
      setRoomId(extractedRoomId.trim())
      setUseQR(false)
    } catch (err) {
      console.error("[v0] QR scan error:", err)
      alert("Mã QR không hợp lệ")
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
            Tham gia trò chơi
          </h1>
          <Button onClick={onBack} variant="outline" className="w-full sm:w-auto">
            Quay lại
          </Button>
        </div>

        {useQR ? (
          <>
            <QRCodeReader onQRScanned={handleQRScanned} />
            <Button onClick={() => setUseQR(false)} variant="outline" className="w-full mt-4">
              Hoặc nhập ID phòng thủ công
            </Button>
          </>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-8">
            <div className="text-center mb-6">
              <div className="text-6xl sm:text-7xl mb-3 inline-block animate-bounce">{selectedAnimal.emoji}</div>
              <p className="text-base sm:text-lg font-semibold text-primary">{selectedAnimal.name} đợi bạn!</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">ID phòng hoặc quét mã QR</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Nhập ID phòng"
                    className="flex-1 px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  />
                  <Button onClick={() => setUseQR(true)} variant="outline" className="sm:w-auto">
                    Quét QR
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tên đội của bạn</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Nhập tên đội"
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                />
              </div>

              <Button
                onClick={handleJoin}
                disabled={!roomId || !teamName}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg disabled:opacity-50 text-sm sm:text-base py-2 sm:py-3"
              >
                Tham gia trò chơi
              </Button>
            </div>

            {rooms.length > 0 && (
              <>
                <div className="border-t border-border my-6" />
                <h3 className="font-bold text-foreground mb-3 text-sm sm:text-base">Các phòng khả dụng</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setRoomId(room.id)}
                      className={`w-full p-3 rounded-lg text-left transition-all text-sm sm:text-base ${
                        roomId === room.id ? "bg-primary/20 border-primary" : "bg-background border-border"
                      } border hover:border-primary/50`}
                    >
                      <p className="font-semibold text-foreground">{room.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{room.topic}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
