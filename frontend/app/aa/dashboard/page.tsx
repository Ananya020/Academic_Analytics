"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Sidebar, type SidebarItem } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { AnalyticsTable } from "@/components/analytics-table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { auth } from "@/lib/auth"
import apiClient from "@/lib/api"
import { BarChart3, Settings } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]

export default function AADashboardPage() {
  const [userName, setUserName] = useState("")
  const [mode, setMode] = useState("section")
  const [selectedSection, setSelectedSection] = useState("")
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)

  const sidebarItems: SidebarItem[] = [
    { href: "/aa/dashboard", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { href: "/aa/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ]

  useEffect(() => {
    const user = auth.getUser()
    if (user) {
      setUserName(user.name)
    }
    
    // Fetch sections from backend
    const fetchSections = async () => {
      try {
        const response = await apiClient.get("/aa/sections")
        if (response.data && response.data.length > 0) {
          setSections(response.data)
          setSelectedSection(response.data[0].id.toString())
        } else {
          // No sections assigned, but still fetch analytics for overall view
          setLoading(false)
        }
      } catch (error) {
        console.error("Failed to fetch sections:", error)
        setLoading(false)
      }
    }
    
    fetchSections()
  }, [])

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const params = mode === "section" && selectedSection 
          ? { mode: "section", section: selectedSection } 
          : { mode: "overall" }
        const response = await apiClient.get("/aa/analytics", { params })
        setAnalytics(response.data)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
        // Set empty analytics on error to prevent infinite loading
        setAnalytics({
          totalStudents: 0,
          passPercentage: 0,
          failPercentage: 0,
          totalArrears: 0,
          arrearsComparison: [],
          genderDistribution: [],
          weakSubjects: []
        })
      } finally {
        setLoading(false)
      }
    }

    // Always fetch analytics, even if no section selected (for overall mode)
    fetchAnalytics()
  }, [mode, selectedSection])

  const handleExportPDF = async () => {
    try {
      const params = mode === "section" ? { section: selectedSection } : {}
      const response = await apiClient.get("/aa/export/pdf", {
        params,
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(response.data)
      const a = document.createElement("a")
      a.href = url
      a.download = "aa-report.pdf"
      a.click()
    } catch (error) {
      console.error("Failed to export PDF:", error)
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
    <ProtectedRoute allowedRoles={["aa"]}>
      <div className="flex h-screen">
        <Sidebar items={sidebarItems} />
        <div className="flex-1 flex flex-col">
          <Navbar userName={userName} />
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Academic Advisor Dashboard</h2>
                  <p className="text-muted-foreground">Section-wise and overall analytics</p>
                </div>
              </div>

              {/* Filters */}
              <Card className="p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">View Mode</label>
                    <Select value={mode} onValueChange={setMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="section">By Section</SelectItem>
                        <SelectItem value="overall">Overall</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {mode === "section" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Section</label>
                      <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-end">
                    <Button onClick={handleExportPDF} className="gap-2 bg-transparent" variant="outline">
                      <Download className="w-4 h-4" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </Card>

              {analytics && (
                <div className="space-y-6">
                  {/* Stats Cards */}
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

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Section vs Section Arrears */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Arrears Comparison</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.arrearsComparison || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="arrears" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>

                    {/* Gender Distribution */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.genderDistribution || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="male" fill="#3b82f6" />
                          <Bar dataKey="female" fill="#ec4899" />
                          <Bar dataKey="other" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </div>

                  {/* Weak Subjects Table */}
                  <AnalyticsTable title="Weak Subjects Analysis" data={analytics.weakSubjects || []} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
