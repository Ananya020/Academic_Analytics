"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/auth"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const user = auth.getUser()
    if (user) {
      // Redirect to role-based dashboard
      const roleRoutes: Record<string, string> = {
        fa: "/fa/dashboard",
        aa: "/aa/dashboard",
        hod: "/hod/dashboard",
        admin: "/admin/dashboard",
      }
      router.push(roleRoutes[user.role] || "/login")
    } else {
      // Redirect to login
      router.push("/login")
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}
