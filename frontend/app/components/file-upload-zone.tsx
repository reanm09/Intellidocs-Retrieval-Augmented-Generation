'use client'

import { useState, useRef } from 'react'
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { uploadPDF } from '@/lib/api' 

interface FileUploadZoneProps {
  onClose: () => void
}

export default function FileUploadZone({ onClose }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf')
    if (files.length === 0) {
      setError('Please drop only PDF files')
      return
    }
    
    setUploadedFiles(prev => [...prev, ...files])
    setError('')
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf')
      setUploadedFiles(prev => [...prev, ...files])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;
    setIsUploading(true);
    setError("");

    try {
      for (const file of uploadedFiles) {
        await uploadPDF(file);
      }
      
      setUploadedFiles([]);
      onClose();
      window.location.reload(); 
      
    } catch (error) {
      console.error("Upload failed", error);
      setError("Failed to upload files. Ensure you are logged in.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="p-4 space-y-3 border-sidebar-accent/50 bg-sidebar-accent/5 mb-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer smooth-transition',
          isDragging
            ? 'border-sidebar-accent bg-sidebar-accent/10'
            : 'border-sidebar-border hover:border-sidebar-accent/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        
        <Upload className="w-6 h-6 mx-auto mb-2 text-sidebar-accent" />
        <p className="text-xs font-medium">Drag PDFs here or click to browse</p>
        <p className="text-xs text-foreground/50">Max 50MB per file</p>
      </div>

      {error && (
        <div className="flex gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-card rounded text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-muted rounded"
                disabled={isUploading}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          <Button 
            size="sm" 
            className="w-full gap-2"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading && <Loader2 className="w-3 h-3 animate-spin" />}
            {isUploading ? "Uploading..." : `Upload ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </Card>
  )
}