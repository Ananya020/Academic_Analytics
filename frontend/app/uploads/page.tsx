"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/auth"

export default function UploadsPage() {
  const router = useRouter()

  useEffect(() => {
    const user = auth.getUser()
    if (user?.role === "fa") {
      router.push("/fa/uploads")
    } else {
      router.push("/login")
    }
  }, [router])

  return null
}
