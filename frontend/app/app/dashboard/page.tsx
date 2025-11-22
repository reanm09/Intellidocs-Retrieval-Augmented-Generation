'use client'

import { useState, useCallback } from 'react'
import ChatArea from '@/components/chat-area'
import Sidebar from '@/components/sidebar'
import { Menu, PanelRightClose, PanelRightOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic' 

const PDFPreview = dynamic(() => import('@/components/pdf-preview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/10">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  ),
})

type DocType = { id: number, filename: string }

export default function DashboardPage() {
  const [selectedDoc, setSelectedDoc] = useState<DocType | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [pdfPanelOpen, setPdfPanelOpen] = useState(true)
  
  const [activePage, setActivePage] = useState<number>(1)

  const handleDocumentSelect = useCallback((doc: DocType) => {
    setSelectedDoc(doc)
    setPdfPanelOpen(true)
    setActivePage(1) 
  }, [])

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <Sidebar 
        open={sidebarOpen} 
        onOpenChange={setSidebarOpen}
        onSelectDocument={handleDocumentSelect}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300">
        <div className="md:hidden flex items-center gap-2 border-b border-border p-4 bg-card/50">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 flex flex-row p-4 gap-4 overflow-hidden h-full relative">
          
          <div className={`flex flex-col h-full transition-all duration-300 ${selectedDoc && pdfPanelOpen ? 'w-1/2' : 'w-full max-w-4xl mx-auto'}`}>
             <ChatArea 
                selectedDocument={selectedDoc?.filename || null} 
                onPageClick={(page) => setActivePage(page)} 
             />
          </div>
          
          {selectedDoc && (
            <div className={`flex flex-col h-full transition-all duration-300 ${pdfPanelOpen ? 'w-1/2 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                {/* Dynamic Component */}
                <PDFPreview selectedDocument={selectedDoc} activePage={activePage} />
            </div>
          )}

          {selectedDoc && (
            <Button
                variant="outline"
                size="icon"
                className="absolute right-6 top-6 z-10 shadow-md bg-background border-border"
                onClick={() => setPdfPanelOpen(!pdfPanelOpen)}
                title={pdfPanelOpen ? "Hide PDF" : "Show PDF"}
            >
                {pdfPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}