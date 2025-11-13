"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { FileUploadCard } from "@/components/file-upload-card"
import { ExcelUploadCard } from "@/components/excel-upload-card"
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
                <h2 className="text-3xl font-bold text-foreground mb-2">Data Uploads</h2>
                <p className="text-muted-foreground">Upload Excel file or individual CSV files with academic data</p>
              </div>

              <div className="mb-8">
                <ExcelUploadCard />
              </div>

              <div className="mb-6">
                <FileUploadCard
                  title="Upload Course Code CSV"
                  description="Upload CSV with Register No, Student Name, Course Code, and Grade (e.g., dataforinhouseCSV.csv)"
                  endpoint="/fa/upload/course-code-csv"
                  acceptedTypes=".csv"
                />
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Or Upload Individual CSV Files</h3>
                <p className="text-sm text-muted-foreground mb-4">Upload separate CSV files for each data type</p>
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
