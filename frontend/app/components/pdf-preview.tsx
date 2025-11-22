'use client'

import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import api from '@/lib/axios-client'

interface PDFPreviewProps {
  selectedDocument: { id: number, filename: string } | null
  activePage?: number
}

export default function PDFPreview({ selectedDocument, activePage = 1 }: PDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if (selectedDocument?.id) {
      const baseUrl = api.defaults.baseURL || "http://localhost:5000/api"

      const url = `${baseUrl}/collections/${selectedDocument.id}/download#page=${activePage}&toolbar=0&navpanes=0&view=FitH`
      setPdfUrl(url)
    } else {
      setPdfUrl(null)
    }
  }, [selectedDocument, activePage])

  if (!selectedDocument) {
    return (
      <Card className="flex w-full flex-col items-center justify-center p-8 text-center border-border h-full bg-card">
        <div className="bg-muted/30 p-6 rounded-full mb-4">
            <FileText className="w-12 h-12 text-muted-foreground/50" />
        </div>
        <h3 className="font-semibold mb-2 text-foreground/70">No Document Selected</h3>
        <p className="text-sm text-foreground/60 max-w-xs">
          Select a document from the sidebar to view it alongside the chat.
        </p>
      </Card>
    )
  }

  return (
    <Card className="flex w-full flex-col bg-card border-border overflow-hidden h-full shadow-lg">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-red-100 dark:bg-red-900/20 p-1.5 rounded">
            <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm truncate max-w-[200px]">{selectedDocument.filename}</h3>
            <p className="text-xs text-muted-foreground">Page {activePage}</p>
          </div>
        </div>
        <a href={pdfUrl?.split('#')[0]} download={selectedDocument.filename} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Download
            </Button>
        </a>
      </div>

      {/* PDF  */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-900 relative">
        {pdfUrl ? (
          <iframe 
            
            key={`${selectedDocument.id}-${activePage}`}
            src={pdfUrl} 
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        ) : (
           <div className="flex items-center justify-center h-full">
             <p>Loading PDF...</p>
           </div>
        )}
      </div>
    </Card>
  )
}