"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface QuestionEditorProps {
  room: any
  onClose: () => void
  onQuestionsUpdate?: (questions: any[]) => void
}

export default function QuestionEditor({ room, onClose, onQuestionsUpdate }: QuestionEditorProps) {
  const [questions, setQuestions] = useState<any[]>(room.questions || [])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    difficulty: "medium",
    desc: "", // Bài học cần rút ra
  })
  
  // Tính điểm tự động dựa trên độ khó
  const getPointsByDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return 5
      case "medium": return 10
      case "hard": return 15
      default: return 10
    }
  }
  
  // Tính multiplier tự động: khó = x2
  const getMultiplierByDifficulty = (difficulty: string) => {
    return difficulty === "hard" ? 2 : 1
  }

  const handleSaveQuestion = () => {
    if (!formData.question.trim()) {
      alert("Vui lòng nhập câu hỏi")
      return
    }

    if (formData.options.some((opt) => !opt.trim())) {
      alert("Vui lòng điền đầy đủ tất cả các lựa chọn")
      return
    }

    // Tự động tính điểm và multiplier dựa trên độ khó
    const points = getPointsByDifficulty(formData.difficulty)
    const multiplier = getMultiplierByDifficulty(formData.difficulty)
    
    const questionData = {
      question: formData.question.trim(),
      options: formData.options.map((o) => o.trim()),
      correctAnswer: Number(formData.correctAnswer),
      difficulty: formData.difficulty,
      points: points,
      desc: formData.desc.trim(), // Bài học cần rút ra
      multiplier: multiplier, // Tự động: khó = x2
    }

    if (editingId) {
      const updated = questions.map((q) => (q.id === editingId ? { ...questionData, id: editingId } : q))
      setQuestions(updated)
      onQuestionsUpdate?.(updated)
      setEditingId(null)
    } else {
      const newQuestion = {
        ...questionData,
        id: Date.now().toString(),
      }
      const updated = [...questions, newQuestion]
      setQuestions(updated)
      onQuestionsUpdate?.(updated)
    }

    setFormData({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      difficulty: "medium",
      desc: "",
    })
    setShowForm(false)
  }

  const handleEditQuestion = (question: any) => {
    setFormData({
      question: question.question,
      options: question.options,
      correctAnswer: Number(question.correctAnswer),
      difficulty: question.difficulty,
      desc: question.desc || "",
    })
    setEditingId(question.id)
    setShowForm(true)
  }

  const handleDeleteQuestion = (id: string) => {
    const updated = questions.filter((q) => q.id !== id)
    setQuestions(updated)
    onQuestionsUpdate?.(updated)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      difficulty: "medium",
      desc: "",
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-card rounded-2xl border border-border p-8 max-w-4xl w-full my-8 animate-fade-in-scale">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Quản lý câu hỏi - {room.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">
            ×
          </button>
        </div>

        {/* Questions List */}
        <div className="max-h-96 overflow-y-auto mb-6 bg-background rounded-lg p-4 border border-border">
          {questions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Chưa có câu hỏi nào</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded text-sm">
                          Q{idx + 1}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            q.difficulty === "easy"
                              ? "bg-success/20 text-success"
                              : q.difficulty === "medium"
                                ? "bg-warning/20 text-warning"
                                : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {q.difficulty === "easy" ? "Dễ" : q.difficulty === "medium" ? "Trung bình" : "Khó"}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                          {getPointsByDifficulty(q.difficulty)}{q.difficulty === "hard" ? " x2" : ""} pts
                        </span>
                      </div>
                      <p className="text-foreground font-medium mb-2">{q.question}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        {q.options.map((opt: string, i: number) => (
                          <div
                            key={i}
                            className={`p-2 rounded ${
                              i === Number(q.correctAnswer)
                                ? "bg-success/20 text-success font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {opt} {i === Number(q.correctAnswer) && "✓"}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleEditQuestion(q)}
                        className="px-3 py-1 text-sm rounded bg-primary/20 text-primary hover:bg-primary/30 font-medium transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="px-3 py-1 text-sm rounded bg-destructive/20 text-destructive hover:bg-destructive/30 font-medium transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        {!showForm ? (
          <div className="flex gap-3 mb-4">
            <Button
              onClick={() => setShowForm(true)}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 text-white"
            >
              Thêm câu hỏi mới
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Xong
            </Button>
          </div>
        ) : (
          <div className="bg-background rounded-lg border border-border p-6 mb-4 space-y-4">
            <h3 className="font-bold text-foreground text-lg">{editingId ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}</h3>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Câu hỏi</label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Nhập câu hỏi của bạn"
                className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Độ khó</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="easy">Dễ (5 điểm)</option>
                <option value="medium">Trung bình (10 điểm)</option>
                <option value="hard">Khó (15 điểm x2 = 30 điểm)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Điểm sẽ tự động tính: Dễ = 5đ, Trung bình = 10đ, Khó = 15đ x2 = 30đ
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-3">Lựa chọn trả lời</label>
              <div className="space-y-2">
                {formData.options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, correctAnswer: i })}
                      className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all flex-shrink-0 border-2 ${
                        Number(formData.correctAnswer) === i
                          ? "bg-success border-success text-white hover:bg-success/90"
                          : "bg-background border-border text-foreground hover:bg-muted hover:border-primary"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...formData.options]
                        newOpts[i] = e.target.value
                        setFormData({ ...formData, options: newOpts })
                      }}
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                      className="flex-1 px-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Bài học cần rút ra (tùy chọn)</label>
              <textarea
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                placeholder="Nhập bài học cần rút ra từ câu hỏi này..."
                className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveQuestion}
                className="flex-1 bg-gradient-to-r from-success to-success/80 hover:bg-success/90 text-white font-semibold"
              >
                {editingId ? "Cập nhật" : "Thêm"}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                Hủy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
