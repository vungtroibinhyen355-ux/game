"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface RoomCreatorProps {
  onCreate: (roomData: any) => void
  onClose: () => void
}

export default function RoomCreator({ onCreate, onClose }: RoomCreatorProps) {
  const [formData, setFormData] = useState({
    name: "",
    topic: "",
    numTeams: 2,
    questions: [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.topic) {
      onCreate({
        ...formData,
        teams: Array.from({ length: formData.numTeams }, (_, i) => ({
          id: i,
          name: `Team ${i + 1}`,
          score: 0,
        })),
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full animate-fade-in-scale shadow-2xl">
        <h2 className="text-2xl font-bold text-foreground mb-6">Tạo phòng mới</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tên phòng</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ví dụ: Quiz Vật Lý"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Chủ đề</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ví dụ: Vận tốc lớp 7"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Số lượng đội</label>
            <select
              value={formData.numTeams}
              onChange={(e) => setFormData({ ...formData, numTeams: Number.parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} đội
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-secondary hover:shadow-lg">
              Tạo phòng
            </Button>
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
