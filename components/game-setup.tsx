"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GameSetupProps {
  onStartGame: (teamNames: string[]) => void
}

export default function GameSetup({ onStartGame }: GameSetupProps) {
  const [teamCount, setTeamCount] = useState(2)
  const [teamNames, setTeamNames] = useState(["Đội 1", "Đội 2"])

  const handleTeamCountChange = (count: number) => {
    setTeamCount(count)
    const newNames = Array(count)
      .fill(null)
      .map((_, i) => `Đội ${i + 1}`)
    setTeamNames(newNames)
  }

  const handleTeamNameChange = (index: number, value: string) => {
    const newNames = [...teamNames]
    newNames[index] = value
    setTeamNames(newNames)
  }

  const handleStart = () => {
    if (teamNames.every((name) => name.trim())) {
      onStartGame(teamNames)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Quiz Vận Tốc Lớp 7</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Số lượng đội</label>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((count) => (
                <Button
                  key={count}
                  variant={teamCount === count ? "default" : "outline"}
                  onClick={() => handleTeamCountChange(count)}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Tên các đội</label>
            {teamNames.map((name, index) => (
              <Input
                key={index}
                value={name}
                onChange={(e) => handleTeamNameChange(index, e.target.value)}
                placeholder={`Nhập tên đội ${index + 1}`}
              />
            ))}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-700">
            <p className="font-semibold mb-2">Quy tắc:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>20 giây để suy nghĩ</li>
              <li>5 giây để trả lời</li>
              <li>5 giây chuyển câu hỏi</li>
              <li>Trả lời đúng: +10 điểm</li>
              <li>Trả lời nhanh nhất: +10 điểm thêm</li>
            </ul>
          </div>

          <Button onClick={handleStart} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
            Bắt Đầu Trò Chơi
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
