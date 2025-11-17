"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import AdminQRDisplay from "@/components/admin-qr-display"
import QuestionEditor from "@/components/question-editor"
import ScoreManager from "@/components/score-manager"
import VirtualTeamManager from "@/components/virtual-team-manager"
import RoomCreator from "@/components/room-creator"
import { getTeamAvatar } from "@/lib/team-avatar"

export default function RoomDetailPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params?.id as string

  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showQuestionEditor, setShowQuestionEditor] = useState(false)
  const [showScoreManager, setShowScoreManager] = useState(false)
  const [showVirtualTeamManager, setShowVirtualTeamManager] = useState(false)

  // Real-time polling for room updates
  useEffect(() => {
    let isMounted = true
    
    const loadRoom = async () => {
      if (!isMounted) return
      
      // Load từ cache trước để hiển thị ngay
      const cachedRooms = localStorage.getItem("quiz_rooms_cache")
      if (cachedRooms && isMounted) {
        try {
          const cached = JSON.parse(cachedRooms)
          if (Array.isArray(cached.rooms)) {
            const cachedRoom = cached.rooms.find((r: any) => r.id === roomId)
            if (cachedRoom) {
              setRoom(cachedRoom)
              setLoading(false)
            }
          }
        } catch (e) {
          console.warn("[RoomDetail] Failed to parse cached rooms:", e)
        }
      }
      
      try {
        const roomsRes = await fetch("/api/rooms")
        if (!roomsRes.ok) {
          return
        }
        const allRooms = await roomsRes.json()
        const foundRoom = allRooms.find((r: any) => r.id === roomId)
        
        if (foundRoom && isMounted) {
          setRoom(foundRoom)
          setLoading(false)
          // Cache rooms để dùng khi reload
          localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
            rooms: allRooms, 
            timestamp: Date.now() 
          }))
        } else if (!foundRoom && isMounted) {
          // Room not found, redirect back
          router.push("/admin")
        }
      } catch (e) {
        console.error("[RoomDetail] Failed to load room:", e)
        if (isMounted) {
          setLoading(false)
        }
        // Nếu API fail, giữ nguyên cached room đã load ở trên
      }
    }

    loadRoom()
    
    // Poll for updates every 2 seconds instead of 1 second to reduce API calls
    const interval = setInterval(loadRoom, 2000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [roomId, router])

  const handleUpdateRoom = async (updatedRoom: any) => {
    try {
      const roomsRes = await fetch("/api/rooms")
      if (!roomsRes.ok) {
        throw new Error(`HTTP error! status: ${roomsRes.status}`)
      }
      const allRooms = await roomsRes.json()
      const updatedRooms = allRooms.map((r: any) => 
        r.id === updatedRoom.id ? updatedRoom : r
      )
      
      const saveRes = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRooms),
      })
      
      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to update: ${saveRes.status}`)
      }
      
      const result = await saveRes.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to update room")
      }
      
      setRoom(updatedRoom)
      // Cache rooms để dùng khi reload
      localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
        rooms: updatedRooms, 
        timestamp: Date.now() 
      }))
    } catch (e: any) {
      console.error("[RoomDetail] Failed to update room:", e)
      alert(e?.message || "Không thể cập nhật phòng. Vui lòng thử lại.")
    }
  }

  const handleStartGame = () => {
    if (!room) return
    if ((room.questions || []).length === 0) {
      alert("Vui lòng thêm câu hỏi trước khi bắt đầu game")
      return
    }
    const updatedRoom = { ...room, gameStarted: true }
    handleUpdateRoom(updatedRoom)
  }

  const handleStopGame = () => {
    if (!room) return
    
    if (!confirm("Bạn có chắc muốn dừng game? Tất cả đội ảo và người chơi sẽ bị xóa!")) {
      return
    }
    
    const updatedRoom = { 
      ...room, 
      gameStarted: false, 
      nextQuestionTrigger: null,
      teams: [],
      scores: {},
    }
    handleUpdateRoom(updatedRoom)
    
    // Show success message
    const successMsg = document.createElement('div')
    successMsg.className = 'fixed top-4 right-4 bg-success text-white px-6 py-4 rounded-lg shadow-xl z-50 animate-fade-in-scale'
    successMsg.innerHTML = '✅ Đã dừng game và xóa tất cả đội!'
    document.body.appendChild(successMsg)
    
    setTimeout(() => {
      successMsg.style.opacity = '0'
      successMsg.style.transition = 'opacity 0.5s'
      setTimeout(() => successMsg.remove(), 500)
    }, 3000)
  }

  const handleNextQuestion = () => {
    if (!room) return
    const updatedRoom = { ...room, nextQuestionTrigger: Date.now() }
    handleUpdateRoom(updatedRoom)
  }

  const handleQuestionsUpdate = (updatedQuestions: any[]) => {
    const updated = { ...room, questions: updatedQuestions }
    handleUpdateRoom(updated)
  }

  const handleScoreUpdate = async (team: string, scoreIncrement: number) => {
    // Đọc room mới nhất từ API để đảm bảo có dữ liệu mới nhất
    try {
      const roomsRes = await fetch("/api/rooms")
      const allRooms = await roomsRes.json()
      const currentRoom = allRooms.find((r: any) => r.id === room.id)
      
      if (!currentRoom) {
        console.error("[Admin] Room not found")
        return
      }
      
      // Cập nhật điểm cho đội được chọn từ room mới nhất
      const updatedTeams = (currentRoom.teams || []).map((t: any) => {
        const teamName = typeof t === "string" ? t : t.name
        if (teamName === team) {
          const currentScore = typeof t === "object" ? (t.score || 0) : 0
          const isVirtual = typeof t === "object" ? (t.isVirtual || false) : false
          return { name: teamName, score: currentScore + scoreIncrement, isVirtual }
        }
        // Giữ nguyên các đội khác
        return typeof t === "string" ? { name: t, score: 0, isVirtual: false } : t
      })
      
      // Cập nhật scores object để đồng bộ với teams
      const updatedScores: { [key: string]: number } = {}
      updatedTeams.forEach((t: any) => {
        const teamName = typeof t === "string" ? t : t.name
        updatedScores[teamName] = typeof t === "object" ? (t.score || 0) : 0
      })
      
      const updatedRoom = { 
        ...currentRoom, 
        teams: updatedTeams,
        scores: updatedScores
      }
      
      await handleUpdateRoom(updatedRoom)
    } catch (e) {
      console.error("[Admin] Failed to update score:", e)
      alert("Không thể cập nhật điểm. Vui lòng thử lại.")
    }
  }
  
  // Batch update: Cộng điểm cho nhiều đội cùng lúc
  const handleBatchScoreUpdate = async (teams: string[], scoreIncrement: number, questionIndex: number) => {
    try {
      // Đọc room mới nhất từ API
      const roomsRes = await fetch("/api/rooms")
      const allRooms = await roomsRes.json()
      const currentRoom = allRooms.find((r: any) => r.id === room.id)
      
      if (!currentRoom) {
        console.error("[Admin] Room not found")
        return
      }
      
      // Lấy đáp án đúng của câu hỏi
      const question = currentRoom.questions?.[questionIndex]
      const correctAnswer = question ? Number(question.correctAnswer) : null
      
      // Tạo Set để check nhanh
      const teamsToUpdate = new Set(teams)
      
      // Cập nhật điểm cho tất cả các đội đã chọn trong một lần
      const updatedTeams = (currentRoom.teams || []).map((t: any) => {
        const teamName = typeof t === "string" ? t : t.name
        if (teamsToUpdate.has(teamName)) {
          const currentScore = typeof t === "object" ? (t.score || 0) : 0
          const isVirtual = typeof t === "object" ? (t.isVirtual || false) : false
          return { name: teamName, score: currentScore + scoreIncrement, isVirtual }
        }
        // Giữ nguyên các đội khác
        return typeof t === "string" ? { name: t, score: 0, isVirtual: false } : t
      })
      
      // Cập nhật scores object để đồng bộ với teams
      const updatedScores: { [key: string]: number } = {}
      updatedTeams.forEach((t: any) => {
        const teamName = typeof t === "string" ? t : t.name
        updatedScores[teamName] = typeof t === "object" ? (t.score || 0) : 0
      })
      
      // Cập nhật answerHistory: Lưu đáp án đúng cho các đội ảo đã được cộng điểm
      const currentAnswerHistory = currentRoom.answerHistory || {}
      const updatedAnswerHistory: { [teamName: string]: { [questionIndex: number]: number | null } } = { ...currentAnswerHistory }
      
      teams.forEach((teamName) => {
        if (!updatedAnswerHistory[teamName]) {
          updatedAnswerHistory[teamName] = {}
        }
        // Lưu đáp án đúng (vì admin cộng điểm = đội đó trả lời đúng)
        if (correctAnswer !== null) {
          updatedAnswerHistory[teamName][questionIndex] = correctAnswer
        }
      })
      
      const updatedRoom = { 
        ...currentRoom, 
        teams: updatedTeams,
        scores: updatedScores,
        answerHistory: updatedAnswerHistory
      }
      
      await handleUpdateRoom(updatedRoom)
    } catch (e) {
      console.error("[Admin] Failed to batch update scores:", e)
      alert("Không thể cập nhật điểm. Vui lòng thử lại.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Không tìm thấy phòng</p>
          <Button onClick={() => router.push("/admin")}>Quay lại</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/admin")}
            variant="outline"
            className="mb-4"
          >
            ← Quay lại danh sách phòng
          </Button>
          
          <div className="bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl border border-primary/30 p-8">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-bold text-foreground mb-3">{room.name}</h1>
                <p className="text-muted-foreground text-xl mb-6">Chủ đề: {room.topic}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card/90 px-6 py-4 rounded-xl border border-border backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground mb-1">ID phòng</p>
                    <p className="font-mono text-sm font-bold text-foreground break-all">{room.id}</p>
                  </div>
                  <div className="bg-card/90 px-6 py-4 rounded-xl border border-border backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground mb-1">Câu hỏi</p>
                    <p className="text-2xl font-bold text-primary">{room.questions?.length || 0}</p>
                  </div>
                  <div className="bg-card/90 px-6 py-4 rounded-xl border border-border backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground mb-1">Đội tham gia</p>
                    <p className="text-2xl font-bold text-secondary">{room.teams?.length || 0}</p>
                  </div>
                  <div className="bg-card/90 px-6 py-4 rounded-xl border border-border backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground mb-1">Trạng thái</p>
                    <p className="text-lg font-bold">
                      {room.gameStarted ? (
                        <span className="text-success flex items-center gap-2">
                          <span className="animate-pulse">🎮</span> Đang chơi
                        </span>
                      ) : (
                        <span className="text-warning flex items-center gap-2">
                          ⏸️ Đang chờ
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <AdminQRDisplay room={room} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Game Control */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Control Card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                🎮 Điều khiển game
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  {room.gameStarted ? (
                    <Button
                      onClick={handleStopGame}
                      className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-semibold py-6 text-lg"
                    >
                      ⏸️ Dừng game
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStartGame}
                      className="flex-1 bg-gradient-to-r from-success to-success/80 hover:shadow-lg text-white font-semibold py-6 text-lg"
                      disabled={(room.questions?.length || 0) === 0}
                    >
                      ▶️ Bắt đầu game
                    </Button>
                  )}
                </div>
                
                {room.gameStarted && (
                  <Button
                    onClick={handleNextQuestion}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg text-white font-semibold py-6 text-lg"
                  >
                    ⏭️ Tiếp tục câu hỏi tiếp theo
                  </Button>
                )}
              </div>
            </div>

            {/* Time Configuration */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                ⏱️ Cấu hình thời gian
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Thời gian suy nghĩ (giây)</label>
                  <input
                    type="number"
                    value={room.thinkingTime ?? 20}
                    onChange={(e) => {
                      const updatedRoom = { ...room, thinkingTime: parseInt(e.target.value) || 0 }
                      handleUpdateRoom(updatedRoom)
                    }}
                    min="0"
                    className="w-full px-4 py-3 rounded-lg bg-background border-2 border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg font-semibold"
                    placeholder="0 = không giới hạn"
                  />
                  <p className="text-xs text-muted-foreground mt-2">0 = không giới hạn (nhấn tiếp tục)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Thời gian kết quả (giây)</label>
                  <input
                    type="number"
                    value={room.resultTime ?? 5}
                    onChange={(e) => {
                      const updatedRoom = { ...room, resultTime: parseInt(e.target.value) || 0 }
                      handleUpdateRoom(updatedRoom)
                    }}
                    min="0"
                    className="w-full px-4 py-3 rounded-lg bg-background border-2 border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg font-semibold"
                    placeholder="0 = không giới hạn"
                  />
                  <p className="text-xs text-muted-foreground mt-2">0 = không giới hạn (nhấn tiếp tục)</p>
                </div>
              </div>
            </div>

            {/* Lesson Learned */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                📚 Bài học cần rút ra
              </h2>
              <textarea
                value={room.lesson || ""}
                onChange={(e) => {
                  const updatedRoom = { ...room, lesson: e.target.value }
                  handleUpdateRoom(updatedRoom)
                }}
                placeholder="Nhập bài học tổng hợp cần rút ra sau khi hoàn thành tất cả câu hỏi..."
                className="w-full px-4 py-3 rounded-lg bg-background border-2 border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[120px]"
                rows={5}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Bài học này sẽ hiển thị khi kết thúc game
              </p>
            </div>
          </div>

          {/* Right Column - Management Actions */}
          <div className="space-y-6">
            {/* Management Card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                ⚙️ Quản lý phòng
              </h2>
              <div className="space-y-3">
                <Button
                  onClick={() => setShowQuestionEditor(true)}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg text-white font-semibold py-4 text-base"
                >
                  {(room.questions?.length || 0) > 0 ? "✏️ Sửa câu hỏi" : "➕ Thêm câu hỏi"}
                </Button>
                <Button
                  onClick={() => setShowScoreManager(true)}
                  className="w-full bg-gradient-to-r from-secondary to-accent hover:shadow-lg text-white font-semibold py-4 text-base"
                >
                  💯 Cộng điểm
                </Button>
                <Button
                  onClick={() => setShowVirtualTeamManager(true)}
                  variant="outline"
                  className="w-full font-semibold py-4 text-base border-2"
                >
                  👥 Quản lý đội ảo
                </Button>
              </div>
            </div>

            {/* Teams List */}
            {room.teams && room.teams.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  👥 Đội tham gia ({room.teams.length})
                </h2>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {room.teams.map((team: any, index: number) => {
                    const teamName = typeof team === "string" ? team : team.name
                    const score = typeof team === "object" ? (team.score || 0) : 0
                    const isVirtual = typeof team === "object" && team.isVirtual
                    
                    return (
                      <div
                        key={teamName}
                        className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={getTeamAvatar(teamName)} alt={teamName} />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                              {index + 1}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">{teamName}</p>
                            {isVirtual && (
                              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                                Ảo
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">{score}đ</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showQuestionEditor && (
        <QuestionEditor
          room={room}
          onQuestionsUpdate={handleQuestionsUpdate}
          onClose={() => setShowQuestionEditor(false)}
        />
      )}

      {showScoreManager && (
        <ScoreManager
          room={room}
          onScoreUpdate={handleScoreUpdate}
          onBatchScoreUpdate={handleBatchScoreUpdate}
          onClose={() => setShowScoreManager(false)}
        />
      )}

      {showVirtualTeamManager && (
        <VirtualTeamManager
          room={room}
          onUpdateRoom={handleUpdateRoom}
          onClose={() => setShowVirtualTeamManager(false)}
        />
      )}
    </div>
  )
}

