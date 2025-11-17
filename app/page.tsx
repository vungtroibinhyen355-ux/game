"use client"

import { useState, useEffect, useRef } from "react"
import AdminDashboard from "@/components/admin-dashboard"
import PlayerLobby from "@/components/player-lobby"
import GameBoard from "@/components/game-board"
import WaitingRoom from "@/components/waiting-room"
import LoginPage from "@/components/login-page"

export default function Home() {
  const [appMode, setAppMode] = useState<"role" | "login" | "admin" | "player" | "waiting" | "game">("role")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [currentRoom, setCurrentRoom] = useState<any>(null)
  const [playerTeam, setPlayerTeam] = useState<string>("")
  const [hasRoomIdInURL, setHasRoomIdInURL] = useState(false) // Track if user came from room link

  useEffect(() => {
    const loadData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const roomIdFromURL = urlParams.get("roomId")
        
        // Load rooms từ localStorage cache trước (để hiển thị ngay)
        const cachedRooms = localStorage.getItem("quiz_rooms_cache")
        let parsedRooms: any[] = []
        
        if (cachedRooms) {
          try {
            const cached = JSON.parse(cachedRooms)
            if (Array.isArray(cached.rooms)) {
              parsedRooms = cached.rooms
              setRooms(parsedRooms) // Hiển thị cached data ngay
            }
          } catch (e) {
            console.warn("[v0] Failed to parse cached rooms:", e)
          }
        }
        
        // Nếu có roomId trong URL, BẮT BUỘC vào player mode
        // Không cho phép login admin khi có roomId trong URL
        if (roomIdFromURL) {
          // Đánh dấu rằng user đến từ room link
          setHasRoomIdInURL(true)
          
          // Xóa roomId khỏi URL để tránh confusion
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
          
          // Load rooms from API và sync với cache
          try {
            const roomsRes = await fetch("/api/rooms")
            const apiRooms = await roomsRes.json()
            if (Array.isArray(apiRooms)) {
              parsedRooms = apiRooms
              setRooms(apiRooms)
              // Cache rooms để dùng khi reload
              localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
                rooms: apiRooms, 
                timestamp: Date.now() 
              }))
            }
          } catch (e) {
            console.error("[v0] Failed to fetch rooms from API:", e)
            // Nếu API fail, dùng cached data nếu có
            if (parsedRooms.length === 0) {
              alert("Không thể kết nối server. Vui lòng thử lại.")
            }
          }
          
          // Check if room exists
          const targetRoom = parsedRooms.find((r: any) => r.id === roomIdFromURL)
          if (targetRoom) {
            // Kiểm tra xem người chơi đã join room chưa từ localStorage
            const savedPlayerInfo = localStorage.getItem(`player_room_${roomIdFromURL}`)
            if (savedPlayerInfo) {
              try {
                const playerInfo = JSON.parse(savedPlayerInfo)
                const teamName = playerInfo.teamName
                
                // Kiểm tra xem team còn trong room không (có thể bị xóa khi dừng game)
                const playerStillInRoom = (targetRoom.teams || []).some((t: any) => {
                  const name = typeof t === "string" ? t : t.name
                  return name === teamName
                })
                
                if (playerStillInRoom) {
                  // Người chơi vẫn còn trong room, vào waiting room
                  setCurrentRoom(targetRoom)
                  setPlayerTeam(teamName)
                  // Chỉ vào game nếu game đã bắt đầu, nếu không thì vào waiting room
                  setAppMode(targetRoom.gameStarted ? "game" : "waiting")
                } else {
                  // Người chơi không còn trong room (bị xóa khi dừng game), xóa localStorage và vào player lobby
                  localStorage.removeItem(`player_room_${roomIdFromURL}`)
                  setAppMode("player")
                }
              } catch (e) {
                // Invalid localStorage data, vào player lobby
                setAppMode("player")
              }
            } else {
              // Chưa join, vào player lobby để join
              setAppMode("player")
            }
          } else {
            // Room không tồn tại, vào player lobby
            setAppMode("player")
          }
          return // Dừng ở đây, không load admin session
        }
        
        // Chỉ load admin session khi KHÔNG có roomId trong URL
        const savedAuth = localStorage.getItem("teacher_session")
        if (savedAuth) {
          try {
            const session = JSON.parse(savedAuth)
            if (session) {
              setIsAuthenticated(true)
              setAppMode("admin")
            }
          } catch (e) {
            // Invalid session, clear it
            localStorage.removeItem("teacher_session")
          }
        }

        // Load rooms from API và sync với cache
        try {
          const roomsRes = await fetch("/api/rooms")
          const apiRooms = await roomsRes.json()
          if (Array.isArray(apiRooms)) {
            setRooms(apiRooms)
            // Cache rooms để dùng khi reload
            localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
              rooms: apiRooms, 
              timestamp: Date.now() 
            }))
          }
        } catch (e) {
          console.error("[v0] Failed to load rooms:", e)
          // Nếu API fail và có cached data, dùng cached data
          if (parsedRooms.length > 0) {
            console.log("[v0] Using cached rooms data")
          }
        }
      } catch (e) {
        console.error("[v0] Failed to load data:", e)
      }
    }
    loadData()
  }, [])

  // Use refs to avoid infinite loop in useEffect
  const currentRoomRef = useRef(currentRoom)
  const appModeRef = useRef(appMode)
  const playerTeamRef = useRef(playerTeam)
  
  // Update refs when state changes
  useEffect(() => {
    currentRoomRef.current = currentRoom
  }, [currentRoom])
  
  useEffect(() => {
    appModeRef.current = appMode
  }, [appMode])
  
  useEffect(() => {
    playerTeamRef.current = playerTeam
  }, [playerTeam])

  // Only poll API when in waiting or game mode
  useEffect(() => {
    const appModeValue = appModeRef.current
    
    // Only start polling if in waiting or game mode
    if (appMode !== "waiting" && appMode !== "game") {
      return
    }
    
    let isMounted = true
    
    const interval = setInterval(async () => {
      if (!isMounted) return
      
      // Double check mode hasn't changed
      const currentMode = appModeRef.current
      if (currentMode !== "waiting" && currentMode !== "game") {
        return
      }
      
      try {
        const roomsRes = await fetch("/api/rooms")
        if (!roomsRes.ok) {
          console.error("[v0] Failed to fetch rooms:", roomsRes.status)
          return
        }
        
        const parsedRooms = await roomsRes.json()
        if (!Array.isArray(parsedRooms)) {
          console.error("[v0] Invalid rooms data format")
          return
        }
        
        setRooms(parsedRooms)
        // Cache rooms để dùng khi reload
        localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
          rooms: parsedRooms, 
          timestamp: Date.now() 
        }))
        
        // Update current room if in waiting or game mode
        const currentRoomValue = currentRoomRef.current
        const appModeValue = appModeRef.current
        const playerTeamValue = playerTeamRef.current
        
        if (currentRoomValue) {
          const updatedRoom = parsedRooms.find((r: any) => r.id === currentRoomValue.id)
          if (updatedRoom) {
            // Only update if room data actually changed
            const roomChanged = JSON.stringify(updatedRoom) !== JSON.stringify(currentRoomValue)
            if (roomChanged) {
              setCurrentRoom(updatedRoom)
            }
            
            // Kiểm tra xem người chơi còn trong teams không (có thể bị xóa khi dừng game)
            const playerStillInRoom = (updatedRoom.teams || []).some((t: any) => {
              const teamName = typeof t === "string" ? t : t.name
              return teamName === playerTeamValue
            })
            
            // Nếu người chơi không còn trong room (bị xóa khi dừng game), quay về player lobby
            if (!playerStillInRoom && playerTeamValue && (appModeValue === "waiting" || appModeValue === "game")) {
              // Xóa localStorage
              localStorage.removeItem(`player_room_${updatedRoom.id}`)
              setAppMode("player")
              setCurrentRoom(null)
              setPlayerTeam("")
              return
            }
            
            // Nếu game đã dừng và đang ở game mode, quay về waiting room
            if (!updatedRoom.gameStarted && appModeValue === "game") {
              setAppMode("waiting")
            }
            
            // Nếu game started và đang ở waiting mode, chuyển sang game mode
            if (updatedRoom.gameStarted && appModeValue === "waiting") {
              setAppMode("game")
            }
          } else {
            // Room không còn tồn tại
            if (appModeValue === "waiting" || appModeValue === "game") {
              setAppMode("player")
              setCurrentRoom(null)
              setPlayerTeam("")
            }
          }
        }
      } catch (e) {
        console.error("[v0] Failed to load rooms:", e)
      }
    }, 2000) // Tăng interval lên 2 giây để giảm số lần gọi
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [appMode]) // Chỉ chạy lại khi appMode thay đổi
  
  // Listen for game started event
  useEffect(() => {
    const handleGameStarted = (event: CustomEvent) => {
      if (appMode === "waiting" && currentRoom?.id === event.detail.roomId) {
        setAppMode("game")
      }
    }
    
    window.addEventListener('gameStarted', handleGameStarted as EventListener)
    return () => window.removeEventListener('gameStarted', handleGameStarted as EventListener)
  }, [appMode, currentRoom])

  const handleSelectRole = (role: "teacher" | "student") => {
    // Nếu user đến từ room link, không cho phép chọn role teacher
    if (hasRoomIdInURL && role === "teacher") {
      alert("Bạn không thể đăng nhập admin khi đang tham gia phòng quiz. Vui lòng truy cập trang chủ (không có roomId) để đăng nhập.")
      return
    }
    
    if (role === "teacher") {
      setAppMode("login")
    } else {
      setAppMode("player")
    }
  }

  const handleLogin = () => {
    // Nếu user đến từ room link, không cho phép login admin
    if (hasRoomIdInURL) {
      alert("Bạn không thể đăng nhập admin khi đang tham gia phòng quiz. Vui lòng truy cập trang chủ (không có roomId) để đăng nhập.")
      setAppMode("player")
      return
    }
    
    setIsAuthenticated(true)
    setAppMode("admin")
    // Save session to localStorage instead of JSON
    localStorage.setItem("teacher_session", JSON.stringify({ loginTime: new Date().toISOString() }))
  }

  const handleSkipLogin = () => {
    setAppMode("player")
  }

  const handleCreateRoom = async (roomData: any) => {
    const newRoom = {
      id: Math.random().toString(36).substr(2, 9),
      ...roomData,
      createdAt: new Date(),
      questions: [],
      teams: [],
      gameStarted: false, // Game starts as not started
      lesson: "", // Bài học rút ra tổng hợp
      thinkingTime: 20, // Thời gian suy nghĩ mặc định
      resultTime: 5, // Thời gian kết quả mặc định (0 = chờ admin click)
      nextQuestionTrigger: null, // Timestamp when admin clicks next question
    }
    
    try {
      const roomsRes = await fetch("/api/rooms")
      if (!roomsRes.ok) {
        throw new Error(`HTTP error! status: ${roomsRes.status}`)
      }
      const allRooms = await roomsRes.json()
      const updatedRooms = [...allRooms, newRoom]
      
      const saveRes = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRooms),
      })
      
      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to save: ${saveRes.status}`)
      }
      
      const result = await saveRes.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to save room")
      }
      
      // Update local state immediately - no need to poll right away
      setRooms(updatedRooms)
      setCurrentRoom(newRoom)
      // Cache rooms để dùng khi reload
      localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
        rooms: updatedRooms, 
        timestamp: Date.now() 
      }))
    } catch (e: any) {
      console.error("[v0] Failed to create room:", e)
      const errorMsg = e?.message || "Không thể tạo phòng. Vui lòng thử lại."
      alert(errorMsg)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const roomsRes = await fetch("/api/rooms")
      const allRooms = await roomsRes.json()
      const updatedRooms = allRooms.filter((r: any) => r.id !== roomId)
      
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRooms),
      })
      
      setRooms(updatedRooms)
      // Cache rooms để dùng khi reload
      localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
        rooms: updatedRooms, 
        timestamp: Date.now() 
      }))
    } catch (e) {
      console.error("[v0] Failed to delete room:", e)
      alert("Không thể xóa phòng. Vui lòng thử lại.")
    }
  }

  const handleJoinRoom = async (roomId: string, teamName: string) => {
    try {
      const roomsRes = await fetch("/api/rooms")
      const allRooms = await roomsRes.json()
      const room = allRooms.find((r: any) => r.id === roomId)
      
      if (room) {
        // Check for duplicate team name (case-insensitive)
        const existingTeamIndex = (room.teams || []).findIndex((t: any) => {
          const name = typeof t === "string" ? t : t.name
          return name.toLowerCase().trim() === teamName.toLowerCase().trim()
        })

        if (existingTeamIndex === -1) {
          const newTeam = { name: teamName.trim(), score: 0, isVirtual: false }
          const updatedRoom = {
            ...room,
            teams: [...(room.teams || []), newTeam],
          }
          const updatedRooms = allRooms.map((r: any) => (r.id === roomId ? updatedRoom : r))
          
          await fetch("/api/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRooms),
          })
          
          setRooms(updatedRooms)
          setCurrentRoom(updatedRoom)
          setPlayerTeam(teamName.trim())
          
          // Lưu thông tin vào localStorage để có thể khôi phục khi reload
          localStorage.setItem(`player_room_${roomId}`, JSON.stringify({
            roomId,
            teamName: teamName.trim(),
            joinedAt: new Date().toISOString()
          }))
          
          // Cache rooms để dùng khi reload
          localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
            rooms: updatedRooms, 
            timestamp: Date.now() 
          }))
          
          // Go to waiting room first, not directly to game
          setAppMode("waiting")
        } else {
          alert("Tên đội đã tồn tại trong phòng này. Vui lòng chọn tên khác.")
        }
      } else {
        alert("Không tìm thấy phòng")
      }
    } catch (e) {
      console.error("[v0] Failed to join room:", e)
      alert("Không thể tham gia phòng. Vui lòng thử lại.")
    }
  }

  const handleUpdateRoom = async (updatedRoom: any) => {
    try {
      const roomsRes = await fetch("/api/rooms")
      const allRooms = await roomsRes.json()
      const updatedRooms = allRooms.map((r: any) => (r.id === updatedRoom.id ? updatedRoom : r))
      
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRooms),
      })
      
      setRooms(updatedRooms)
      setCurrentRoom(updatedRoom)
      // Cache rooms để dùng khi reload
      localStorage.setItem("quiz_rooms_cache", JSON.stringify({ 
        rooms: updatedRooms, 
        timestamp: Date.now() 
      }))
    } catch (e) {
      console.error("[v0] Failed to update room:", e)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setAppMode("role")
    // Remove session from localStorage
    localStorage.removeItem("teacher_session")
  }

  if (appMode === "role") {
    // Nếu user đến từ room link, tự động vào player mode, không hiển thị role selection
    if (hasRoomIdInURL) {
      // Đã được xử lý trong useEffect, nhưng để đảm bảo, set player mode
      if (appMode === "role") {
        setAppMode("player")
      }
      return null
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-background to-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-3xl border border-border p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
                Quiz Master
              </h1>
              <p className="text-muted-foreground text-lg">Chọn vai trò của bạn</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleSelectRole("teacher")}
                className="w-full p-6 rounded-2xl bg-primary/10 border-2 border-primary hover:bg-primary/20 transition-all"
              >
                <span className="text-4xl block mb-2">👨‍🏫</span>
                <p className="font-bold text-lg text-foreground">Giáo viên</p>
                <p className="text-sm text-muted-foreground">Tạo và quản lý phòng quiz</p>
              </button>

              <button
                onClick={() => handleSelectRole("student")}
                className="w-full p-6 rounded-2xl bg-secondary/10 border-2 border-secondary hover:bg-secondary/20 transition-all"
              >
                <span className="text-4xl block mb-2">👥</span>
                <p className="font-bold text-lg text-foreground">Học sinh</p>
                <p className="text-sm text-muted-foreground">Tham gia và chơi quiz</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (appMode === "login") {
    // Nếu user đến từ room link, không cho phép vào login page
    if (hasRoomIdInURL) {
      setAppMode("player")
      return null
    }
    return <LoginPage onLogin={handleLogin} onBack={() => setAppMode("role")} />
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {appMode === "admin" && (
        <AdminDashboard
          rooms={rooms}
          onCreateRoom={handleCreateRoom}
          onDeleteRoom={handleDeleteRoom}
          onUpdateRoom={handleUpdateRoom}
          onLogout={handleLogout}
          onBack={() => setAppMode("role")}
        />
      )}

      {appMode === "player" && (
        <PlayerLobby rooms={rooms} onJoinRoom={handleJoinRoom} onBack={() => setAppMode("role")} />
      )}

      {appMode === "waiting" && currentRoom && (
        <WaitingRoom
          room={currentRoom}
          playerTeam={playerTeam}
          onExit={() => {
            setAppMode("player")
            setCurrentRoom(null)
            setPlayerTeam("")
          }}
        />
      )}

      {appMode === "game" && currentRoom && (
        <GameBoard
          room={currentRoom}
          playerTeam={playerTeam}
          onUpdateRoom={handleUpdateRoom}
          onExit={() => {
            setAppMode("player")
            setCurrentRoom(null)
            setPlayerTeam("")
          }}
        />
      )}
    </main>
  )
}
