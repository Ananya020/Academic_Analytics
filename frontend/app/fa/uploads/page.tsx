"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { FileUploadCard } from "@/components/file-upload-card"
import { auth } from "@/lib/auth"
import { Upload, BarChart3 } from "lucide-react"

export default function FAUploadsPage() {
  const [userName, setUserName] = useState("")

  const sidebarItems: any[] = [
    { href: "/fa/dashboard", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { href: "/fa/uploads", label: "Uploads", icon: <Upload className="w-5 h-5" /> },
  ]

  useEffect(() => {
    const user = auth.getUser()
    if (user) {
      setUserName(user.name)
    }
  }, [])

  return (
    <ProtectedRoute allowedRoles={["fa"]}>
      <div className="flex h-screen">
        <Sidebar items={sidebarItems} />
        <div className="flex-1 flex flex-col">
          <Navbar userName={userName} />
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">CSV Uploads</h2>
                <p className="text-muted-foreground">Upload academic data files</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FileUploadCard
                  title="Student Data"
                  description="Upload student information CSV"
                  endpoint="/fa/upload/students"
                />
                <FileUploadCard
                  title="Performance Data"
                  description="Upload student performance CSV"
                  endpoint="/fa/upload/performance"
                />
                <FileUploadCard
                  title="Attendance Data"
                  description="Upload attendance records CSV"
                  endpoint="/fa/upload/attendance"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
