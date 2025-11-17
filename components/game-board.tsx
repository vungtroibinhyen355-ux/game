"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import CelebrationEffects from "./celebration-effects"
import RankingChangeModal from "./ranking-change-modal"
import MultiplierNotificationModal from "./multiplier-notification-modal"
import { getTeamAvatar } from "@/lib/team-avatar"

interface GameBoardProps {
  room: any
  playerTeam: string
  onUpdateRoom: (room: any) => void
  onExit: () => void
}

interface TeamRanking {
  name: string
  score: number
  oldPosition: number
  newPosition: number
}

export default function GameBoard({ room, playerTeam, onUpdateRoom, onExit }: GameBoardProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [gamePhase, setGamePhase] = useState<"countdown" | "waiting" | "thinking" | "answering" | "result" | "ended">("countdown")
  const [timeLeft, setTimeLeft] = useState(20)
  const [countdown, setCountdown] = useState(5) // Đếm ngược 5 giây khi bắt đầu game
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showMultiplierModal, setShowMultiplierModal] = useState(false)
  const [waitingForContinue, setWaitingForContinue] = useState(false)
  const [scores, setScores] = useState<{ [key: string]: number }>({})
  const [showCelebration, setShowCelebration] = useState(false)
  const [localRoom, setLocalRoom] = useState(room)
  const [showRankingModal, setShowRankingModal] = useState(false)
  const [rankingChanges, setRankingChanges] = useState<TeamRanking[]>([])
  const [fullRanking, setFullRanking] = useState<Array<{ name: string; score: number; position: number }>>([])
  const previousRankingRef = useRef<Array<{ name: string; score: number }>>([])
  // Track answer choices for statistics
  const [answerStats, setAnswerStats] = useState<{ [questionIndex: number]: { [optionIndex: number]: number } }>({})
  // Track answer history for each team - Initialize from room data if available
  const [answerHistory, setAnswerHistory] = useState<{ [teamName: string]: { [questionIndex: number]: number | null } }>(
    room?.answerHistory || {}
  )
  const gameStartedRef = useRef(false) // Track if game has started
  const celebrationTriggeredRef = useRef(false) // Track if celebration has been triggered for current question

  const questions = localRoom?.questions || []

  // Track last processed nextQuestionTrigger
  const lastTriggerRef = useRef<number | null>(null)
  const gamePhaseRef = useRef(gamePhase)
  
  // Update ref when gamePhase changes
  useEffect(() => {
    gamePhaseRef.current = gamePhase
  }, [gamePhase])

  // Real-time update: Poll room data from API to get latest scores and next question trigger
  // Only poll when in result phase to check for nextQuestionTrigger
  // Parent component (app/page.tsx) handles general room updates
  useEffect(() => {
    // Only poll when in result phase to check for admin's next question trigger
    if (gamePhase !== "result") {
      return
    }
    
    let isMounted = true
    
    const interval = setInterval(async () => {
      if (!isMounted) return
      
      // Double check we're still in result phase using ref
      if (gamePhaseRef.current !== "result") {
        return
      }
      
      try {
        const roomsRes = await fetch("/api/rooms")
        const allRooms = await roomsRes.json()
        const updatedRoom = allRooms.find((r: any) => r.id === room.id)
        
        if (updatedRoom) {
          // Check for next question trigger from admin
          if (updatedRoom.nextQuestionTrigger && 
              updatedRoom.nextQuestionTrigger !== lastTriggerRef.current) {
            // Admin clicked next question button
            lastTriggerRef.current = updatedRoom.nextQuestionTrigger
            moveToNextQuestion()
            // Reset trigger in room
            const resetRoom = { ...updatedRoom, nextQuestionTrigger: null }
            setLocalRoom(resetRoom)
            onUpdateRoom(resetRoom)
            return
          }
          
          // Update local room with latest data (scores are handled by parent)
          setLocalRoom(updatedRoom)
          
          if (updatedRoom.teams) {
            // Include ALL teams (both real and virtual teams) in scores
            // Merge với scores hiện tại để không mất điểm đã cộng local
            setScores((prevScores) => {
              const serverScores: { [key: string]: number } = {}
              updatedRoom.teams.forEach((team: any) => {
                const teamName = typeof team === "string" ? team : team.name
                // Get score from team object, include both real and virtual teams
                serverScores[teamName] = typeof team === "object" ? (team.score || 0) : 0
              })
              
              // Merge: Lấy điểm cao hơn giữa server và local để tránh mất điểm
              // Điều này đảm bảo điểm đã cộng local không bị mất khi polling
              const mergedScores: { [key: string]: number } = {}
              const allTeamNames = new Set([
                ...Object.keys(prevScores),
                ...Object.keys(serverScores)
              ])
              
              allTeamNames.forEach((teamName) => {
                const localScore = prevScores[teamName] || 0
                const serverScore = serverScores[teamName] || 0
                // Lấy điểm cao hơn để đảm bảo không mất điểm
                mergedScores[teamName] = Math.max(localScore, serverScore)
              })
              
              // Chỉ cập nhật nếu có thay đổi
              if (JSON.stringify(mergedScores) !== JSON.stringify(prevScores)) {
                return mergedScores
              }
              return prevScores
            })
            
            // Luôn cập nhật localRoom để có thông tin mới nhất
            setLocalRoom(updatedRoom)
            
            // Đồng bộ answerHistory từ server nếu có
            if (updatedRoom.answerHistory) {
              setAnswerHistory((prev) => {
                // Merge: Giữ lại đáp án của người chơi này nếu đã có, còn lại lấy từ server
                const merged = { ...updatedRoom.answerHistory }
                // Giữ lại đáp án của người chơi này nếu đã trả lời
                if (prev[playerTeam] && prev[playerTeam][currentQuestion] !== undefined) {
                  if (!merged[playerTeam]) {
                    merged[playerTeam] = {}
                  }
                  merged[playerTeam][currentQuestion] = prev[playerTeam][currentQuestion]
                }
                return merged
              })
            }
          }
        }
      } catch (e) {
        console.error("[v0] Failed to fetch room updates:", e)
      }
    }, 2000) // Tăng interval lên 2 giây để giảm số lần gọi API

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [room.id, gamePhase, currentQuestion])

  // Detect when game starts and begin countdown
  useEffect(() => {
    if (localRoom?.gameStarted && !gameStartedRef.current) {
      // Game just started, begin countdown
      gameStartedRef.current = true
      setGamePhase("countdown")
      setCountdown(5)
    } else if (!localRoom?.gameStarted && gameStartedRef.current) {
      // Game stopped, reset về waiting phase
      gameStartedRef.current = false
      setGamePhase("waiting")
      setCountdown(5)
      // Reset các state về trạng thái ban đầu
      setSelectedAnswer(null)
      setShowRankingModal(false)
      setWaitingForContinue(false)
      celebrationTriggeredRef.current = false
      resultPhaseEnteredRef.current = false
    }
  }, [localRoom?.gameStarted])

  // Countdown timer: 5 -> 1 seconds
  useEffect(() => {
    if (gamePhase === "countdown" && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            // Countdown finished, move to waiting phase to start first question
            setGamePhase("waiting")
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gamePhase, countdown])

  // Initialize scores and previous ranking - only once at game start
  // Include ALL teams (both real and virtual) in scores and ranking
  useEffect(() => {
    if (localRoom?.teams && localRoom.teams.length > 0 && Object.keys(scores).length === 0) {
      const initialScores: { [key: string]: number } = {}
      // Include all teams: both real teams and virtual teams
      localRoom.teams.forEach((team: any) => {
        const teamName = typeof team === "string" ? team : team.name
        // Get score from team object, include both real and virtual teams
        initialScores[teamName] = typeof team === "object" ? (team.score || 0) : 0
      })
      setScores(initialScores)
      
      // Initialize previous ranking only once at game start
      // Ranking includes both virtual and real teams
      if (previousRankingRef.current.length === 0) {
        const initialRanking = Object.entries(initialScores)
          .map(([name, score]) => ({ name, score }))
          .sort((a, b) => b.score - a.score)
        previousRankingRef.current = initialRanking
      }
    }
  }, [localRoom?.teams])

  useEffect(() => {
    if (gamePhase === "waiting" && questions.length > 0) {
      const question = questions[currentQuestion]
      const multiplier = question?.multiplier || 1
      
      // Hiển thị modal nếu multiplier >= 2
      if (multiplier >= 2) {
        setShowMultiplierModal(true)
      } else {
        startQuestion()
      }
    }
  }, [gamePhase, questions.length, currentQuestion])

  const startQuestion = () => {
    const question = questions[currentQuestion]
    const thinkingTime = localRoom?.thinkingTime ?? 20
    setGamePhase("thinking")
    setTimeLeft(thinkingTime > 0 ? thinkingTime : 999) // Nếu = 0 thì set lớn để không tự động chuyển
    setSelectedAnswer(null)
    setShowMultiplierModal(false)
  }

  // Track when we enter result phase to show ranking modal
  const resultPhaseEnteredRef = useRef(false)

  // Check for ranking changes when entering result phase (after each question)
  // Tính ranking lại mỗi khi scores thay đổi trong result phase
  useEffect(() => {
    if (gamePhase === "result" && celebrationTriggeredRef.current) {
      // Đợi một chút để đảm bảo scores đã được cập nhật hoàn toàn
      const timeoutId = setTimeout(() => {
        // Check for ranking changes after answering time ends
        // Sử dụng scores mới nhất đã được cập nhật
        const currentRanking = Object.entries(scores)
          .map(([name, score]) => ({ name, score }))
          .sort((a, b) => b.score - a.score)
        
        // Compare with previous ranking
        const changes: TeamRanking[] = []
        const previousRanking = previousRankingRef.current
        
        // Only check if we have a previous ranking to compare with
        if (previousRanking.length > 0) {
          currentRanking.forEach((team, newPos) => {
            const oldPos = previousRanking.findIndex((t) => t.name === team.name)
            if (oldPos !== -1 && oldPos !== newPos) {
              // Position changed
              changes.push({
                name: team.name,
                score: team.score,
                oldPosition: oldPos,
                newPosition: newPos,
              })
            }
          })
        }

        // Update previous ranking for next comparison
        previousRankingRef.current = currentRanking

        // Set full ranking for display (all teams from rank 1 to end)
        const fullRankingData = currentRanking.map((team, index) => ({
          name: team.name,
          score: team.score,
          position: index
        }))
        setFullRanking(fullRankingData)
        setRankingChanges(changes)

        // Chỉ show modal một lần khi vào result phase
        if (!resultPhaseEnteredRef.current) {
          resultPhaseEnteredRef.current = true
          setShowRankingModal(true)
          
          const resultTime = localRoom?.resultTime ?? 5
          
          // Nếu resultTime = 0 thì chờ nhấn tiếp tục, không tự động chuyển
          if (resultTime > 0) {
            // Đóng modal sau khi hiển thị một chút, sau đó tự động chuyển câu hỏi
            setTimeout(() => {
              setShowRankingModal(false)
              // Đợi thêm một chút để đảm bảo modal đã đóng
              setTimeout(() => {
                moveToNextQuestion()
              }, 300)
            }, Math.max(resultTime * 1000, 2000)) // Tối thiểu 2 giây để xem ranking
          } else {
            // Nếu resultTime = 0, đánh dấu đang chờ nhấn tiếp tục
            setWaitingForContinue(true)
          }
        }
      }, 200) // Đợi 200ms để đảm bảo scores đã được cập nhật hoàn toàn
      
      return () => clearTimeout(timeoutId)
    } else if (gamePhase !== "result") {
      // Reset flag when leaving result phase
      resultPhaseEnteredRef.current = false
    }
  }, [gamePhase, scores, currentQuestion, questions.length, localRoom?.resultTime])

  const moveToNextQuestion = () => {
    // Reset flags
    resultPhaseEnteredRef.current = false
    celebrationTriggeredRef.current = false
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setGamePhase("waiting")
      setSelectedAnswer(null)
      setWaitingForContinue(false)
      setShowRankingModal(false) // Ensure modal is closed
    } else {
      setGamePhase("ended")
      setShowRankingModal(false) // Ensure modal is closed
    }
  }

  useEffect(() => {
    // Nếu thời gian = 0 thì không tự động chuyển (chờ nhấn tiếp tục)
    const thinkingTime = localRoom?.thinkingTime ?? 20
    const resultTime = localRoom?.resultTime ?? 5
    
    // Chỉ xử lý chuyển phase khi timeLeft đã về 0
    if (timeLeft === 0) {
      if (gamePhase === "thinking" && thinkingTime > 0) {
        // Chuyển từ thinking sang answering
        setGamePhase("answering")
        setTimeLeft(5) // Thời gian trả lời mặc định 5 giây
        setSelectedAnswer(null) // Reset selected answer khi vào phase answering
      } else if (gamePhase === "answering") {
        // Chuyển từ answering sang result
        setGamePhase("result")
        setTimeLeft(resultTime > 0 ? resultTime : 999)
      } else if (gamePhase === "result" && resultTime > 0 && !showRankingModal) {
        // Tự động chuyển sang câu hỏi tiếp theo khi hết result time và không có ranking modal
        // Đợi một chút để đảm bảo ranking modal đã được xử lý
        const timeoutId = setTimeout(() => {
          moveToNextQuestion()
        }, 100)
        return () => clearTimeout(timeoutId)
      }
      return
    }

    // Chỉ đếm ngược nếu thời gian > 0 và < 999 (không phải vô hạn)
    if (timeLeft > 0 && timeLeft < 999) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [timeLeft, gamePhase, localRoom?.thinkingTime, localRoom?.resultTime, showRankingModal])

  const playApplauseSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const now = audioContext.currentTime

      for (let i = 0; i < 8; i++) {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()

        osc.connect(gain)
        gain.connect(audioContext.destination)

        osc.frequency.value = 150 + i * 30
        osc.type = "square"

        gain.gain.setValueAtTime(0.3, now + i * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.1)

        osc.start(now + i * 0.1)
        osc.stop(now + i * 0.1 + 0.1)
      }
    } catch (err) {
      console.error("[v0] Audio context error:", err)
    }
  }

  // Âm thanh vui vẻ, cute khi trả lời đúng
  const playCorrectSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const now = audioContext.currentTime

      // Tạo chuỗi nốt nhạc vui tươi (C major scale ascending)
      const notes = [523.25, 587.33, 659.25, 783.99] // C5, D5, E5, G5
      
      notes.forEach((freq, index) => {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()

        osc.connect(gain)
        gain.connect(audioContext.destination)

        osc.frequency.value = freq
        osc.type = "sine" // Sine wave mềm mại hơn

        // Tạo hiệu ứng fade in/out mềm mại
        gain.gain.setValueAtTime(0, now + index * 0.1)
        gain.gain.linearRampToValueAtTime(0.2, now + index * 0.1 + 0.05)
        gain.gain.linearRampToValueAtTime(0, now + index * 0.1 + 0.15)

        osc.start(now + index * 0.1)
        osc.stop(now + index * 0.1 + 0.15)
      })

      // Thêm một nốt cao kết thúc vui vẻ
      const finalOsc = audioContext.createOscillator()
      const finalGain = audioContext.createGain()
      finalOsc.connect(finalGain)
      finalGain.connect(audioContext.destination)
      finalOsc.frequency.value = 1046.50 // C6
      finalOsc.type = "sine"
      finalGain.gain.setValueAtTime(0, now + 0.4)
      finalGain.gain.linearRampToValueAtTime(0.25, now + 0.45)
      finalGain.gain.linearRampToValueAtTime(0, now + 0.6)
      finalOsc.start(now + 0.4)
      finalOsc.stop(now + 0.6)
    } catch (err) {
      console.error("[v0] Correct sound error:", err)
    }
  }

  // Âm thanh nhẹ nhàng, cute khi trả lời sai (không quá tiêu cực)
  const playIncorrectSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const now = audioContext.currentTime

      // Tạo âm thanh nhẹ nhàng với 2 nốt thấp hơn
      const notes = [392.00, 349.23] // G4, F4 - nốt thấp hơn, nhẹ nhàng hơn
      
      notes.forEach((freq, index) => {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()

        osc.connect(gain)
        gain.connect(audioContext.destination)

        osc.frequency.value = freq
        osc.type = "sine" // Sine wave mềm mại

        // Tạo hiệu ứng nhẹ nhàng, không quá mạnh
        gain.gain.setValueAtTime(0, now + index * 0.15)
        gain.gain.linearRampToValueAtTime(0.15, now + index * 0.15 + 0.08)
        gain.gain.linearRampToValueAtTime(0, now + index * 0.15 + 0.2)

        osc.start(now + index * 0.15)
        osc.stop(now + index * 0.15 + 0.2)
      })
    } catch (err) {
      console.error("[v0] Incorrect sound error:", err)
    }
  }

  const handleAnswer = (answerIndex: number) => {
    // Chỉ cho phép chọn đáp án khi ở phase "answering" và chưa chọn đáp án nào
    if (gamePhase !== "answering" || selectedAnswer !== null) {
      return
    }

    // Chỉ lưu đáp án được chọn, không hiển thị kết quả ngay
    setSelectedAnswer(answerIndex)
    const question = questions[currentQuestion]

    // Update answer statistics
    setAnswerStats((prev) => {
      const newStats = { ...prev }
      if (!newStats[currentQuestion]) {
        newStats[currentQuestion] = {}
      }
      newStats[currentQuestion][answerIndex] = (newStats[currentQuestion][answerIndex] || 0) + 1
      return newStats
    })

    // Track answer history for this team
    setAnswerHistory((prev) => {
      const newHistory = { ...prev }
      if (!newHistory[playerTeam]) {
        newHistory[playerTeam] = {}
      }
      newHistory[playerTeam][currentQuestion] = answerIndex
      return newHistory
    })

    // Không phát âm thanh hay celebration ở đây - sẽ phát khi vào result phase
  }

  // Xử lý kết quả và celebration khi chuyển sang result phase
  useEffect(() => {
    if (gamePhase === "result" && selectedAnswer !== null && !celebrationTriggeredRef.current) {
      celebrationTriggeredRef.current = true
      
      const question = questions[currentQuestion]
      const isCorrect = selectedAnswer === Number(question.correctAnswer)

      // Phát âm thanh và celebration dựa trên kết quả
      if (isCorrect) {
        setShowCelebration(true)
        playCorrectSound() // Âm thanh vui vẻ khi đúng
        playApplauseSound() // Giữ lại âm thanh vỗ tay
        setTimeout(() => setShowCelebration(false), 3000)

        // Tính điểm tự động dựa trên difficulty
        const getBasePoints = (difficulty: string) => {
          switch (difficulty) {
            case "easy": return 5
            case "medium": return 10
            case "hard": return 15
            default: return 10
          }
        }
        const basePoints = getBasePoints(question.difficulty || "medium")
        const multiplier = question.difficulty === "hard" ? 2 : 1
        const finalPoints = basePoints * multiplier

        // Cập nhật điểm ngay lập tức cho người chơi thật
        setScores((prevScores) => {
          const currentScore = prevScores[playerTeam] || 0
          const newScore = currentScore + finalPoints
          const newScores = {
            ...prevScores,
            [playerTeam]: newScore,
          }
          
          // Cập nhật room với điểm mới - đảm bảo giữ lại điểm của tất cả các đội (bao gồm đội ảo)
          const updatedTeams = (localRoom.teams || []).map((t: any) => {
            const teamName = typeof t === "string" ? t : t.name
            if (teamName === playerTeam) {
              // Cập nhật điểm cho đội của người chơi này
              const isVirtual = typeof t === "object" ? (t.isVirtual || false) : false
              return { 
                name: teamName, 
                score: newScore, // Sử dụng điểm mới đã tính
                isVirtual: isVirtual
              }
            } else {
              // Giữ nguyên điểm của các đội khác (bao gồm đội ảo)
              // Lấy điểm từ prevScores (đã có điểm của đội ảo từ admin) hoặc từ team object
              const isVirtual = typeof t === "object" ? (t.isVirtual || false) : false
              // Ưu tiên lấy từ prevScores (có thể đã được admin cập nhật), nếu không thì từ team object
              const teamScore = prevScores[teamName] !== undefined 
                ? prevScores[teamName]
                : (typeof t === "object" ? (t.score || 0) : 0)
              return {
                name: teamName,
                score: teamScore,
                isVirtual: isVirtual
              }
            }
          })
          
          // Cập nhật answerHistory trong room data để đồng bộ với server
          const currentAnswerHistory = localRoom.answerHistory || {}
          const updatedAnswerHistory = {
            ...currentAnswerHistory,
            [playerTeam]: {
              ...(currentAnswerHistory[playerTeam] || {}),
              [currentQuestion]: selectedAnswer // Lưu đáp án của người chơi này
            }
          }
          
          const updatedRoom = {
            ...localRoom,
            scores: newScores,
            teams: updatedTeams,
            answerHistory: updatedAnswerHistory
          }
          setLocalRoom(updatedRoom)
          onUpdateRoom(updatedRoom)
          
          return newScores
        })
      } else {
        playIncorrectSound() // Âm thanh nhẹ nhàng khi sai
      }
    } else if (gamePhase !== "result") {
      // Reset flag khi rời khỏi result phase
      celebrationTriggeredRef.current = false
    }
  }, [gamePhase, selectedAnswer, currentQuestion, questions, playerTeam, localRoom])

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-2xl w-full text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Chưa có câu hỏi</h1>
          <p className="text-muted-foreground mb-6">Giáo viên vui lòng thêm câu hỏi vào phòng</p>
          <Button onClick={onExit} className="bg-gradient-to-r from-primary to-secondary">
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]

  if (gamePhase === "ended") {
    // Final ranking includes ALL teams (both real and virtual)
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
    const totalQuestions = questions.length
    const maxScore = Math.max(...Object.values(scores), 1) // Avoid division by zero
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-6">
              Kết thúc trò chơi! 🎉
            </h1>
            
            {/* Final Ranking with Avatars */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Bảng xếp hạng cuối cùng</h2>
              <div className="space-y-3">
                {sorted.map(([team, score], idx) => {
                  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
                  const scoreOutOf10 = maxScore > 0 ? Math.round((score / maxScore) * 10 * 10) / 10 : 0
                  return (
                    <div
                      key={team}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border-2 border-border hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl w-8">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}</span>
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          <AvatarImage src={getTeamAvatar(team)} alt={team} />
                          <AvatarFallback>{team.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-bold text-foreground">{team}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{scoreOutOf10}/10</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl sm:text-2xl font-bold text-primary">{score} điểm</p>
                        <p className="text-xs text-muted-foreground">{percentage}%</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Answer Statistics with Chart */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">📊 Thống kê lựa chọn đáp án</h2>
              <div className="space-y-4">
                {questions.map((q: any, qIdx: number) => {
                  const stats = answerStats[qIdx] || {}
                  const totalAnswers = Object.values(stats).reduce((sum: number, count: number) => sum + count, 0) || 1
                  const correctOption = Number(q.correctAnswer)
                  
                  return (
                    <div key={qIdx} className="bg-background rounded-lg border border-border p-4">
                      <p className="font-semibold text-foreground mb-3">Câu {qIdx + 1}: {q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt: string, optIdx: number) => {
                          const count = stats[optIdx] || 0
                          const percentage = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0
                          const isCorrect = optIdx === correctOption
                          
                          return (
                            <div key={optIdx} className="space-y-1">
                              <div className={`flex items-center justify-between p-2 rounded ${
                                isCorrect ? "bg-green-100 border border-green-500 dark:bg-green-900/30" : "bg-background border border-border"
                              }`}>
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${isCorrect ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>
                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                  </span>
                                  {isCorrect && <span className="text-green-700 dark:text-green-400">✓</span>}
                                </div>
                                <span className={`text-sm font-semibold ${isCorrect ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                                  {count}/{totalAnswers} ({percentage}%)
                                </span>
                              </div>
                              {/* Bar chart */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${
                                      isCorrect 
                                        ? "bg-gradient-to-r from-green-500 to-green-600" 
                                        : "bg-gradient-to-r from-gray-400 to-gray-500"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Answer History by Team */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">📝 Lịch sử đáp án theo đội</h2>
              <div className="space-y-4">
                {sorted.map(([team, score], idx) => {
                  const teamHistory = answerHistory[team] || {}
                  return (
                    <div key={team} className="bg-background rounded-lg border border-border p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={getTeamAvatar(team)} alt={team} />
                          <AvatarFallback>{team.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground">{team}</p>
                          <p className="text-sm text-muted-foreground">{score} điểm</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {questions.map((q: any, qIdx: number) => {
                          const answer = teamHistory[qIdx]
                          const isCorrect = answer !== null && answer === Number(q.correctAnswer)
                          const hasAnswer = answer !== null && answer !== undefined
                          
                          return (
                            <div
                              key={qIdx}
                              className={`p-2 rounded text-center text-xs font-semibold ${
                                hasAnswer
                                  ? isCorrect
                                    ? "bg-green-100 border border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-red-100 border border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-gray-100 border border-gray-300 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              <div className="text-xs mb-1">Câu {qIdx + 1}</div>
                              <div className="text-lg">
                                {hasAnswer ? (
                                  <>
                                    {String.fromCharCode(65 + answer)}
                                    {isCorrect ? " ✓" : " ✗"}
                                  </>
                                ) : (
                                  "-"
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Lessons Learned - Room level lesson */}
            {localRoom?.lesson && localRoom.lesson.trim() && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-4">📚 Bài học cần rút ra</h2>
                <div className="bg-primary/10 rounded-lg border border-primary/30 p-4 sm:p-6">
                  <p className="text-foreground whitespace-pre-line leading-relaxed">{localRoom.lesson}</p>
                </div>
              </div>
            )}

            {/* Lessons Learned - Per question (optional, if exists) */}
            {questions.some((q: any) => q.desc && q.desc.trim()) && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-4">💡 Bài học từng câu hỏi</h2>
                <div className="space-y-4">
                  {questions.map((q: any, qIdx: number) => {
                    if (!q.desc || !q.desc.trim()) return null
                    return (
                      <div key={qIdx} className="bg-secondary/10 rounded-lg border border-secondary/30 p-4">
                        <p className="font-semibold text-secondary mb-2">Câu {qIdx + 1}: {q.question}</p>
                        <p className="text-foreground">{q.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <Button onClick={onExit} className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg text-white">
              Quay lại Lobby
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Countdown screen when game starts
  if (gamePhase === "countdown") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent mb-8 animate-bounce-pop">
            {countdown > 0 ? countdown : "🎮"}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {countdown > 0 ? "Chuẩn bị bắt đầu!" : "Bắt đầu!"}
          </h2>
          <p className="text-muted-foreground text-lg">
            {countdown > 0 ? `Câu hỏi sẽ bắt đầu sau ${countdown} giây...` : "Chúc bạn may mắn! 🍀"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-3 sm:p-6">
      {showCelebration && <CelebrationEffects trigger={showCelebration} />}
      {showMultiplierModal && questions[currentQuestion] && (
        <MultiplierNotificationModal
          multiplier={questions[currentQuestion]?.multiplier || 1}
          questionNumber={currentQuestion + 1}
          totalQuestions={questions.length}
          onContinue={startQuestion}
        />
      )}
      {showRankingModal && (
        <RankingChangeModal
          rankingChanges={rankingChanges}
          fullRanking={fullRanking}
          onClose={() => {
            setShowRankingModal(false)
            if (waitingForContinue) {
              moveToNextQuestion()
            }
          }}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Câu hỏi {currentQuestion + 1}/{questions.length}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Đội: {playerTeam}</p>
          </div>
          <Button onClick={onExit} variant="outline" className="w-full sm:w-auto">
            Thoát
          </Button>
        </div>

        {/* Question Display */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-8 mb-4 sm:mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-base sm:text-lg text-primary font-semibold">
                {gamePhase === "thinking" && `⏳ Suy nghĩ... ${timeLeft}s`}
                {gamePhase === "answering" && `📝 Trả lời! ${timeLeft}s`}
                {gamePhase === "result" && `✓ Kết quả ${timeLeft}s`}
              </p>
              {question?.multiplier && question.multiplier >= 2 && (
                <span className="px-3 py-1 rounded-full bg-warning/20 text-warning font-bold text-sm sm:text-base animate-pulse">
                  ⚡ x{question.multiplier} Điểm
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{question.question}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Độ khó: {question.difficulty === "easy" ? "Dễ" : question.difficulty === "medium" ? "Trung bình" : "Khó"}</span>
              <span>•</span>
              <span>Điểm: {question.points || 10}{question?.multiplier && question.multiplier > 1 ? ` x${question.multiplier}` : ""}</span>
            </div>
          </div>

          {/* Answers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            {question.options.map((option: string, idx: number) => {
              const isSelected = selectedAnswer === idx
              const isCorrect = idx === Number(question.correctAnswer)
              const showResult = gamePhase === "result"
              
              // Trong phase answering: chỉ highlight đáp án được chọn
              // Trong phase result: hiển thị đúng (xanh) và sai (đỏ)
              let buttonClasses = "p-3 sm:p-4 rounded-lg border-2 text-left font-semibold transition-all text-sm sm:text-base "
              
              if (showResult) {
                // Result phase: hiển thị đúng/sai
                if (isCorrect) {
                  // Đáp án đúng: màu xanh
                  buttonClasses += "border-green-500 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                } else if (isSelected) {
                  // Đáp án sai được chọn: màu đỏ
                  buttonClasses += "border-red-500 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                } else {
                  // Đáp án khác: màu xám
                  buttonClasses += "border-gray-300 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }
              } else if (gamePhase === "answering") {
                // Answering phase: chỉ highlight đáp án được chọn
                if (isSelected) {
                  buttonClasses += "border-primary bg-primary/10 text-primary"
                } else {
                  buttonClasses += "border-border hover:border-primary bg-background"
                }
              } else {
                // Thinking phase: không highlight
                buttonClasses += "border-border bg-background"
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={gamePhase !== "answering" || selectedAnswer !== null}
                  className={`${buttonClasses} ${gamePhase !== "answering" || selectedAnswer !== null ? "" : "cursor-pointer"}`}
                >
                  {String.fromCharCode(65 + idx)}. {option}
                  {showResult && isCorrect && " ✓"}
                  {showResult && isSelected && !isCorrect && " ✗"}
                </button>
              )
            })}
          </div>
        </div>

        {/* Result Display - Show correct answer and lesson */}
        {gamePhase === "result" && (
          <div className="space-y-4 mb-4">
            {/* Correct Answer */}
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3">Đáp án đúng</h3>
                <div className="inline-block px-6 py-3 rounded-xl bg-green-100 border-2 border-green-500 dark:bg-green-900/30">
                  <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">
                    {String.fromCharCode(65 + Number(question.correctAnswer))}. {question.options[Number(question.correctAnswer)]} ✓
                  </p>
                </div>
                {selectedAnswer !== null && (
                  <p className={`mt-4 text-sm font-semibold ${
                    selectedAnswer === Number(question.correctAnswer) 
                      ? "text-green-700 dark:text-green-400" 
                      : "text-gray-600 dark:text-gray-400"
                  }`}>
                    {selectedAnswer === Number(question.correctAnswer) 
                      ? "🎉 Bạn trả lời đúng!" 
                      : "Bạn đã chọn sai đáp án"}
                  </p>
                )}
              </div>
            </div>

            {/* Lesson from this question */}
            {question.desc && question.desc.trim() && (
              <div className="bg-primary/10 rounded-2xl border border-primary/30 p-4 sm:p-6">
                <h3 className="text-lg font-bold text-primary mb-2">💡 Bài học rút ra</h3>
                <p className="text-foreground whitespace-pre-line">{question.desc}</p>
              </div>
            )}

            {/* Info message if resultTime = 0 - Admin will control via dashboard */}
            {localRoom?.resultTime === 0 && (
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/30">
                <p className="text-sm text-muted-foreground">
                  ⏳ Đang chờ giáo viên tiếp tục câu hỏi tiếp theo...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
