"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getTeamAvatar } from "@/lib/team-avatar"

interface VirtualTeamManagerProps {
  room: any
  onUpdateRoom: (room: any) => void
  onClose: () => void
}

export default function VirtualTeamManager({ room, onUpdateRoom, onClose }: VirtualTeamManagerProps) {
  const [teamName, setTeamName] = useState("")
  const teams = room?.teams || []

  const handleAddVirtualTeam = () => {
    if (!teamName.trim()) {
      alert("Vui lòng nhập tên đội")
      return
    }

    const existingTeam = teams.find((t: any) => {
      const name = typeof t === "string" ? t : t.name
      return name.toLowerCase().trim() === teamName.toLowerCase().trim()
    })

    if (existingTeam) {
      alert("Tên đội đã tồn tại. Vui lòng chọn tên khác.")
      return
    }

    const newTeam = {
      name: teamName.trim(),
      score: 0,
      isVirtual: true, // Mark as virtual team
    }

    const updatedTeams = [...teams, newTeam]
    const updatedRoom = { ...room, teams: updatedTeams }
    onUpdateRoom(updatedRoom)
    setTeamName("")
  }

  const handleRemoveTeam = (teamNameToRemove: string) => {
    const updatedTeams = teams.filter((t: any) => {
      const name = typeof t === "string" ? t : t.name
      return name !== teamNameToRemove
    })
    const updatedRoom = { ...room, teams: updatedTeams }
    onUpdateRoom(updatedRoom)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-scale">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Quản lý đội ảo</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">
            ×
          </button>
        </div>

        {/* Add Virtual Team */}
        <div className="mb-6 p-4 bg-background rounded-lg border border-border">
          <label className="block text-sm font-medium text-foreground mb-2">Thêm đội ảo mới</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nhập tên đội ảo"
              className="flex-1 px-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyPress={(e) => e.key === "Enter" && handleAddVirtualTeam()}
            />
            <Button
              onClick={handleAddVirtualTeam}
              className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg text-white"
            >
              Thêm
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Đội ảo dành cho học sinh không có điện thoại. Admin có thể cộng điểm cho đội ảo.
          </p>
        </div>

        {/* Teams List */}
        <div className="space-y-3 mb-6">
          <h3 className="font-bold text-foreground">Danh sách đội ({teams.length})</h3>
          {teams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có đội nào</p>
          ) : (
            <div className="space-y-2">
              {teams.map((team: any, index: number) => {
                const name = typeof team === "string" ? team : team.name
                const isVirtual = typeof team === "object" && team.isVirtual
                const score = typeof team === "object" ? (team.score || 0) : 0

                return (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={getTeamAvatar(name)} alt={name} />
                        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{name}</p>
                          {isVirtual && (
                            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                              Ảo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{score} điểm</p>
                      </div>
                    </div>
                    {isVirtual && (
                      <Button
                        onClick={() => handleRemoveTeam(name)}
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        Xóa
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg text-white">
          Đóng
        </Button>
      </div>
    </div>
  )
}

