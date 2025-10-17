"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import LoginForm from "../components/LoginForm"

export default function Login() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (email, pin) => {
    setIsLoading(true)

    setTimeout(() => {
      if (email === "receptionist@gmail.com" && pin === "0000") {
        localStorage.setItem("userRole", "receptionist")
        localStorage.setItem("userEmail", email)
        navigate("/receptionist")
      } else if (email === "barbers@gmail.com" && pin === "0000") {
        localStorage.setItem("userRole", "barber")
        localStorage.setItem("userEmail", email)
        navigate("/barber")
      } else {
        alert("Invalid credentials")
        setIsLoading(false)
      }
    }, 500)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </main>
  )
}
