"use client"

import { useMemo } from "react"

interface ScoreboardProps {
  room: any
  scores: { [key: string]: number }
  playerTeam: string
}

export default function Scoreboard({ room, scores, playerTeam }: ScoreboardProps) {
  const sortedTeams = useMemo(() => {
    if (!room.teams) return []
    return [...room.teams].sort((a, b) => (scores[b.name] || 0) - (scores[a.name] || 0))
  }, [room.teams, scores])

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

  return (
    <div className="mb-8 bg-card rounded-2xl border border-border p-6">
      <h3 className="font-bold text-foreground mb-4">Live Scores</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sortedTeams.map((team, idx) => (
          <div
            key={team.name}
            className={`p-4 rounded-xl border-2 transition-all ${
              team.name === playerTeam ? "bg-primary/20 border-primary" : "bg-background border-border"
            }`}
          >
            <div className="text-xl font-bold text-center mb-2">{getMedalEmoji(idx)}</div>
            <p className="text-sm font-semibold text-foreground text-center truncate">{team.name}</p>
            <p className="text-2xl font-bold text-center text-primary">{scores[team.name] || 0}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
