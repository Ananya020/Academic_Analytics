"use client"

import type React from "react"

import { useState } from "react"
import { Upload, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import apiClient from "@/lib/api"

interface FileUploadCardProps {
  title: string
  description: string
  endpoint: string
  acceptedTypes?: string
  onUploadSuccess?: () => void
}

export function FileUploadCard({
  title,
  description,
  endpoint,
  acceptedTypes = ".csv",
  onUploadSuccess,
}: FileUploadCardProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      setStatus("idle")
      setMessage("")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setStatus("idle")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await apiClient.post(endpoint, formData)
      setStatus("success")
      setMessage(response.data?.message || "File uploaded successfully!")
      setFile(null)
      // Reset file input
      const fileInput = document.getElementById(`file-${title}`) as HTMLInputElement
      if (fileInput) fileInput.value = ""
      onUploadSuccess?.()
    } catch (error: any) {
      setStatus("error")
      // Extract error message from axios response
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
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center mb-4">
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id={`file-${title}`}
        />
        <label htmlFor={`file-${title}`} className="text-sm text-primary cursor-pointer hover:underline">
          Click to select or drag and drop
        </label>
        {file && <p className="text-xs text-muted-foreground mt-2">{file.name}</p>}
      </div>

      {status === "success" && (
        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg mb-4">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-600 whitespace-pre-line">{message}</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 whitespace-pre-line">{message}</p>
        </div>
      )}

      <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
        {uploading ? "Uploading..." : "Upload File"}
      </Button>
    </Card>
  )
}
