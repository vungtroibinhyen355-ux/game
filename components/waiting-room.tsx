"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getTeamAvatar } from "@/lib/team-avatar"

interface WaitingRoomProps {
  room: any
  playerTeam: string
  onExit: () => void
}

export default function WaitingRoom({ room, playerTeam, onExit }: WaitingRoomProps) {
  const [localRoom, setLocalRoom] = useState(room)

  // Update local room when prop changes (parent component handles polling)
  useEffect(() => {
    setLocalRoom(room)
  }, [room])

  const teams = localRoom?.teams || []
  const gameStarted = localRoom?.gameStarted || false

  // Notify parent when game starts
  useEffect(() => {
    if (gameStarted && !room?.gameStarted) {
      // Dispatch event to notify parent component
      window.dispatchEvent(new CustomEvent('gameStarted', { detail: { roomId: room.id } }))
    }
  }, [gameStarted, room?.gameStarted, room.id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            {localRoom?.name || "Phòng chờ"}
          </h1>
          <p className="text-muted-foreground">Chủ đề: {localRoom?.topic || ""}</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary font-semibold">
            <Avatar className="w-8 h-8">
              <AvatarImage src={getTeamAvatar(playerTeam)} alt={playerTeam} />
              <AvatarFallback>{playerTeam.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>Đội của bạn: {playerTeam}</span>
          </div>
        </div>

        {/* Waiting Status */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-6 text-center">
          {gameStarted ? (
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="text-2xl font-bold text-success">Game đã bắt đầu!</h2>
              <p className="text-muted-foreground">Đang chuyển hướng...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl animate-pulse">⏳</div>
              <h2 className="text-2xl font-bold text-foreground">Đang chờ admin bắt đầu game</h2>
              <p className="text-muted-foreground">Vui lòng đợi giáo viên bắt đầu trò chơi</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Teams List */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Danh sách đội tham gia ({teams.length})</h3>
          {teams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có đội nào tham gia</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {teams.map((team: any, index: number) => {
                const teamName = typeof team === "string" ? team : team.name
                const isPlayerTeam = teamName === playerTeam
                
                return (
                  <div
                    key={teamName}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isPlayerTeam
                        ? "bg-primary/20 border-primary shadow-lg scale-105"
                        : "bg-background border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={getTeamAvatar(teamName)} alt={teamName} />
                        <AvatarFallback>{teamName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm sm:text-base truncate ${isPlayerTeam ? "text-primary" : "text-foreground"}`}>
                          {teamName}
                        </p>
                        {typeof team === "object" && team.score !== undefined && (
                          <p className="text-xs text-muted-foreground">{team.score} điểm</p>
                        )}
                      </div>
                      {isPlayerTeam && (
                        <span className="text-xs px-2 py-1 bg-primary text-white rounded-full">Bạn</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Exit Button */}
        <div className="mt-6 text-center">
          <Button onClick={onExit} variant="outline" className="w-full sm:w-auto">
            Rời khỏi phòng
          </Button>
        </div>
      </div>
    </div>
  )
}

