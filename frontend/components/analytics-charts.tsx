"use client"

import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card } from "@/components/ui/card"

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]

interface AnalyticsChartsProps {
  arrearsData: { name: string; value: number }[]
  hostelData: { name: string; value: number }[]
  topStudents: { name: string; score: number }[]
  genderDistribution: { name: string; value: number }[]
}

export function AnalyticsCharts({ arrearsData, hostelData, topStudents, genderDistribution }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Arrears Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Arrears Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={arrearsData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {arrearsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Hostel vs Day Scholar */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Hostel Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={hostelData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {hostelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Top 5 Students */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top 5 Students</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topStudents}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
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
  )
}
