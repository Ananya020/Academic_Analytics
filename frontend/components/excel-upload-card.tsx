"use client"

import type React from "react"

import { useState } from "react"
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import apiClient from "@/lib/api"

interface ExcelUploadCardProps {
  onUploadSuccess?: () => void
}

export function ExcelUploadCard({ onUploadSuccess }: ExcelUploadCardProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [uploadDetails, setUploadDetails] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      setStatus("idle")
      setMessage("")
      setUploadDetails(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setStatus("idle")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await apiClient.post("/fa/upload/excel", formData)
      setStatus("success")
      setMessage(response.data?.message || "Excel file uploaded successfully!")
      setUploadDetails(response.data?.details || null)
      setFile(null)
      // Reset file input
      const fileInput = document.getElementById("excel-file-input") as HTMLInputElement
      if (fileInput) fileInput.value = ""
      onUploadSuccess?.()
    } catch (error: any) {
      setStatus("error")
      const errorMessage = 
        error?.response?.data?.error || 
        error?.response?.data?.message || 
        error?.message || 
        "Upload failed. Please check the file format and try again."
      setMessage(errorMessage)
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="p-6 border-2 border-primary/20">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileSpreadsheet className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-1">Upload Excel File (All Data)</h3>
          <p className="text-sm text-muted-foreground">
            Upload a single Excel file containing Students, Performance, and Attendance data in separate sheets
          </p>
        </div>
      </div>

      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>File Format Requirements</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-1 text-sm">
            <p><strong>Students Sheet:</strong> registration_number, name, gender, residence_type</p>
            <p><strong>Performance Sheet:</strong> student_reg_no, subject_id, marks, semester</p>
            <p><strong>Attendance Sheet:</strong> student_reg_no, subject_id, percentage</p>
            <p className="text-xs text-muted-foreground mt-2">
              Column names can have variations (e.g., "Registration Number" or "reg_no"). 
              Grades are automatically calculated from marks.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-4 bg-muted/30">
        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="excel-file-input"
        />
        <label htmlFor="excel-file-input" className="text-sm text-primary cursor-pointer hover:underline font-medium">
          Click to select Excel file or drag and drop
        </label>
        {file && (
          <div className="mt-3">
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}
      </div>

      {status === "success" && (
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600 mb-1">Upload Successful!</p>
              <p className="text-sm text-green-600 whitespace-pre-line">{message}</p>
            </div>
          </div>
          
          {uploadDetails && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Upload Summary:</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Students</p>
                  <p className="font-semibold">{uploadDetails.students || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Performance</p>
                  <p className="font-semibold">{uploadDetails.performance || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Attendance</p>
                  <p className="font-semibold">{uploadDetails.attendance || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 whitespace-pre-line">{message}</p>
        </div>
      )}

      <Button 
        onClick={handleUpload} 
        disabled={!file || uploading} 
        className="w-full"
        size="lg"
      >
        {uploading ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Processing Excel File...
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Upload Excel File
          </>
        )}
      </Button>
    </Card>
  )
}

