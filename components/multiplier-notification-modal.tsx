"use client"

import { useEffect, useState, useRef } from "react"

interface MultiplierNotificationModalProps {
  multiplier: number
  questionNumber: number
  totalQuestions: number
  onContinue: () => void
}

export default function MultiplierNotificationModal({
  multiplier,
  questionNumber,
  totalQuestions,
  onContinue,
}: MultiplierNotificationModalProps) {
  const [countdown, setCountdown] = useState(3)
  const onContinueRef = useRef(onContinue)
  const hasContinuedRef = useRef(false)

  // Cập nhật ref khi onContinue thay đổi
  useEffect(() => {
    onContinueRef.current = onContinue
  }, [onContinue])

  useEffect(() => {
    // Reset khi component mount
    setCountdown(3)
    hasContinuedRef.current = false

    const timer = setInterval(() => {
      setCountdown((prev) => {
        const newCount = prev - 1
        if (newCount <= 0) {
          // Khi countdown đạt 0, gọi onContinue và đánh dấu đã gọi
          if (!hasContinuedRef.current) {
            hasContinuedRef.current = true
            // Gọi onContinue ngay lập tức
            onContinueRef.current()
          }
          return 0
        }
        return newCount
      })
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, []) // Chỉ chạy một lần khi mount

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-warning/20 via-accent/20 to-primary/20 flex items-center justify-center z-[60] animate-fade-in-scale">
      {/* Full screen overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative bg-card rounded-3xl border-4 border-warning shadow-2xl p-12 max-w-2xl w-full mx-4 text-center animate-bounce-pop">
        <div className="text-8xl mb-6 animate-bounce">⚡</div>
        <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-warning via-accent to-primary mb-6">
          Câu hỏi đặc biệt!
        </h2>
        <div className="mb-8">
          <p className="text-2xl font-bold text-foreground mb-4">
            Câu {questionNumber}/{totalQuestions}
          </p>
          <div className="inline-block px-8 py-4 rounded-2xl bg-warning/30 border-4 border-warning shadow-lg">
            <p className="text-5xl font-bold text-warning">
              x{multiplier} Điểm
            </p>
            <p className="text-xl text-warning/80 mt-2">15 điểm x2 = 30 điểm</p>
          </div>
        </div>
        <p className="text-xl text-foreground mb-8 font-medium">
          Câu hỏi này có hệ số nhân điểm {multiplier}x!
        </p>
        
        {/* Countdown với animation màu xanh chạy từ từ */}
        <div className="mb-6">
          <div className="relative inline-flex items-center justify-center w-32 h-32">
            {/* Background circle với animation */}
            <svg className="absolute inset-0 w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="rgba(34, 197, 94, 0.2)"
                strokeWidth="8"
              />
              {/* Animated progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="rgb(34, 197, 94)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - (4 - countdown) / 3)}`}
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: "drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))"
                }}
              />
            </svg>
            {/* Countdown number */}
            <div className="relative z-10">
              <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-500 to-green-600">
                {countdown}
              </span>
            </div>
          </div>
        </div>
        
        <p className="text-muted-foreground text-lg">
          Tự động bắt đầu sau <span className="font-bold text-green-500">{countdown}</span> giây...
        </p>
      </div>
    </div>
  )
}

