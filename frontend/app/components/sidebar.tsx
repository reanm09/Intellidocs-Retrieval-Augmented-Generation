'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChevronDown, Plus, MessageSquare, FileText, Settings, LogOut, UploadCloud, Loader2, Trash2, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import FileUploadZone from './file-upload-zone'
import api, { fetchCollections, logoutUser } from '@/lib/api'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/theme-toggle' // Import the toggle

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectDocument?: (doc: { id: number, filename: string }) => void
}

export default function Sidebar({ open, onOpenChange, onSelectDocument }: SidebarProps) {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState({
    recent: true,
    chats: true,
  })
  const [showUploadZone, setShowUploadZone] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [chats, setChats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [docsRes, chatsRes] = await Promise.all([
        fetchCollections(),
        api.get('/chats')
      ])
      
      if (docsRes.data.ok) setDocuments(docsRes.data.collections)
      if (chatsRes.data.ok) setChats(chatsRes.data.chats)
      
    } catch (e) {
      console.error("Sidebar Load Error", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    try {
      await logoutUser()
      window.location.href = '/auth/login'
    } catch (err) {
      console.error("Logout failed", err)
    }
  }

  const handleDeleteDoc = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if(!confirm("Delete this document?")) return;
    try {
        await api.delete(`/collections/${id}`);
        loadData();
    } catch(err) { console.error(err); }
  }

  const handleDeleteChat = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if(!confirm("Delete this chat history?")) return;
    try {
        await api.delete(`/chats/${id}`);
        loadData();
    } catch(err) { console.error(err); }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-20"
          onClick={() => onOpenChange(false)}
        />
      )}

      <aside
        className={cn(
          'fixed md:relative w-72 h-screen bg-sidebar border-r border-sidebar-border flex flex-col smooth-transition z-30',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          <Button 
            className="w-full gap-2 shadow-sm border border-primary/20 bg-background text-foreground hover:bg-accent/10 hover:text-accent smooth-transition" 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>

          <Button 
            className="w-full gap-2 bg-sidebar-accent text-white hover:bg-sidebar-accent/90 shadow-md"
            onClick={() => setShowUploadZone(!showUploadZone)}
          >
            <UploadCloud className="w-4 h-4" />
            Upload PDF
          </Button>

          {showUploadZone && (
            <FileUploadZone onClose={() => {
              setShowUploadZone(false)
              loadData()
            }} />
          )}

          {/* Document List */}
          <div className="pt-2">
            <button
              onClick={() => toggleSection('recent')}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-sidebar-primary/10 smooth-transition text-foreground/80"
            >
              <ChevronDown className={cn('w-4 h-4', !expandedSections.recent && '-rotate-90')} />
              <span className="text-sm font-medium">Uploaded Documents</span>
            </button>
            
            {expandedSections.recent && (
              <div className="ml-4 mt-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-2">No documents found</p>
                ) : (
                  documents.map(doc => (
                    <div 
                        key={doc.id}
                        onClick={() => {
                            onSelectDocument?.(doc);
                            onOpenChange(false);
                        }}
                        className="group flex items-center justify-between w-full text-left text-sm py-2 px-3 rounded-lg text-foreground/70 hover:bg-sidebar-primary/10 hover:text-foreground smooth-transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{doc.filename}</span>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteDoc(e, doc.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-opacity"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Past Chats List */}
          <div className="pt-2">
            <button
              onClick={() => toggleSection('chats')}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-sidebar-primary/10 smooth-transition text-foreground/80"
            >
              <ChevronDown className={cn('w-4 h-4', !expandedSections.chats && '-rotate-90')} />
              <span className="text-sm font-medium">Past Chats</span>
            </button>
            {expandedSections.chats && (
              <div className="ml-4 mt-2 space-y-1">
                 {chats.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-3 py-2">No chat history</p>
                 ) : (
                    chats.map(chat => (
                      <div
                        key={chat.id}
                        className="group flex items-center justify-between w-full text-left text-sm py-2 px-3 rounded-lg text-foreground/70 hover:bg-sidebar-primary/10 hover:text-foreground smooth-transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <MessageSquare className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{chat.name || "Untitled Chat"}</span>
                        </div>
                        <button 
                            onClick={(e) => handleDeleteChat(e, chat.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-opacity"
                            title="Delete Chat"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                 )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-sidebar-border space-y-2 bg-sidebar/50">
          <div className="flex items-center justify-between px-3 py-2">
             <span className="text-sm font-medium text-foreground/70">Theme</span>
             <ThemeToggle />
          </div>
          
          <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start gap-2 text-foreground/70 hover:text-foreground">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  )
}