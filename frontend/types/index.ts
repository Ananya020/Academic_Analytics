export type UserRole = "fa" | "aa" | "hod" | "admin"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  departmentId?: string
  sections?: string[]
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Student {
  id: string
  name: string
  email: string
  arrears: number
  hostelStatus: "hostler" | "dayScholar"
  gender: "male" | "female" | "other"
  gpa: number
}

export interface Analytics {
  totalStudents: number
  passPercentage: number
  failPercentage: number
  totalArrears: number
  arrearsData: { name: string; value: number }[]
  hostelData: { name: string; value: number }[]
  topStudents: { name: string; score: number }[]
  genderDistribution: { name: string; value: number }[]
}

export interface Section {
  id: string
  code: string
  semester: number
  department: string
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  timestamp: string
  details?: Record<string, any>
}
