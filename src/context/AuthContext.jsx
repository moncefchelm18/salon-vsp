"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [userRole, setUserRole] = useState(null)
  const [userEmail, setUserEmail] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    const email = localStorage.getItem("userEmail")
    setUserRole(role)
    setUserEmail(email)
  }, [])

  const logout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    setUserRole(null)
    setUserEmail(null)
    navigate("/")
  }

  return <AuthContext.Provider value={{ userRole, userEmail, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
