"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Sidebar, type SidebarItem } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { UserManagement } from "@/components/admin/user-management"
import { DepartmentMapping } from "@/components/admin/department-mapping"
import { AuditLogs } from "@/components/admin/audit-logs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth } from "@/lib/auth"
import { Settings, Users, Map, FileText } from "lucide-react"

export default function AdminDashboardPage() {
  const [userName, setUserName] = useState("")

  const sidebarItems: SidebarItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: <Settings className="w-5 h-5" /> },
  ]

  useEffect(() => {
    const user = auth.getUser()
    if (user) {
      setUserName(user.name)
    }
  }, [])

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex h-screen">
        <Sidebar items={sidebarItems} />
        <div className="flex-1 flex flex-col">
          <Navbar userName={userName} />
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h2>
                <p className="text-muted-foreground">Manage users, departments, and system</p>
              </div>

              <Tabs defaultValue="users" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                  <TabsTrigger value="users" className="gap-2">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="mapping" className="gap-2">
                    <Map className="w-4 h-4" />
                    <span className="hidden sm:inline">Mapping</span>
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Audit</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                  <UserManagement />
                </TabsContent>

                <TabsContent value="mapping">
                  <DepartmentMapping />
                </TabsContent>

                <TabsContent value="audit">
                  <AuditLogs />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
