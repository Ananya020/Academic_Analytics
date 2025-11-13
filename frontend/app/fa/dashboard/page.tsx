"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Sidebar, type SidebarItem } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { FileUploadCard } from "@/components/file-upload-card"
import { ExcelUploadCard } from "@/components/excel-upload-card"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import apiClient from "@/lib/api"
import { Upload, BarChart3 } from "lucide-react"

export default function FADashboardPage() {
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const sidebarItems: SidebarItem[] = [
    { href: "/fa/dashboard", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { href: "/fa/uploads", label: "Uploads", icon: <Upload className="w-5 h-5" /> },
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
        const response = await apiClient.get("/fa/analytics")
        setAnalytics(response.data)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [refreshTrigger])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["fa"]}>
      <div className="flex h-screen">
        <Sidebar items={sidebarItems} />
        <div className="flex-1 flex flex-col">
          <Navbar userName={userName} />
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Faculty Advisor Dashboard</h2>
                <p className="text-muted-foreground">Manage uploads and view analytics</p>
              </div>

              <Tabs defaultValue="analytics" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="uploads">Uploads</TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="space-y-6">
                  {analytics && (
                    <>
                      {/* Stats Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Card className="p-6">
                          <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                          <p className="text-3xl font-bold">{analytics.totalStudents || 0}</p>
                        </Card>
                        <Card className="p-6">
                          <p className="text-sm text-muted-foreground mb-1">Total Records</p>
                          <p className="text-3xl font-bold">{analytics.totalRecords || 0}</p>
                        </Card>
                        <Card className="p-6">
                          <p className="text-sm text-muted-foreground mb-1">Pass %</p>
                          <p className="text-3xl font-bold text-green-600">{analytics.passPercentage || 0}%</p>
                        </Card>
                        <Card className="p-6">
                          <p className="text-sm text-muted-foreground mb-1">Fail %</p>
                          <p className="text-3xl font-bold text-red-600">{analytics.failPercentage || 0}%</p>
                        </Card>
                        <Card className="p-6">
                          <p className="text-sm text-muted-foreground mb-1">Total Arrears</p>
                          <p className="text-3xl font-bold text-orange-600">{analytics.totalArrears || 0}</p>
                        </Card>
                      </div>

                      {/* Charts */}
                      <AnalyticsCharts
                        arrearsData={analytics.arrearsData}
                        hostelData={analytics.hostelData}
                        topStudents={analytics.topStudents}
                        genderDistribution={analytics.genderDistribution}
                        subjectAnalytics={analytics.subjectAnalytics}
                        gradeDistribution={analytics.gradeDistribution}
                        subjectGradeDistribution={analytics.subjectGradeDistribution}
                        semesterDistribution={analytics.semesterDistribution}
                        marksDistribution={analytics.marksDistribution}
                      />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="uploads" className="space-y-6">
                  <div className="mb-8">
                    <ExcelUploadCard onUploadSuccess={() => setRefreshTrigger((p) => p + 1)} />
                  </div>

                  <div className="mb-6">
                    <FileUploadCard
                      title="Upload Course Code CSV"
                      description="Upload CSV with Register No, Student Name, Course Code, and Grade (e.g., dataforinhouseCSV.csv)"
                      endpoint="/fa/upload/course-code-csv"
                      acceptedTypes=".csv"
                      onUploadSuccess={() => setRefreshTrigger((p) => p + 1)}
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
                      onUploadSuccess={() => setRefreshTrigger((p) => p + 1)}
                    />
                    <FileUploadCard
                      title="Performance Data"
                      description="Upload student performance CSV"
                      endpoint="/fa/upload/performance"
                      onUploadSuccess={() => setRefreshTrigger((p) => p + 1)}
                    />
                    <FileUploadCard
                      title="Attendance Data"
                      description="Upload attendance records CSV"
                      endpoint="/fa/upload/attendance"
                      onUploadSuccess={() => setRefreshTrigger((p) => p + 1)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
