"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import BarberLayout from "../components/barber/BarberLayout"

export default function Barber() {
  const navigate = useNavigate()

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "barber") {
      navigate("/")
    }
  }, [navigate])

  return <BarberLayout />
}
