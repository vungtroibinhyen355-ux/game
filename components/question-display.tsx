"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

interface QuestionDisplayProps {
  question: Question
  gamePhase: "thinking" | "answering" | "transition" | "ended"
  timeLeft: number
  selectedAnswer: number | null
  isCorrect: boolean | null
  onAnswer: (team: string, answerIndex: number, responseTime: number) => void
  teams: string[]
  selectedTeam: string | null
  fastestTeam: string | null
}

export default function QuestionDisplay({
  question,
  gamePhase,
  timeLeft,
  selectedAnswer,
  isCorrect,
  onAnswer,
  teams,
  selectedTeam,
  fastestTeam,
}: QuestionDisplayProps) {
  const [teamResponseTimes, setTeamResponseTimes] = useState<{ [key: string]: number }>({})
  const [teamThinkingStarted, setTeamThinkingStarted] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    if (gamePhase === "thinking") {
      const now = Date.now()
      const times: { [key: string]: number } = {}
      teams.forEach((team) => {
        times[team] = now
      })
      setTeamThinkingStarted(times)
    }
  }, [gamePhase, teams])

  const handleTeamAnswer = (team: string, answerIndex: number) => {
    if (gamePhase !== "answering" || selectedTeam) return

    const startTime = teamThinkingStarted[team] || Date.now()
    const responseTime = (Date.now() - startTime) / 1000

    setTeamResponseTimes((prev) => ({
      ...prev,
      [team]: responseTime,
    }))

    onAnswer(team, answerIndex, responseTime)
  }

  const getPhaseText = () => {
    if (gamePhase === "thinking") return `Suy nghĩ... (${timeLeft}s)`
    if (gamePhase === "answering") return `Trả lời! (${timeLeft}s)`
    if (gamePhase === "transition") return `Chuyển câu hỏi... (${timeLeft}s)`
    return "Kết thúc"
  }

  const getPhaseColor = () => {
    if (gamePhase === "thinking") return "bg-yellow-100 text-yellow-800"
    if (gamePhase === "answering") return "bg-green-100 text-green-800"
    if (gamePhase === "transition") return "bg-blue-100 text-blue-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">{question.question}</CardTitle>
        <div className={`mt-4 p-3 rounded-lg text-center font-bold ${getPhaseColor()}`}>{getPhaseText()}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, index) => (
            <div key={index} className="space-y-2">
              <button
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                    : selectedAnswer !== null && index === question.correctAnswer
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                } ${gamePhase !== "answering" || selectedTeam ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                disabled={gamePhase !== "answering" || selectedTeam !== null}
              >
                <div className="text-left">
                  <span className="font-semibold text-blue-600">{String.fromCharCode(65 + index)}.</span> {option}
                </div>
              </button>

              {/* Team Answer Buttons */}
              {gamePhase === "answering" && !selectedTeam && (
                <div className="grid grid-cols-2 gap-2 pl-2">
                  {teams.map((team) => (
                    <Button
                      key={`${team}-${index}`}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTeamAnswer(team, index)}
                      className="text-xs"
                    >
                      {team}: {String.fromCharCode(65 + index)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Result Display */}
        {selectedTeam && (
          <div
            className={`p-4 rounded-lg text-center font-semibold ${
              isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            <p>
              {selectedTeam} trả lời: {isCorrect ? "CHÍNH XÁC ✓" : "SAI ✗"}
            </p>
            {fastestTeam && <p className="text-sm mt-2">{fastestTeam} trả lời nhanh nhất! +10 điểm thêm</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
