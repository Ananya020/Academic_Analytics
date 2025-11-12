"use client"

import { Card } from "@/components/ui/card"

interface HeatmapData {
  subject: string
  failureRate: number
}

interface HeatmapChartProps {
  data: HeatmapData[]
}

export function HeatmapChart({ data }: HeatmapChartProps) {
  const getColor = (value: number) => {
    if (value < 20) return "bg-green-100 dark:bg-green-900"
    if (value < 40) return "bg-yellow-100 dark:bg-yellow-900"
    if (value < 60) return "bg-orange-100 dark:bg-orange-900"
    return "bg-red-100 dark:bg-red-900"
  }

  const getTextColor = (value: number) => {
    if (value < 20) return "text-green-800 dark:text-green-200"
    if (value < 40) return "text-yellow-800 dark:text-yellow-200"
    if (value < 60) return "text-orange-800 dark:text-orange-200"
    return "text-red-800 dark:text-red-200"
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Subject Failure Rate Heatmap</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.map((item, index) => (
          <div key={index} className={`p-4 rounded-lg text-center ${getColor(item.failureRate)}`}>
            <p className="text-xs font-medium text-muted-foreground mb-1">{item.subject}</p>
            <p className={`text-2xl font-bold ${getTextColor(item.failureRate)}`}>{item.failureRate}%</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
