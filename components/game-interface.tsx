"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import CelebrationEffects from "./celebration-effects"
import Scoreboard from "./scoreboard"

interface GameInterfaceProps {
  room: any
  playerTeam: string
  onExit: () => void
}

export default function GameInterface({ room, playerTeam, onExit }: GameInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20)
  const [gamePhase, setGamePhase] = useState<"thinking" | "answering" | "result" | "transition" | "finished">(
    "thinking",
  )
  const [scores, setScores] = useState<{ [key: string]: number }>({})
  const [answerTimes, setAnswerTimes] = useState<{ [key: string]: number[] }>({})
  const [celebrateAnswer, setCelebrateAnswer] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)

  // Initialize scores
  useEffect(() => {
    const initialScores: { [key: string]: number } = {}
    const initialTimes: { [key: string]: number[] } = {}
    room.teams?.forEach((team: any) => {
      initialScores[team.name] = 0
      initialTimes[team.name] = []
    })
    setScores(initialScores)
    setAnswerTimes(initialTimes)
    setQuestionStartTime(Date.now())
  }, [room])

  // Timer effect
  useEffect(() => {
    if (gamePhase === "finished") return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (gamePhase === "thinking") {
            setGamePhase("answering")
            return 5
          } else if (gamePhase === "answering") {
            setGamePhase("result")
            return 5
          } else if (gamePhase === "result") {
            if (currentQuestion < room.questions.length - 1) {
              setCurrentQuestion(currentQuestion + 1)
              setGamePhase("thinking")
              setSelectedAnswer(null)
              setShowResult(false)
              setQuestionStartTime(Date.now())
              return 20
            } else {
              setGamePhase("finished")
              return 0
            }
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [gamePhase, currentQuestion, room.questions.length])

  const handleAnswerSubmit = (answerIdx: number) => {
    if (gamePhase !== "answering") return

    setSelectedAnswer(answerIdx)
    const correct = answerIdx === room.questions[currentQuestion].correctAnswer
    const responseTime = (Date.now() - questionStartTime) / 1000

    if (correct) {
      setIsCorrect(true)
      setCelebrateAnswer(true)

      const pointsEarned = room.questions[currentQuestion].points || 10
      setScores((prev) => ({
        ...prev,
        [playerTeam]: (prev[playerTeam] || 0) + pointsEarned,
      }))

      setAnswerTimes((prev) => ({
        ...prev,
        [playerTeam]: [...(prev[playerTeam] || []), responseTime],
      }))

      setTimeout(() => setCelebrateAnswer(false), 2500)
    } else {
      setIsCorrect(false)
    }

    setShowResult(true)
    setGamePhase("result")
  }

  const question = room.questions[currentQuestion]
  const correctAnswerBonus = 10

  if (gamePhase === "finished") {
    const finalScores = room.teams.map((team: any) => ({
      name: team.name,
      score: scores[team.name] || 0,
      avgResponseTime: answerTimes[team.name]?.length
        ? answerTimes[team.name].reduce((a: number, b: number) => a + b, 0) / answerTimes[team.name].length
        : 0,
    }))

    const sortedTeams = finalScores.sort((a: any, b: any) => b.score - a.score)

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl border border-border p-12 max-w-3xl w-full animate-fade-in-scale">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent mb-2 text-center">
            Quiz Complete!
          </h1>
          <p className="text-center text-muted-foreground mb-8">Final Leaderboard</p>

          <div className="space-y-4 mb-8">
            {sortedTeams.map((team: any, idx: number) => {
              const medals = ["🥇", "🥈", "🥉"]
              const medal = medals[idx] || `#${idx + 1}`
              const isYourTeam = team.name === playerTeam

              return (
                <div
                  key={team.name}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    isYourTeam ? "bg-primary/20 border-primary" : "bg-background border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{medal}</span>
                      <div>
                        <p className="font-bold text-foreground">{team.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Avg Response: {team.avgResponseTime.toFixed(1)}s
                        </p>
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                      {team.score}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Button onClick={onExit} className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg">
              Return to Lobby
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Play Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <CelebrationEffects trigger={celebrateAnswer} />

      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {room.name}
              </h1>
              <p className="text-muted-foreground">Playing as: {playerTeam}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Time Left</p>
                <p
                  className={`text-3xl font-bold ${timeLeft <= 5 ? "text-destructive animate-pulse" : "text-primary"}`}
                >
                  {timeLeft}s
                </p>
              </div>
              <Button onClick={onExit} variant="outline">
                Exit
              </Button>
            </div>
          </div>

          {/* Scoreboard */}
          <Scoreboard room={room} scores={scores} playerTeam={playerTeam} />

          {/* Main Game Area */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* Phase Indicator */}
              <div className="mb-4 flex gap-2">
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    gamePhase === "thinking" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  Think ({gamePhase === "thinking" ? timeLeft : "20"}s)
                </span>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    gamePhase === "answering" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                  }`}
                >
                  Answer ({gamePhase === "answering" ? timeLeft : "5"}s)
                </span>
              </div>

              {/* Question Card */}
              <div
                className={`bg-card rounded-2xl border-2 border-border p-8 mb-6 transition-all ${
                  showResult && isCorrect ? "border-success bg-success/5" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-3 py-1 rounded-lg bg-primary/20 text-primary font-bold">
                      Q{currentQuestion + 1}/{room.questions.length}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        question.difficulty === "easy"
                          ? "bg-success/20 text-success"
                          : question.difficulty === "medium"
                            ? "bg-warning/20 text-warning"
                            : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {question.difficulty}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-secondary/20 text-secondary">
                      +{question.points || 10} pts
                    </span>
                  </div>
                  {showResult && (
                    <span className={`text-2xl font-bold ${isCorrect ? "text-success" : "text-destructive"}`}>
                      {isCorrect ? "✓ Correct!" : "✗ Wrong"}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-8">{question.question}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {question.options.map((option: string, idx: number) => {
                    const isSelected = selectedAnswer === idx
                    const isCorrectAnswer = idx === question.correctAnswer
                    const isWrongSelected = isSelected && !isCorrectAnswer

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSubmit(idx)}
                        disabled={gamePhase !== "answering" || showResult}
                        className={`p-6 rounded-xl border-2 transition-all font-medium text-left ${
                          isWrongSelected
                            ? "bg-destructive/20 border-destructive text-destructive"
                            : isSelected && isCorrectAnswer
                              ? "bg-success/20 border-success text-success scale-105"
                              : showResult && isCorrectAnswer
                                ? "bg-success/10 border-success text-success"
                                : isSelected
                                  ? "bg-primary/20 border-primary text-primary"
                                  : "bg-background border-border text-foreground hover:border-primary/50 disabled:opacity-50"
                        }`}
                      >
                        <span className="text-lg">{String.fromCharCode(65 + idx)}.</span> {option}
                        {showResult && isCorrectAnswer && <span className="ml-2">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Progress</span>
                  <span className="text-xs font-medium text-primary">
                    {Math.round(((currentQuestion + 1) / room.questions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                    style={{
                      width: `${((currentQuestion + 1) / room.questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-3">Question Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Questions</p>
                    <p className="text-lg font-bold text-primary">{room.questions.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Phase</p>
                    <p className="text-lg font-bold capitalize text-primary">{gamePhase}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Your Score</p>
                    <p className="text-2xl font-bold text-secondary">{scores[playerTeam] || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 p-6">
                <p className="text-sm font-medium text-foreground mb-2">Scoring Rules:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Correct: +{room.questions[currentQuestion]?.points || 10} pts</li>
                  <li>✓ Fastest: +{correctAnswerBonus} bonus pts</li>
                  <li>Difficulty affects points</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
