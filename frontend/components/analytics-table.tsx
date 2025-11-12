"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"

interface TableData {
  id: string
  subject: string
  failureRate: number
  studentsFailed: number
  totalStudents: number
}

interface AnalyticsTableProps {
  title: string
  data: TableData[]
}

export function AnalyticsTable({ title, data }: AnalyticsTableProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Failure Rate</TableHead>
              <TableHead className="text-right">Students Failed</TableHead>
              <TableHead className="text-right">Total Students</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.subject}</TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {row.failureRate}%
                  </span>
                </TableCell>
                <TableCell className="text-right">{row.studentsFailed}</TableCell>
                <TableCell className="text-right">{row.totalStudents}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
