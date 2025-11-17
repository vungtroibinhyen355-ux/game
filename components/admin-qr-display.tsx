"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface AdminQRDisplayProps {
  room: any
}

export default function AdminQRDisplay({ room }: AdminQRDisplayProps) {
  const [qrCode, setQrCode] = useState<string>("")
  const [showFullscreen, setShowFullscreen] = useState(false)

  useEffect(() => {
    // Generate a simple QR code using a public API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(room.id)}`
    setQrCode(qrUrl)
  }, [room.id])

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = qrCode
    link.download = `${room.name}-qr-code.png`
    link.click()
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-bold text-foreground mb-4">Join Room QR Code</h3>

      {qrCode && (
        <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center">
          <img
            src={qrCode || "/placeholder.svg"}
            alt={`QR Code for ${room.name}`}
            className="w-64 h-64 border-2 border-primary rounded"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mb-4">
        Players can scan this QR code or enter Room ID:{" "}
        <span className="font-mono font-bold text-foreground">{room.id}</span>
      </p>

      <div className="flex gap-2">
        <Button
          onClick={() => setShowFullscreen(true)}
          className="flex-1 bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
        >
          Fullscreen QR
        </Button>
        <Button onClick={handleDownload} variant="outline">
          Download
        </Button>
      </div>

      {showFullscreen && qrCode && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="relative">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300"
            >
              ✕
            </button>
            <div className="bg-white p-8 rounded-2xl">
              <img
                src={qrCode || "/placeholder.svg"}
                alt="QR Code"
                className="w-96 h-96 border-4 border-primary rounded"
              />
              <p className="text-center mt-4 text-foreground font-bold">Scan to join: {room.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
