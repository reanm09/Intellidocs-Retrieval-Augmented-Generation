'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Trash2, Square, Sparkles, Lightbulb, Globe } from 'lucide-react' // Added Globe
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ChatMessage from './chat-message'
import { Card } from '@/components/ui/card'
import api from '@/lib/api' 
import { cn } from '@/lib/utils' 

interface ChatAreaProps {
  selectedDocument: string | null
  onPageClick?: (page: number) => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

export default function ChatArea({ selectedDocument, onPageClick }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState<number | null>(null)
  const [isWebSearch, setIsWebSearch] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!selectedDocument) {
        setMessages([{ id: 'welcome', role: 'assistant', content: 'Hello! Select a document to start chatting.' }]);
        setChatId(null);
        return;
    }

    const initializeChat = async () => {
        setIsLoading(true);
        setMessages([]); 
        try {
            const chatsRes = await api.get('/chats');
            const existingChat = chatsRes.data.chats.find((c: any) => c.name === selectedDocument);

            if (existingChat) {
                setChatId(existingChat.id);
                const histRes = await api.get(`/chats/${existingChat.id}`);
                if (histRes.data.ok) {
                    const history = histRes.data.history.map((msg: any, idx: number) => ({
                        id: `hist-${idx}`,
                        role: msg.role,
                        content: msg.content
                    }));
                    setMessages(history.length ? history : [{ id: 'welcome', role: 'assistant', content: `Welcome back! Ask me anything about ${selectedDocument}.` }]);
                }
            } else {
                const colsRes = await api.get('/collections');
                const col = colsRes.data.collections.find((c: any) => c.filename === selectedDocument);
                if (col) {
                    const createRes = await api.post('/chats', { name: selectedDocument, collection_id: col.id });
                    if (createRes.data.ok) {
                        setChatId(createRes.data.chat_id);
                        setMessages([{ id: 'welcome', role: 'assistant', content: `I'm ready to analyze ${selectedDocument}.` }]);
                    }
                }
            }
        } catch (e) {
            console.error("Chat init failed", e);
        } finally {
            setIsLoading(false);
        }
    };
    initializeChat();
  }, [selectedDocument]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userQuery = text;
    setInput(''); 
    setIsLoading(true);

    const userMsgId = crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`;
    const assistantMsgId = crypto.randomUUID ? crypto.randomUUID() : `ai-${Date.now()}`;

    setMessages(prev => [
        ...prev, 
        { id: userMsgId, role: 'user', content: userQuery },
        { id: assistantMsgId, role: 'assistant', content: '' }
    ]);

    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: userQuery,
          chat_id: chatId,
          collection_name: selectedDocument,
          mode: isWebSearch ? "hybrid" : "discrete"
        }),
        signal: abortControllerRef.current.signal
      });

      if (response.status === 401) throw new Error("Unauthorized: Please log in again.");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let currentText = "";
      let buffer = ""; 

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        
        buffer += chunkValue;
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; 

        for (const line of lines) {
          if (line.trim() === "") continue;
          try {
            const json = JSON.parse(line);
            
            if (json.type === 'token') {
              currentText += json.data;
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMsgId ? { ...msg, content: currentText } : msg
              ));
            } else if (json.type === 'sources') {
                let sources: string[] = [];
                if (json.data.pdf) {
                    sources = sources.concat(json.data.pdf.map((s: any) => `Page ${s.page}`));
                }
                if (json.data.web) {
                    sources = sources.concat(json.data.web.map((w: any) => `Web: ${w.title}`));
                }
                
                setMessages(prev => prev.map(msg => 
                    msg.id === assistantMsgId ? { ...msg, sources } : msg
                ));
                if (json.chat_id && !chatId) setChatId(json.chat_id);
            } else if (json.type === 'error') {
              currentText += `\n[Error: ${json.data}]`;
            }
          } catch (e) {
            console.warn("Skipping invalid JSON chunk:", line);
          }
        }
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Stream failed", error);
        setMessages(prev => prev.map(msg => 
            msg.id === assistantMsgId ? { ...msg, content: msg.content + `\n[${error.message || "Connection Failed"}]` } : msg
        ));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setIsLoading(false);
    }
  }

  const clearConversation = () => {
    setMessages([{ id: 'reset', role: 'assistant', content: 'Conversation cleared (Visual only).' }])
  }

  const suggestions = [
    "Summarize this document",
    "Explain the main conclusion",
    "What are the key points?"
  ];

  const showSuggestions = messages.length === 1 && messages[0].role === 'assistant';

  return (
    <Card className="flex-1 flex flex-col bg-card rounded-lg border border-border overflow-hidden h-full">
      <div className="flex items-center justify-between border-b border-border p-4 bg-card/50">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-semibold">Chat</h2>
            {selectedDocument ? (
                <p className="text-xs text-foreground/70">Analyzing: {selectedDocument}</p>
            ) : (
                <p className="text-xs text-yellow-600">Select a document</p>
            )}
          </div>
          
          {/* WEB SEARCH INDICATOR */}
          {isWebSearch && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full border border-blue-500/20">
                <Globe className="w-3 h-3" />
                Web Active
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={clearConversation}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} onPageClick={onPageClick} />
        ))}
        
        {showSuggestions && selectedDocument && (
            <div className="mt-auto mb-2 w-full px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 pl-1">
                    <Lightbulb className="w-3 h-3" />
                    <span>Suggested questions</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => handleSend(s)}
                            disabled={isLoading}
                            className="text-xs text-left p-3 rounded-xl bg-secondary/40 hover:bg-accent/10 hover:text-accent border border-border/50 hover:border-accent/30 transition-all hover:shadow-sm flex items-center gap-2 group"
                        >
                            <Sparkles className="w-3 h-3 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                            <span className="truncate">{s}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4 bg-card/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          {/* Web Search Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsWebSearch(!isWebSearch)}
            className={cn(
                "transition-all duration-300",
                isWebSearch ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
            )}
            title={isWebSearch ? "Web Search On" : "Web Search Off"}
          >
            <Globe className="w-4 h-4" />
          </Button>

          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isWebSearch ? "Ask PDF + Web..." : "Ask PDF..."}
            disabled={isLoading && !abortControllerRef.current}
            className="flex-1"
          />
          
          {isLoading ? (
             <Button type="button" onClick={stopGeneration} variant="destructive" size="icon">
                <Square className="w-4 h-4 fill-current" />
             </Button>
          ) : (
             <Button type="submit" disabled={!input.trim() || !selectedDocument} size="icon">
                <Send className="w-4 h-4" />
             </Button>
          )}
        </form>
      </div>
    </Card>
  )
}