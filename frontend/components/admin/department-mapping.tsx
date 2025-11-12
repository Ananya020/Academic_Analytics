"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import apiClient from "@/lib/api"

interface Mapping {
  userId: string
  userName: string
  sections: string[]
}

// Generate section names in format A1-Z1, A2-Z2, etc.
const generateSectionNames = (year: number = 2024, department: string = "Computer Science") => {
  const sections = []
  for (let yearNum = 1; yearNum <= 4; yearNum++) {
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i) // A-Z
      sections.push({
        name: `${letter}${yearNum}`,
        year: year + yearNum - 1,
        department: department,
      })
    }
  }
  return sections
}

export function DepartmentMapping() {
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError("")
      try {
        const [usersRes, sectionsRes, mappingsRes] = await Promise.all([
          apiClient.get("/admin/users?role=fa,aa"),
          apiClient.get("/admin/sections"),
          apiClient.get("/admin/mappings"),
        ])
        setUsers(usersRes.data || [])
        
        // If no sections exist, generate default sections
        if (!sectionsRes.data || sectionsRes.data.length === 0) {
          console.warn("No sections found. You may need to create sections in the database.")
          // Generate section names for display (but they won't work until created in DB)
          const generatedSections = generateSectionNames()
          setSections(generatedSections.map((s, idx) => ({ ...s, id: idx + 1 })))
        } else {
          setSections(sectionsRes.data)
        }
        
        setMappings(mappingsRes.data || [])
      } catch (error: any) {
        console.error("Failed to fetch data:", error)
        setError(error?.response?.data?.error || error?.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddMapping = async () => {
    if (!selectedUser || selectedSections.length === 0) {
      setError("Please select both a user and a section")
      return
    }

    setError("")
    try {
      // Ensure section IDs are numbers
      const sectionIds = selectedSections.map(s => {
        const num = parseInt(s)
        if (isNaN(num)) {
          throw new Error(`Invalid section ID: ${s}`)
        }
        return num
      })

      const response = await apiClient.post("/admin/map", {
        userId: selectedUser,
        sections: sectionIds,
      })

      // Show success message
      alert(response.data?.message || "Mapping added successfully!")

      setSelectedUser("")
      setSelectedSections([])

      // Refresh mappings and sections
      const [mappingsResponse, sectionsResponse] = await Promise.all([
        apiClient.get("/admin/mappings"),
        apiClient.get("/admin/sections"),
      ])
      setMappings(mappingsResponse.data || [])
      setSections(sectionsResponse.data || [])
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to add mapping"
      setError(errorMessage)
      alert(errorMessage)
      console.error("Failed to add mapping:", error)
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  // Sort sections: A1-Z1, then A2-Z2, etc.
  const sortedSections = [...sections].sort((a, b) => {
    const nameA = a.name || ""
    const nameB = b.name || ""
    // Extract letter and number
    const matchA = nameA.match(/^([A-Z])(\d+)$/)
    const matchB = nameB.match(/^([A-Z])(\d+)$/)
    
    if (matchA && matchB) {
      const numA = parseInt(matchA[2])
      const numB = parseInt(matchB[2])
      if (numA !== numB) {
        return numA - numB // Sort by number first (1, 2, 3, 4)
      }
      return matchA[1].localeCompare(matchB[1]) // Then by letter (A-Z)
    }
    return nameA.localeCompare(nameB)
  })

  const handleCreateDefaultSections = async () => {
    if (!confirm("This will create 104 sections (A1-Z1, A2-Z2, A3-Z3, A4-Z4). Continue?")) {
      return
    }

    try {
      const response = await apiClient.post("/admin/sections/create-default", {
        year: 2024,
        department: "Computer Science"
      })
      
      alert(response.data?.message || "Sections created successfully!")
      
      // Refresh sections
      const sectionsResponse = await apiClient.get("/admin/sections")
      setSections(sectionsResponse.data || [])
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to create sections"
      alert(errorMessage)
      console.error("Failed to create sections:", error)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Department Mapping</h3>
        {sections.length === 0 && (
          <Button 
            onClick={handleCreateDefaultSections}
            variant="outline"
            size="sm"
          >
            Create Default Sections (A1-Z4)
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Add Mapping Form */}
      <div className="mb-8 p-4 bg-secondary rounded-lg space-y-4">
        <p className="text-sm font-medium">Assign Sections to Users</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select User" />
            </SelectTrigger>
            <SelectContent>
              {users.length === 0 ? (
                <SelectItem value="" disabled>No FA/AA users found</SelectItem>
              ) : (
                users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role?.toUpperCase() || "N/A"})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={selectedSections[0] || ""} onValueChange={(val) => setSelectedSections([val])}>
            <SelectTrigger>
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent>
              {sortedSections.length === 0 ? (
                <SelectItem value="" disabled>No sections available</SelectItem>
              ) : (
                sortedSections.map((section) => {
                  // Display as A1, B1, C1...Z1, A2, B2...Z2 format
                  const displayName = section.name || `Section ${section.id}`
                  return (
                    <SelectItem key={section.id} value={section.id.toString()}>
                      {displayName}
                    </SelectItem>
                  )
                })
              )}
            </SelectContent>
          </Select>

          <Button onClick={handleAddMapping} disabled={!selectedUser || selectedSections.length === 0}>
            Add Mapping
          </Button>
        </div>
      </div>

      {/* Current Mappings */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Current Mappings</p>
        {mappings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mappings found. Assign sections to users above.</p>
        ) : (
          mappings.map((mapping) => (
            <div key={mapping.userId} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
              <div>
                <p className="font-medium">{mapping.userName} ({mapping.userRole})</p>
                <p className="text-xs text-muted-foreground">
                  {mapping.sections.length > 0 
                    ? mapping.sections.join(", ") 
                    : "No sections assigned"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
