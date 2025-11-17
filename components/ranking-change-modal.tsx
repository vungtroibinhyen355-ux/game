"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getTeamAvatar } from "@/lib/team-avatar"

interface TeamRanking {
  name: string
  score: number
  oldPosition: number
  newPosition: number
}

interface FullRanking {
  name: string
  score: number
  position: number
}

interface RankingChangeModalProps {
  rankingChanges: TeamRanking[]
  fullRanking: FullRanking[] // Full ranking of all teams
  onClose: () => void
}

export default function RankingChangeModal({ rankingChanges, fullRanking, onClose }: RankingChangeModalProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 500) // Wait for exit animation
    }, 5000) // Show for 5 seconds

    return () => clearTimeout(timer)
  }, [onClose])

  const getPositionChange = (oldPos: number, newPos: number) => {
    const diff = oldPos - newPos
    if (diff > 0) return { type: "up", value: diff }
    if (diff < 0) return { type: "down", value: Math.abs(diff) }
    return { type: "same", value: 0 }
  }

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 0:
        return "🥇"
      case 1:
        return "🥈"
      case 2:
        return "🥉"
      default:
        return `#${position + 1}`
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in-scale overflow-y-auto">
      <div
        className={`bg-card rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-primary shadow-2xl p-4 sm:p-6 md:p-8 max-w-2xl w-full my-auto transition-all duration-500 ${
          isExiting ? "scale-95 opacity-0 translate-y-10" : "scale-100 opacity-100 translate-y-0"
        }`}
      >
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-4xl sm:text-5xl md:text-6xl mb-2 sm:mb-4 animate-bounce-pop">🏆</div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-1 sm:mb-2">
            Thay đổi Bảng xếp hạng!
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Sau câu hỏi này</p>
        </div>

        {/* Top 3 - Display horizontally */}
        {fullRanking.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4 text-center">Top 3</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
              {fullRanking.slice(0, 3).map((team, index) => {
                const change = rankingChanges.find(c => c.name === team.name)
                const changeInfo = change ? getPositionChange(change.oldPosition, change.newPosition) : null
                const oldPos = change ? change.oldPosition : team.position
                const newPos = change ? change.newPosition : team.position
                return (
                  <div
                    key={team.name}
                    className={`p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all animate-slide-in text-center ${
                      changeInfo?.type === "up"
                        ? "bg-success/20 border-success"
                        : changeInfo?.type === "down"
                          ? "bg-destructive/20 border-destructive"
                          : index === 0
                            ? "bg-primary/20 border-primary"
                            : index === 1
                              ? "bg-secondary/20 border-secondary"
                              : "bg-accent/20 border-accent"
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-1 sm:mb-2">
                      <AvatarImage src={getTeamAvatar(team.name)} alt={team.name} />
                      <AvatarFallback className="text-xs sm:text-sm md:text-base">{team.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 animate-bounce-pop" style={{ animationDelay: `${index * 100 + 300}ms` }}>
                      {getMedalEmoji(team.position)}
                    </div>
                    <p className="font-bold text-xs sm:text-sm text-foreground mb-0.5 sm:mb-1 truncate px-1">{team.name}</p>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-primary mb-0.5 sm:mb-1">{team.score}đ</p>
                    {changeInfo && oldPos !== newPos && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {oldPos + 1} → {newPos + 1}
                      </p>
                    )}
                    {changeInfo?.type === "up" && (
                      <div className="text-base sm:text-lg md:text-xl mt-0.5 sm:mt-1 animate-bounce-pop">⬆️</div>
                    )}
                    {changeInfo?.type === "down" && (
                      <div className="text-base sm:text-lg md:text-xl mt-0.5 sm:mt-1 animate-bounce-pop">⬇️</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Rest of ranking - Display horizontally full width */}
        {fullRanking.length > 3 && (
          <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 sm:mb-3">Bảng xếp hạng đầy đủ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {fullRanking.slice(3).map((team, index) => {
                const change = rankingChanges.find(c => c.name === team.name)
                const changeInfo = change ? getPositionChange(change.oldPosition, change.newPosition) : null
                const oldPos = change ? change.oldPosition : team.position
                const newPos = change ? change.newPosition : team.position
                return (
                  <div
                    key={team.name}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition-all animate-slide-in ${
                      changeInfo?.type === "up"
                        ? "bg-success/20 border-success"
                        : changeInfo?.type === "down"
                          ? "bg-destructive/20 border-destructive"
                          : "bg-background border-border"
                    }`}
                    style={{ animationDelay: `${(index + 3) * 50}ms` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="text-sm sm:text-base font-bold text-muted-foreground w-6 sm:w-8 flex-shrink-0">
                          #{team.position + 1}
                        </div>
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                          <AvatarImage src={getTeamAvatar(team.name)} alt={team.name} />
                          <AvatarFallback className="text-xs">{team.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{team.name}</p>
                          {changeInfo && oldPos !== newPos && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {oldPos + 1} → {newPos + 1}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm sm:text-base md:text-lg font-bold text-primary">{team.score}đ</p>
                        </div>
                        {changeInfo?.type === "up" && (
                          <div className="text-base sm:text-lg md:text-xl animate-bounce-pop">⬆️</div>
                        )}
                        {changeInfo?.type === "down" && (
                          <div className="text-base sm:text-lg md:text-xl animate-bounce-pop">⬇️</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4 sm:mt-6 text-center animate-fade-in-scale" style={{ animationDelay: "600ms" }}>
          <button
            onClick={() => {
              setIsExiting(true)
              setTimeout(() => {
                setIsVisible(false)
                onClose()
              }, 500)
            }}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-sm sm:text-base font-semibold hover:shadow-lg transition-all"
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  )
}

