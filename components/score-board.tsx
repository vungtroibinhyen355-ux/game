"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ScoreBoardProps {
  teams: string[]
  scores: { [key: string]: number }
}

export default function ScoreBoard({ teams, scores }: ScoreBoardProps) {
  const sortedTeams = [...teams].sort((a, b) => (scores[b] || 0) - (scores[a] || 0))

  return (
    <Card className="shadow-lg sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Bảng Điểm</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedTeams.map((team, index) => (
            <div key={team} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <span className="font-semibold text-sm text-gray-800">{team}</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{scores[team] || 0}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
