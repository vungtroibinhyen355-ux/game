"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ResultsProps {
  teams: string[]
  scores: { [key: string]: number }
  onRestart: () => void
}

export default function Results({ teams, scores, onRestart }: ResultsProps) {
  const sortedTeams = [...teams].sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
  const maxScore = Math.max(...sortedTeams.map((t) => scores[t] || 0))

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">🎉 Kết Quả Cuối Cùng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {sortedTeams.map((team, index) => (
              <div
                key={team}
                className={`p-4 rounded-lg flex items-center justify-between ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-400"
                    : index === 1
                      ? "bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-300"
                      : index === 2
                        ? "bg-gradient-to-r from-orange-100 to-orange-50 border-2 border-orange-300"
                        : "bg-gray-50 border-2 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                  </span>
                  <span className="text-xl font-bold text-gray-800">{team}</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{scores[team] || 0} điểm</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Đội chiến thắng: <span className="font-bold text-blue-600">{sortedTeams[0]}</span>
            </p>
          </div>

          <Button onClick={onRestart} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
            Chơi Lại
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
