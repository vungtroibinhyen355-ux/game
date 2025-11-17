"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface ScoreManagerProps {
  room: any
  onScoreUpdate: (team: string, scoreIncrement: number) => void
  onBatchScoreUpdate?: (teams: string[], scoreIncrement: number, questionIndex: number) => void
  onClose: () => void
}

export default function ScoreManager({ room, onScoreUpdate, onBatchScoreUpdate, onClose }: ScoreManagerProps) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0)
  const [selectedVirtualTeams, setSelectedVirtualTeams] = useState<Set<string>>(new Set())

  const teams = room?.teams || []
  const questions = room?.questions || []
  const virtualTeams = teams.filter((team: any) => {
    const isVirtual = typeof team === "object" && team.isVirtual
    return isVirtual
  })

  const currentQuestion = questions[selectedQuestionIndex]
  // Tính điểm tự động dựa trên difficulty
  const getBasePoints = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return 5
      case "medium": return 10
      case "hard": return 15
      default: return 10
    }
  }
  const basePoints = currentQuestion ? getBasePoints(currentQuestion.difficulty || "medium") : 10
  // Khó tự động x2, không dùng multiplier từ dropdown nữa
  const questionMultiplier = currentQuestion?.difficulty === "hard" ? 2 : 1
  const finalPoints = basePoints * questionMultiplier

  const handleToggleTeam = (teamName: string) => {
    const newSet = new Set(selectedVirtualTeams)
    if (newSet.has(teamName)) {
      newSet.delete(teamName)
    } else {
      newSet.add(teamName)
    }
    setSelectedVirtualTeams(newSet)
  }

  const handleAddScore = async () => {
    if (selectedVirtualTeams.size === 0) {
      alert("Vui lòng chọn ít nhất một đội ảo")
      return
    }

    const teamCount = selectedVirtualTeams.size
    const teamArray = Array.from(selectedVirtualTeams)

    // Sử dụng batch update nếu có, nếu không thì dùng từng cái một
    // Truyền questionIndex để lưu đáp án đúng vào answerHistory
    if (onBatchScoreUpdate) {
      await onBatchScoreUpdate(teamArray, finalPoints, selectedQuestionIndex)
    } else {
      // Fallback: cộng từng đội một (có thể gây race condition)
      for (const teamName of teamArray) {
        await onScoreUpdate(teamName, finalPoints)
      }
    }

    // Reset sau khi cộng điểm
    setSelectedVirtualTeams(new Set())
    alert(`Đã cộng ${finalPoints} điểm cho ${teamCount} đội ảo!`)
  }

  // Reset selected teams when question changes
  useEffect(() => {
    setSelectedVirtualTeams(new Set())
  }, [selectedQuestionIndex])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-scale">
        <h2 className="text-2xl font-bold text-foreground mb-6">Cộng điểm cho đội ảo</h2>

        {/* Question Selection */}
        {questions.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Chọn câu hỏi</label>
            <select
              value={selectedQuestionIndex}
              onChange={(e) => setSelectedQuestionIndex(parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {questions.map((q: any, idx: number) => {
                const getBasePoints = (difficulty: string) => {
                  switch (difficulty) {
                    case "easy": return 5
                    case "medium": return 10
                    case "hard": return 15
                    default: return 10
                  }
                }
                const basePts = getBasePoints(q.difficulty || "medium")
                const finalPts = q.difficulty === "hard" ? basePts * 2 : basePts
                return (
                  <option key={idx} value={idx}>
                    Câu {idx + 1}: {q.question} ({q.difficulty === "easy" ? "Dễ" : q.difficulty === "medium" ? "TB" : "Khó"} - {finalPts}đ)
                  </option>
                )
              })}
            </select>
            {currentQuestion && (
              <div className="mt-2 p-3 bg-background rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Câu hỏi: {currentQuestion.question}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    Điểm cơ bản: {basePoints}đ
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {currentQuestion.difficulty === "hard" ? "Nhân điểm: x2 (tự động)" : "Nhân điểm: x1"}
                    </span>
                    <span className="text-sm font-bold text-primary">= {finalPoints}đ</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Virtual Teams Checkboxes */}
        {virtualTeams.length > 0 ? (
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Chọn đội ảo trả lời đúng ({selectedVirtualTeams.size} đã chọn)
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3 bg-background">
              {virtualTeams.map((team: any) => {
                const teamName = typeof team === "string" ? team : team.name
                const currentScore = typeof team === "object" ? (team.score || 0) : 0
                const isSelected = selectedVirtualTeams.has(teamName)

                return (
                  <label
                    key={teamName}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/20 border-primary"
                        : "bg-card border-border hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleTeam(teamName)}
                      className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{teamName}</p>
                      <p className="text-xs text-muted-foreground">Hiện tại: {currentScore}đ</p>
                    </div>
                    {isSelected && (
                      <span className="text-sm font-bold text-primary">
                        +{finalPoints}đ
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-warning/20 border border-warning rounded-lg">
            <p className="text-sm text-foreground">Chưa có đội ảo nào. Vui lòng tạo đội ảo trước.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleAddScore}
            disabled={selectedVirtualTeams.size === 0}
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:shadow-lg disabled:opacity-50"
          >
            Cộng {finalPoints}đ cho {selectedVirtualTeams.size} đội
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
