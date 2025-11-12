"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import apiClient from "@/lib/api"
import type { AuditLog } from "@/types"

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const response = await apiClient.get(`/admin/audit?page=${page}`)
        setLogs(response.data || [])
      } catch (error: any) {
        console.error("Failed to fetch audit logs:", error)
        // Set empty array on error to prevent crashes
        setLogs([])
        const errorMessage = error?.response?.data?.error || error?.message || "Failed to load audit logs"
        console.error("Error details:", errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [page])

  if (loading) {
    return <div className="animate-pulse">Loading audit logs...</div>
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Audit Logs</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell className="text-sm">{log.userId || '-'}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {log.action || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{log.resource || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.details ? JSON.stringify(log.details).substring(0, 50) : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-6">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-1 text-sm">Page {page}</span>
        <button onClick={() => setPage(page + 1)} className="px-3 py-1 text-sm border rounded-lg">
          Next
        </button>
      </div>
    </Card>
  )
}
