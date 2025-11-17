"use client"

import { useState, useRef, useEffect } from "react"
import jsQR from "jsqr"

interface QRCodeReaderProps {
  onQRScanned: (data: string) => void
}

export default function QRCodeReader({ onQRScanned }: QRCodeReaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [error, setError] = useState("")
  const onQRScannedRef = useRef(onQRScanned)

  // Keep callback ref updated
  useEffect(() => {
    onQRScannedRef.current = onQRScanned
  }, [onQRScanned])

  useEffect(() => {
    let scanning = false
    let animationFrameId: number | null = null

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setHasCamera(true)
          
          // Wait for video to be ready before starting scan
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                scanning = true
                scanQRCode()
              }).catch((err) => {
                console.error("[v0] Video play error:", err)
                setError("Không thể phát video từ camera")
              })
            }
          }
        }
      } catch (err: any) {
        console.error("[v0] Camera access error:", err)
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Quyền truy cập camera bị từ chối. Vui lòng cho phép truy cập camera.")
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setError("Không tìm thấy camera. Vui lòng kiểm tra thiết bị.")
        } else {
          setError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.")
        }
        setHasCamera(false)
      }
    }
    startCamera()

    const scanQRCode = () => {
      if (!videoRef.current || !canvasRef.current || !scanning) return
      
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      const checkQR = () => {
        if (!scanning) return
        
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const video = videoRef.current
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            
            try {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const code = jsQR(imageData.data, canvas.width, canvas.height)
              
              if (code && code.data) {
                scanning = false
                if (animationFrameId) {
                  cancelAnimationFrame(animationFrameId)
                }
                onQRScannedRef.current(code.data)
                return
              }
            } catch (err) {
              console.error("[v0] QR scan processing error:", err)
            }
          }
        }
        animationFrameId = requestAnimationFrame(checkQR)
      }
      checkQR()
    }

    return () => {
      scanning = false
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-8">
      <p className="text-center text-muted-foreground mb-4 text-sm sm:text-base">Hướng camera vào mã QR</p>
      {hasCamera && (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full max-h-96 rounded-lg bg-black object-cover" 
        />
      )}
      <canvas ref={canvasRef} className="hidden" />
      {!hasCamera && (
        <div className="w-full h-64 bg-background rounded-lg flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
          <p className="text-sm sm:text-base">{error || "Không thể truy cập camera"}</p>
        </div>
      )}
    </div>
  )
}
