"use client"

import { useEffect, useState } from "react"

interface ConfettiPiece {
  id: number
  left: number
  delay: number
  duration: number
  color: string
  size: number
}

export default function CelebrationEffects({ trigger }: { trigger: boolean }) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (trigger) {
      const colors = ["#3b82f6", "#a855f7", "#ec4899", "#10b981", "#f59e0b"]
      const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.1,
        duration: 2 + Math.random() * 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
      }))

      setConfetti(pieces)

      // Play sound effect
      playApplause()

      const timer = setTimeout(() => setConfetti([]), 4000)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  const playApplause = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const now = audioContext.currentTime

      // Create realistic clapping sound with multiple layers
      // Layer 1: Main claps
      for (let i = 0; i < 12; i++) {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()

        osc.connect(gain)
        gain.connect(audioContext.destination)

        // Vary frequency for more realistic clap
        osc.frequency.value = 200 + Math.random() * 100
        osc.type = "square"

        const startTime = now + i * 0.08
        gain.gain.setValueAtTime(0.4, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)

        osc.start(startTime)
        osc.stop(startTime + 0.15)
      }

      // Layer 2: Background applause
      for (let i = 0; i < 6; i++) {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()

        osc.connect(gain)
        gain.connect(audioContext.destination)

        osc.frequency.value = 100 + Math.random() * 50
        osc.type = "sine"

        const startTime = now + i * 0.2
        gain.gain.setValueAtTime(0.2, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5)

        osc.start(startTime)
        osc.stop(startTime + 0.5)
      }
    } catch (err) {
      console.error("[v0] Audio error:", err)
    }
  }

  return (
    <>
      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="fixed pointer-events-none animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: "-10px",
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            borderRadius: "50%",
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            zIndex: 1000,
          }}
        />
      ))}
      
      {/* Clapping hands emoji effect */}
      {trigger && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[999]">
          <div className="text-8xl animate-bounce-pop" style={{ animationDelay: "0.1s" }}>
            👏
          </div>
        </div>
      )}
    </>
  )
}
