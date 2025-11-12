"use client"

import { useState, useEffect } from "react"
import { FileText } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Sidebar, type SidebarItem } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { HeatmapChart } from "@/components/heatmap-chart"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import apiClient from "@/lib/api"
import { BarChart3, FileTextIcon as FileExcel } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function HODDashboardPage() {
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)

  const sidebarItems: SidebarItem[] = [
    { href: "/hod/dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
  ]

  useEffect(() => {
    const user = auth.getUser()
    if (user) {
      setUserName(user.name)
    }
  }, [])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiClient.get("/hod/analytics")
        setAnalytics(response.data)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const handleExportPDF = async () => {
    try {
      const response = await apiClient.get("/hod/export/pdf", {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(response.data)
      const a = document.createElement("a")
      a.href = url
      a.download = "hod-report.pdf"
      a.click()
    } catch (error) {
      console.error("Failed to export PDF:", error)
    }
  }

  const handleExportExcel = async () => {
    try {
      const response = await apiClient.get("/hod/export/excel", {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(response.data)
      const a = document.createElement("a")
      a.href = url
      a.download = "hod-report.xlsx"
      a.click()
    } catch (error) {
      console.error("Failed to export Excel:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["hod"]}>
      <div className="flex h-screen">
        <Sidebar items={sidebarItems} />
        <div className="flex-1 flex flex-col">
          <Navbar userName={userName} />
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Head of Department Dashboard</h2>
                <p className="text-muted-foreground">Department-wide analytics and insights</p>
              </div>

              {analytics && (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                      <p className="text-3xl font-bold">{analytics.totalStudents}</p>
                    </Card>
                    <Card className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Pass %</p>
                      <p className="text-3xl font-bold text-green-600">{analytics.passPercentage}%</p>
                    </Card>
                    <Card className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Fail %</p>
                      <p className="text-3xl font-bold text-red-600">{analytics.failPercentage}%</p>
                    </Card>
                    <Card className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Total Arrears</p>
                      <p className="text-3xl font-bold text-orange-600">{analytics.totalArrears}</p>
                    </Card>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex gap-3">
                    <Button onClick={handleExportPDF} className="gap-2">
                      <FileText className="w-4 h-4" />
                      Export PDF
                    </Button>
                    <Button onClick={handleExportExcel} variant="outline" className="gap-2 bg-transparent">
                      <FileExcel className="w-4 h-4" />
                      Export Excel
                    </Button>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Semester Performance Trend */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Semester Performance Trend</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.semesterTrend || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semester" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="passPercentage" stroke="#10b981" name="Pass %" />
                          <Line type="monotone" dataKey="failPercentage" stroke="#ef4444" name="Fail %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>

                    {/* Hostler vs Day Scholar */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Hostel vs Day Scholar</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.hostelComparison || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </div>

                  {/* Subject Failure Rate Heatmap */}
                  <HeatmapChart data={analytics.subjectFailureRates || []} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
