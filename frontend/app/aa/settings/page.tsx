"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { BarChart3, Settings } from "lucide-react"

export default function AASettingsPage() {
  const [userName, setUserName] = useState("")

  const sidebarItems = [
    { href: "/aa/dashboard", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { href: "/aa/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ]

  useEffect(() => {
    const user = auth.getUser()
    if (user) {
      setUserName(user.name)
    }
  }, [])

  return (
    <ProtectedRoute allowedRoles={["aa"]}>
      <div className="flex h-screen">
        <Sidebar items={sidebarItems} />
        <div className="flex-1 flex flex-col">
          <Navbar userName={userName} />
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Settings</h2>
                <p className="text-muted-foreground">Manage your preferences</p>
              </div>

              <Card className="p-6 max-w-2xl">
                <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={userName}
                      disabled
                      className="w-full px-4 py-2 border border-border rounded-lg bg-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Role</label>
                    <input
                      type="text"
                      value="Academic Advisor"
                      disabled
                      className="w-full px-4 py-2 border border-border rounded-lg bg-secondary"
                    />
                  </div>
                  <Button disabled>Save Changes</Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
