"use client"

import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Legend, LineChart, Line, AreaChart, Area 
} from "recharts"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"]
const GRADE_COLORS: { [key: string]: string } = {
  'O': '#10b981',    // Green
  'A+': '#3b82f6',   // Blue
  'A': '#8b5cf6',    // Purple
  'B+': '#f59e0b',   // Orange
  'B': '#ec4899',    // Pink
  'C': '#f97316',    // Orange-red
  'F': '#ef4444'     // Red
}

interface AnalyticsChartsProps {
  arrearsData: { name: string; value: number }[]
  hostelData: { name: string; value: number }[]
  topStudents: { name: string; score: number }[]
  genderDistribution: { name: string; value: number }[]
  subjectAnalytics?: Array<{
    name: string
    total: number
    passed: number
    failed: number
    passPercentage: string
    averageMarks: string
    gradeDistribution: { [key: string]: number }
  }>
  gradeDistribution?: Array<{ grade: string; count: number }>
  subjectGradeDistribution?: { [subject: string]: { [grade: string]: number } }
  semesterDistribution?: Array<{ semester: string; count: number }>
  marksDistribution?: Array<{ range: string; count: number }>
}

export function AnalyticsCharts({ 
  arrearsData, 
  hostelData, 
  topStudents, 
  genderDistribution,
  subjectAnalytics = [],
  gradeDistribution = [],
  subjectGradeDistribution = {},
  semesterDistribution = [],
  marksDistribution = []
}: AnalyticsChartsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 max-w-2xl">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="subjects">Subjects</TabsTrigger>
        <TabsTrigger value="grades">Grades</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Arrears Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pass/Fail Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={arrearsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {arrearsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Hostel vs Day Scholar */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Residence Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={hostelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {hostelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Top 5 Students */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top 5 Students by Total Marks</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topStudents}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Gender Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={genderDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </TabsContent>

      {/* Subjects Tab */}
      <TabsContent value="subjects" className="space-y-6">
        {/* Subject Performance Overview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Subject Performance Overview</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={subjectAnalytics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={200} />
              <Tooltip />
              <Legend />
              <Bar dataKey="passed" stackId="a" fill="#10b981" name="Passed" />
              <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Subject Average Marks */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Average Marks by Subject</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={subjectAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="averageMarks" fill="#3b82f6" name="Average Marks" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Subject Pass Percentage */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Pass Percentage by Subject</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={subjectAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="passPercentage" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Subject-wise Grade Distribution */}
        {subjectAnalytics.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subjectAnalytics.slice(0, 6).map((subject) => {
              const gradeData = Object.entries(subject.gradeDistribution || {})
                .filter(([_, count]) => count > 0)
                .map(([grade, count]) => ({ grade, count }))
                .sort((a, b) => {
                  const order = ['O', 'A+', 'A', 'B+', 'B', 'C', 'F']
                  return order.indexOf(a.grade) - order.indexOf(b.grade)
                })

              if (gradeData.length === 0) return null

              return (
                <Card key={subject.name} className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{subject.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Pass: {subject.passPercentage}% | Avg: {subject.averageMarks}
                  </p>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={gradeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count">
                        {gradeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade] || COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )
            })}
          </div>
        )}
      </TabsContent>

      {/* Grades Tab */}
      <TabsContent value="grades" className="space-y-6">
        {/* Overall Grade Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Overall Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={gradeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count">
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade] || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Grade Distribution Pie */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Grade Distribution (Pie Chart)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={gradeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ grade, count, percent }) => `${grade}: ${count} (${(percent * 100).toFixed(1)}%)`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="count"
              >
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </TabsContent>

      {/* Performance Tab */}
      <TabsContent value="performance" className="space-y-6">
        {/* Marks Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Marks Distribution (Range-wise)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={marksDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Semester Distribution */}
        {semesterDistribution.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Records by Semester</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={semesterDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semester" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Subject Comparison - Pass Rate */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Subject Pass Rate Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={subjectAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="passPercentage" stroke="#10b981" strokeWidth={2} name="Pass %" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
