'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PageHeaderSkeleton } from '@/components/ui/dashboard-skeleton';
import { 
  Search, 
  MessageSquare, 
  Mail, 
  Video, 
  Phone, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  Image as ImageIcon, 
  Sparkles, 
  ArrowRight,
  Heart,
  Calendar,
  Layers,
  ArrowUpRight,
  Send,
  Sliders,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'contact';
  text: string;
  time: string;
}

interface Thread {
  id: string;
  name: string;
  role: string;
  company: string;
  channel: string;
  avatar: string;
  lastMessage: string;
  time: string;
  activeDeal: boolean;
  health: number;
  dealValue: string;
  dealStage: string;
  dealProgress: number;
  activity: { title: string; time: string; type: string }[];
  messages: Message[];
}

export default function CRMInboxPage() {
  const router = useRouter();
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [aiSuggestions] = useState<string[]>([
    "Sounds great! Does 10:00 AM work for you?",
    "I will have our technical team review the requirements now."
  ]);

  const loadInboxThreads = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/inbox', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setThreads(json.data || []);
        if (json.data && json.data.length > 0 && !selectedThreadId) {
          setSelectedThreadId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInboxThreads();
  }, []);

  const currentThread = threads.find(t => t.id === selectedThreadId) || threads[0];

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentThread) return;
    setSending(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          inquiryId: currentThread.id,
          text: inputText
        })
      });

      if (res.ok) {
        toast.success('Message sent to client feed');
        setInputText('');
        loadInboxThreads();
      } else {
        toast.error('Failed to post comment feed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleAiSuggestedReply = (suggestion: string) => {
    setInputText(suggestion);
    toast.success('AI reply drafted');
  };

  const handleDraftWithAi = () => {
    if (!inputText.trim()) {
      toast.error('Please type a draft outline or topic first!');
      return;
    }
    toast.loading('AI Assistant is refining tone constraints...', { id: 'ai-loading' });
    setTimeout(() => {
      setInputText(prev => `Hi ${currentThread?.name || 'Client'}, regarding: ${prev}. Let's touch base to finalize this.`);
      toast.success('AI refined draft loaded', { id: 'ai-loading' });
    }, 600);
  };

  const filteredThreads = threads.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden bg-background text-foreground border-t border-border">
      
      {/* Left Thread List Sidebar */}
      <section className="w-80 border-r border-border bg-card flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">CRM Inbox</h2>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground rounded-full hover:bg-accent">
              <Sliders className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-accent/30 border-border text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Thread List Scroll area */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {filteredThreads.map(thread => {
            const isActive = thread.id === selectedThreadId;
            return (
              <div 
                key={thread.id} 
                onClick={() => setSelectedThreadId(thread.id)}
                className={`p-4 cursor-pointer transition-colors flex gap-3 ${
                  isActive 
                    ? 'bg-primary/10 border-l-4 border-primary' 
                    : 'hover:bg-accent/40'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
                  {thread.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold truncate ${isActive ? 'text-primary' : ''}`}>
                      {thread.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{thread.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.company}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">{thread.lastMessage}</p>
                </div>
              </div>
            );
          })}
          {filteredThreads.length === 0 && (
            <p className="p-6 text-center text-xs text-muted-foreground italic">No threads matching query.</p>
          )}
        </div>
      </section>

      {/* Center Chat Workspace */}
      {currentThread ? (
        <main className="flex-1 flex flex-col bg-background overflow-hidden border-r border-border">
          {/* Active Conversation header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                {currentThread.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground leading-none">{currentThread.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">{currentThread.role} @ {currentThread.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><Phone className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><Video className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4.5 w-4.5" /></Button>
            </div>
          </div>

          {/* Messages Scroll area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-accent/5">
            {currentThread.messages.map(msg => {
              const isMe = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl p-3.5 shadow-sm text-xs ${
                    isMe 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-card border border-border text-foreground rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-white/80' : 'text-muted-foreground'}`}>{msg.time}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Composer controls */}
          <div className="p-4 border-t border-border bg-card space-y-3 shrink-0">
            {/* AI suggested reply pill headers */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 max-w-lg mx-auto w-full">
              <div className="flex items-center gap-1.5 mb-2 text-primary">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Suggested Replies</span>
              </div>
              <div className="space-y-2">
                {aiSuggestions.map((s, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleAiSuggestedReply(s)}
                    className="w-full text-left p-3 rounded-xl border border-border bg-background hover:border-primary hover:bg-primary/5 transition-all flex justify-between items-center group shadow-sm"
                  >
                    <span className="text-xs text-foreground font-semibold group-hover:text-primary leading-tight">{s}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            {/* Input Composer */}
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground"><Paperclip className="h-4.5 w-4.5" /></Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground"><Smile className="h-4.5 w-4.5" /></Button>
              <Input 
                placeholder="Type your message feed here..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-accent/30 border-border text-xs rounded-xl"
              />
              <Button size="icon" variant="outline" className="text-primary hover:text-primary hover:bg-primary/10" onClick={handleDraftWithAi}>
                <Sparkles className="h-4 w-4 text-primary" />
              </Button>
              <Button className="bg-primary hover:bg-primary/95 text-white font-bold h-9 px-4 rounded-xl flex items-center gap-1.5" onClick={handleSendMessage} disabled={sending}>
                Send
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground italic text-xs">
          Select a lead conversation to read feeds.
        </div>
      )}

      {/* Right Lead Context Drawer (320px) */}
      {currentThread && (
        <aside className="w-80 border-l border-border bg-card p-6 overflow-y-auto shrink-0 hidden xl:block">
          <div className="text-center pb-6 border-b border-border">
            <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center font-bold text-xl text-primary mx-auto mb-3">
              {currentThread.name.substring(0, 2).toUpperCase()}
            </div>
            <h4 className="text-sm font-bold text-foreground">{currentThread.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{currentThread.role} @ {currentThread.company}</p>
            <Badge className="bg-primary/10 text-primary border-none mt-3 font-bold text-[10px]">
              {currentThread.channel}
            </Badge>
          </div>

          <div className="py-6 space-y-6">
            {/* Active deal details */}
            <div className="p-3.5 rounded-xl border border-border bg-accent/10">
              <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full uppercase">
                {currentThread.dealStage}
              </span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">Deal Value:</span>
                <span className="text-sm font-black text-foreground">{currentThread.dealValue}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Progress value={currentThread.dealProgress} className="h-1 flex-1 bg-accent [&>div]:bg-primary rounded-full" />
                <span className="text-[10px] font-bold text-muted-foreground">{currentThread.dealProgress}%</span>
              </div>
            </div>

            {/* Relationship Health */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-muted-foreground">Client Health Index</span>
                <span className="font-black text-emerald-500">{currentThread.health}%</span>
              </div>
              <Progress value={currentThread.health} className="h-1.5 bg-accent [&>div]:bg-emerald-500 rounded-full" />
            </div>

            {/* Timeline activity list */}
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Recent Timeline Activities</h5>
              <div className="relative border-l border-border pl-4 space-y-4">
                {currentThread.activity.map((act, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[20px] top-0.5 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-card"></div>
                    <p className="text-xs font-bold leading-tight">{act.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{act.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}

    </div>
  );
}
