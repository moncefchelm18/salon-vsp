"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ReceptionistLayout from "../components/receptionist/ReceptionistLayout"

export default function Receptionist() {
  const navigate = useNavigate()

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "receptionist") {
      navigate("/")
    }
  }, [navigate])

  return <ReceptionistLayout />
}
