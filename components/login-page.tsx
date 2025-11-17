"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface LoginPageProps {
  onLogin: () => void
  onBack: () => void
}

export default function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleTeacherLogin = () => {
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    if (email === "teacher@school.com" && password === "teacher123") {
      onLogin()
    } else {
      setError("Invalid teacher credentials")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl border border-border p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
              Quiz Master
            </h1>
            <p className="text-muted-foreground">Đăng nhập Giáo viên</p>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-2xl">👨‍🏫</span> Đăng nhập
              </h2>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Email</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.com"
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Mật khẩu</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="teacher123"
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {error && (
                  <div className="text-destructive text-sm font-medium bg-destructive/10 p-3 rounded-lg">{error}</div>
                )}

                <Button
                  onClick={handleTeacherLogin}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg text-lg py-2"
                >
                  Đăng nhập
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center">Demo: teacher@school.com / teacher123</div>
            </div>

            <Button onClick={onBack} variant="outline" className="w-full bg-transparent">
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
