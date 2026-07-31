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
  Calendar, 
  Send, 
  Sliders, 
  Loader2,
  UserPlus,
  StickyNote,
  FolderPlus,
  Plus,
  Globe,
  Settings,
  CheckSquare,
  CheckCircle2,
  Target,
  Users,
  Briefcase,
  Ticket,
  Clock,
  X
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

interface CopilotData {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
  translatedText: string;
}

export default function CRMInboxPage() {
  const router = useRouter();
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // AI suggested replies, refinements, and copilot insights
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [aiRefining, setAiRefining] = useState(false);

  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotData, setCopilotData] = useState<CopilotData>({
    summary: 'Awaiting AI analysis to generate executive conversation summary.',
    sentiment: 'neutral',
    priority: 'medium',
    actionItems: [
      'Conduct requirements alignment roundtable',
      'Verify delivery and license tiers configurations'
    ],
    translatedText: ''
  });

  const [targetLanguage, setTargetLanguage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Interactive conversion and scheduling Dialog States
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertTargetType, setConvertTargetType] = useState<'opportunity' | 'client' | 'project' | 'task' | 'ticket'>('opportunity');
  const [convertTargetValue, setConvertTargetValue] = useState('150000');
  const [convertName, setConvertName] = useState('');
  const [convertDesc, setConvertDesc] = useState('');
  const [convertPriority, setConvertPriority] = useState('Medium');
  const [converting, setConverting] = useState(false);

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('10:00');
  const [meetingDuration, setMeetingDuration] = useState('30');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const fetchAiSuggestions = async (thread: Thread) => {
    if (!thread || thread.messages.length === 0) return;
    try {
      setAiSuggestionsLoading(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/inbox/suggested-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: thread.messages,
          clientName: thread.name
        })
      });
      if (res.ok) {
        const json = await res.json();
        setAiSuggestions(json.data || []);
      }
    } catch (e) {
      console.error('Failed to load AI suggestions:', e);
    } finally {
      setAiSuggestionsLoading(false);
    }
  };

  const fetchAiCopilotAnalysis = async (thread: Thread, lang = '') => {
    if (!thread) return;
    try {
      setCopilotLoading(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/inbox/ai-copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: thread.messages,
          clientName: thread.name,
          targetLanguage: lang
        })
      });
      if (res.ok) {
        const json = await res.json();
        setCopilotData(json.data);
      }
    } catch (e) {
      console.error('Failed to run AI Copilot analysis:', e);
    } finally {
      setCopilotLoading(false);
    }
  };

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

  // Refresh AI Suggested replies & Copilot analysis when thread changes
  useEffect(() => {
    if (selectedThreadId && threads.length > 0) {
      const active = threads.find(t => t.id === selectedThreadId);
      if (active) {
        fetchAiSuggestions(active);
        fetchAiCopilotAnalysis(active);
        // Pre-fill dialogs
        setMeetingTitle(`Roundtable Alignment with ${active.name}`);
        setConvertName(active.name);
        setConvertDesc(`Converted from discussion thread with ${active.name} @ ${active.company}`);
      }
    }
  }, [selectedThreadId, threads]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentThread) return;
    setSending(true);

    try {
      const token = localStorage.getItem('session_token');
      // If isInternalNote is checked, prefix the description text to identify it in database feeds
      const finalBody = isInternalNote ? `[INTERNAL NOTE]: ${inputText}` : inputText;

      const res = await fetch('/api/crm/inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          inquiryId: currentThread.id,
          text: finalBody
        })
      });

      if (res.ok) {
        toast.success(isInternalNote ? 'Internal note appended' : 'Message sent to client feed');
        setInputText('');
        setIsInternalNote(false);
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
    toast.success('AI reply suggestion loaded to editor.');
  };

  const handleDraftWithAi = async () => {
    if (!inputText.trim()) {
      toast.error('Please type a draft outline or topic first!');
      return;
    }
    setAiRefining(true);
    const toastId = toast.loading('AI Assistant is refining tone constraints...', { id: 'ai-loading' });
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/ai-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: `Optimize and refine this message draft. Make it sound professional, clear, and direct. Keep it short (maximum 2 sentences): "${inputText}"`,
          tone: 'Professional',
          category: 'Cold Outreach',
          recipientName: currentThread?.name || 'Client'
        })
      });
      if (res.ok) {
        const json = await res.json();
        const cleanedText = json.data.body.replace(/<[^>]*>/g, '').trim();
        setInputText(cleanedText);
        toast.success('AI refined draft loaded', { id: 'ai-loading' });
      } else {
        toast.error('AI draft refinement failed.', { id: 'ai-loading' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error during AI draft refinement.', { id: 'ai-loading' });
    } finally {
      setAiRefining(false);
    }
  };

  const handleConvertTrigger = async () => {
    if (!currentThread) return;
    setConverting(true);
    const toastId = toast.loading(`Converting conversation to ${convertTargetType}...`, { id: 'converting-loader' });
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/inbox/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inquiryId: currentThread.id,
          type: convertTargetType,
          name: convertName,
          description: convertDesc,
          estimatedValue: convertTargetValue,
          priority: convertPriority
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || `Successfully created ${convertTargetType}`, { id: 'converting-loader' });
        setShowConvertModal(false);
      } else {
        toast.error(data.message || 'Failed to complete conversion', { id: 'converting-loader' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Error occurred during conversion request', { id: 'converting-loader' });
    } finally {
      setConverting(false);
    }
  };

  const handleCalendarSchedule = async () => {
    if (!meetingDate || !meetingTime) {
      toast.error('Please specify meeting date and time.');
      return;
    }
    setScheduling(true);
    const toastId = toast.loading('Scheduling roundtable alignment...', { id: 'scheduling-loader' });
    try {
      const token = localStorage.getItem('session_token');
      const startDateTime = new Date(`${meetingDate}T${meetingTime}:00`).toISOString();

      const res = await fetch('/api/crm/inbox/calendar-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          summary: meetingTitle,
          description: meetingDesc,
          startDateTime,
          durationMinutes: Number(meetingDuration)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Meeting scheduled successfully.', { id: 'scheduling-loader' });
        setShowCalendarModal(false);
      } else {
        toast.error('Failed to schedule calendar event.', { id: 'scheduling-loader' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Error scheduling calendar event.', { id: 'scheduling-loader' });
    } finally {
      setScheduling(false);
    }
  };

  const handleLanguageChange = (langCode: string) => {
    setTargetLanguage(langCode);
    if (currentThread) {
      fetchAiCopilotAnalysis(currentThread, langCode);
    }
  };

  const filteredThreads = threads.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900 dark:text-slate-100 p-1 animate-pulse">
        {/* Header Skeleton */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-950 p-6 border border-slate-250 dark:border-slate-800 h-32 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-8 w-80 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
          </div>
          <div className="h-3 w-96 bg-slate-300 dark:bg-slate-700 rounded-lg mt-1"></div>
        </div>

        {/* Workspace Layout Split Skeleton */}
        <div className="flex h-[calc(100vh-220px)] gap-6 overflow-hidden mt-2">
          {/* Threads list skeleton */}
          <div className="w-80 border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex flex-col p-4 space-y-4 shrink-0 shadow-sm">
            <div className="h-8 w-full bg-slate-100 dark:bg-slate-850 rounded-xl mb-2"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 pb-3 border-b border-slate-50 dark:border-slate-850">
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                    <div className="h-2.5 w-10 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                  </div>
                  <div className="h-3 w-16 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                  <div className="h-3 w-36 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat pane skeleton */}
          <div className="flex-1 border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex flex-col p-6 space-y-6 shadow-sm justify-between">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex gap-3 items-center">
                <div className="h-9 w-9 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
                <div className="space-y-1.5">
                  <div className="h-4.5 w-32 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                </div>
              </div>
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
            </div>

            <div className="flex-1 flex flex-col justify-end space-y-4">
              <div className="flex justify-start">
                <div className="h-12 w-80 bg-slate-100 dark:bg-slate-850 rounded-2xl rounded-tl-none"></div>
              </div>
              <div className="flex justify-end">
                <div className="h-12 w-64 bg-slate-200 dark:bg-slate-850 rounded-2xl rounded-tr-none"></div>
              </div>
              <div className="flex justify-start">
                <div className="h-10 w-48 bg-slate-100 dark:bg-slate-850 rounded-2xl rounded-tl-none"></div>
              </div>
            </div>

            <div className="h-12 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-115px)] overflow-hidden bg-background text-foreground rounded-2xl border border-border">
      
      {/* Left Thread List Sidebar */}
      <section className="w-80 border-r border-border bg-card flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 uppercase">CRM Inbox</h2>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground rounded-xl hover:bg-accent">
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
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0 text-sm">
                  {thread.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold truncate ${isActive ? 'text-primary' : ''}`}>
                      {thread.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{thread.time}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{thread.company}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-1">{thread.lastMessage}</p>
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
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                {currentThread.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground leading-none">{currentThread.name}</h3>
                <p className="text-[9px] text-muted-foreground mt-1.5">{currentThread.role} @ {currentThread.company}</p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowConvertModal(true)}
                className="bg-accent/40 hover:bg-accent border-border text-[10px] font-bold h-8 rounded-lg flex items-center gap-1"
              >
                <FolderPlus className="h-3.5 w-3.5 text-primary" /> Convert Lead
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCalendarModal(true)}
                className="bg-accent/40 hover:bg-accent border-border text-[10px] font-bold h-8 rounded-lg flex items-center gap-1"
              >
                <Calendar className="h-3.5 w-3.5 text-primary" /> Schedule Meet
              </Button>
              <span className="h-6 w-[1px] bg-border mx-1" />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground rounded-lg"><Phone className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground rounded-lg"><Video className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground rounded-lg"><MoreVertical className="h-4.5 w-4.5" /></Button>
            </div>
          </div>

          {/* Messages Scroll area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-accent/5">
            {currentThread.messages.map(msg => {
              const isMe = msg.sender === 'user';
              const isNote = msg.text.startsWith('[INTERNAL NOTE]:');
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                    isNote
                      ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 rounded-none italic'
                      : isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-card border border-border text-foreground rounded-tl-none'
                  }`}>
                    {isNote && (
                      <div className="flex items-center gap-1 mb-1 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        <StickyNote className="h-3 w-3" /> Internal Workspace Note
                      </div>
                    )}
                    <p>{isNote ? msg.text.replace('[INTERNAL NOTE]:', '').trim() : msg.text}</p>
                    <p className={`text-[8px] mt-1 text-right ${isMe ? 'text-white/80' : 'text-muted-foreground'}`}>{msg.time}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Composer controls */}
          <div className="p-4 border-t border-border bg-card space-y-3 shrink-0">
            {/* AI suggested reply pill headers */}
            {aiSuggestions.length > 0 && (
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 max-w-lg mx-auto w-full">
                <div className="flex items-center gap-1.5 mb-2 text-primary">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">AI Suggested Replies</span>
                  {aiSuggestionsLoading && <Loader2 className="h-3 w-3 animate-spin text-primary ml-1" />}
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
            )}

            {/* Note toggle indicator bar */}
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="internalNoteToggle"
                  checked={isInternalNote} 
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="accent-amber-500 h-3.5 w-3.5 rounded-sm border-gray-300"
                />
                <label htmlFor="internalNoteToggle" className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 cursor-pointer select-none">
                  <StickyNote className="h-3 w-3" /> Append as Internal Memo / Workspace Note
                </label>
              </div>
            </div>

            {/* Input Composer */}
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground rounded-lg"><Paperclip className="h-4.5 w-4.5" /></Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground rounded-lg"><Smile className="h-4.5 w-4.5" /></Button>
              <Input 
                placeholder={isInternalNote ? "Type internal workspace note here..." : "Type client follow-up message..."} 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className={`flex-1 border-border text-xs rounded-xl ${isInternalNote ? 'bg-amber-50/40 border-amber-200' : 'bg-accent/30'}`}
              />
              <Button 
                size="icon" 
                variant="outline" 
                className="text-primary hover:text-primary hover:bg-primary/10 h-9 w-9 rounded-lg border-border" 
                onClick={handleDraftWithAi}
                disabled={aiRefining}
              >
                {aiRefining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/95 text-white font-bold h-9 px-4 rounded-xl flex items-center gap-1.5" 
                onClick={handleSendMessage} 
                disabled={sending}
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send'}
                {!sending && <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground italic text-xs">
          Select a lead conversation to read feeds.
        </div>
      )}

      {/* Right AI Copilot & Lead Context Drawer */}
      {currentThread && (
        <aside className="w-80 border-l border-border bg-card p-5 overflow-y-auto shrink-0 hidden xl:block space-y-6">
          {/* Profile Overview */}
          <div className="text-center pb-5 border-b border-border">
            <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center font-bold text-lg text-primary mx-auto mb-2">
              {currentThread.name.substring(0, 2).toUpperCase()}
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{currentThread.name}</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{currentThread.role} @ {currentThread.company}</p>
            <Badge className="bg-primary/10 text-primary border-none mt-2 font-bold text-[9px] hover:bg-primary/15 rounded-lg px-2 py-0.5">
              {currentThread.channel}
            </Badge>
          </div>

          {/* AI Sales Copilot intelligence */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Copilot Insights
              </h5>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:bg-accent rounded-lg"
                onClick={() => fetchAiCopilotAnalysis(currentThread, targetLanguage)}
                disabled={copilotLoading}
              >
                {copilotLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5 rotate-45" />}
              </Button>
            </div>

            {/* Conversation Summary */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-3.5 space-y-1.5">
              <span className="text-[9px] font-bold text-primary uppercase tracking-wider">AI Thread Summary</span>
              <p className="text-[10px] leading-relaxed text-slate-700 dark:text-slate-350">
                {copilotData.summary}
              </p>
            </div>

            {/* Sentiment and Priority Index */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-accent/20 border border-border rounded-xl space-y-1">
                <span className="text-[8px] font-bold text-muted-foreground uppercase">Sentiment</span>
                <p className="text-[10px] font-black text-foreground capitalize flex items-center gap-1">
                  {copilotData.sentiment === 'positive' ? '😊 Positive' : copilotData.sentiment === 'negative' ? '😠 Negative' : '😐 Neutral'}
                </p>
              </div>
              <div className="p-2.5 bg-accent/20 border border-border rounded-xl space-y-1">
                <span className="text-[8px] font-bold text-muted-foreground uppercase">Priority</span>
                <p className={`text-[10px] font-black capitalize ${
                  copilotData.priority === 'high' ? 'text-rose-500' : copilotData.priority === 'medium' ? 'text-amber-500' : 'text-slate-400'
                }`}>
                  🔥 {copilotData.priority}
                </p>
              </div>
            </div>

            {/* Extracted Action Items */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <CheckSquare className="h-3 w-3 text-primary" /> Action Items Extract
              </span>
              <div className="space-y-1.5">
                {copilotData.actionItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-background border border-border/80 rounded-lg group">
                    <input type="checkbox" className="accent-primary h-3.5 w-3.5 mt-0.5 rounded-sm border-gray-300" />
                    <span className="text-[10px] text-slate-600 dark:text-slate-350 leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Translation Selector */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Globe className="h-3 w-3" /> Language Translation
              </label>
              <select 
                value={targetLanguage} 
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full bg-accent border border-border text-xs rounded-xl h-8 px-2 font-semibold text-foreground cursor-pointer focus:ring-1 focus:ring-primary focus:border-transparent"
              >
                <option value="">Original Language</option>
                <option value="English">Translate to English</option>
                <option value="Spanish">Translate to Spanish</option>
                <option value="Hindi">Translate to Hindi</option>
                <option value="French">Translate to French</option>
                <option value="German">Translate to German</option>
              </select>
              {copilotData.translatedText && (
                <div className="bg-accent/40 p-2.5 border border-border rounded-xl text-[10px] leading-relaxed italic text-muted-foreground mt-2 animate-in fade-in">
                  "{copilotData.translatedText}"
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Convert Opportunity/Client Dialog Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fadeIn duration-200">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl relative space-y-4">
            <button 
              onClick={() => setShowConvertModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-primary" /> Convert Inbox Conversation
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Seamlessly transform conversation parameters into relational module entities.</p>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Target CRM Entity</label>
                <select 
                  value={convertTargetType}
                  onChange={(e) => setConvertTargetType(e.target.value as any)}
                  className="w-full bg-accent border border-border text-xs rounded-xl h-9 px-2 text-foreground font-semibold"
                >
                  <option value="opportunity">Opportunity (CRM Deal)</option>
                  <option value="client">Client profile</option>
                  <option value="project">Project board</option>
                  <option value="task">Follow-up Task</option>
                  <option value="ticket">Support Ticket</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Title / Name</label>
                <Input 
                  value={convertName}
                  onChange={(e) => setConvertName(e.target.value)}
                  className="bg-accent border-border text-xs rounded-xl h-9"
                />
              </div>

              {(convertTargetType === 'opportunity' || convertTargetType === 'project') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Value budget range (INR)</label>
                  <Input 
                    value={convertTargetValue}
                    onChange={(e) => setConvertTargetValue(e.target.value)}
                    type="number"
                    className="bg-accent border-border text-xs rounded-xl h-9"
                  />
                </div>
              )}

              {(convertTargetType === 'task' || convertTargetType === 'ticket') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Priority level</label>
                  <select 
                    value={convertPriority}
                    onChange={(e) => setConvertPriority(e.target.value)}
                    className="w-full bg-accent border border-border text-xs rounded-xl h-9 px-2 text-foreground font-semibold"
                  >
                    <option value="High">High / Urgent</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Internal Description / SOW</label>
                <textarea 
                  value={convertDesc}
                  onChange={(e) => setConvertDesc(e.target.value)}
                  className="w-full bg-accent border border-border text-xs rounded-xl p-3.5 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowConvertModal(false)} className="text-xs font-semibold hover:bg-accent rounded-xl px-4">
                Cancel
              </Button>
              <Button 
                onClick={handleConvertTrigger} 
                disabled={converting}
                className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl px-4 border-none flex items-center gap-1.5"
              >
                {converting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Convert Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting roundtable dialog modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fadeIn duration-200">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl relative space-y-4">
            <button 
              onClick={() => setShowCalendarModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Schedule Google Calendar roundtable
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Schedule followup meetings and sync slots directly to client Google Calendars.</p>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Meeting subject title</label>
                <Input 
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="bg-accent border-border text-xs rounded-xl h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Date</label>
                  <Input 
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="bg-accent border-border text-xs rounded-xl h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Time</label>
                  <Input 
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="bg-accent border-border text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Duration</label>
                <select 
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(e.target.value)}
                  className="w-full bg-accent border border-border text-xs rounded-xl h-9 px-2 text-foreground font-semibold"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="120">2 Hours</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Description / Agenda</label>
                <textarea 
                  value={meetingDesc}
                  onChange={(e) => setMeetingDesc(e.target.value)}
                  placeholder="Outline conversation details or agenda..."
                  className="w-full bg-accent border border-border text-xs rounded-xl p-3.5 h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowCalendarModal(false)} className="text-xs font-semibold hover:bg-accent rounded-xl px-4">
                Cancel
              </Button>
              <Button 
                onClick={handleCalendarSchedule} 
                disabled={scheduling}
                className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl px-4 border-none flex items-center gap-1.5"
              >
                {scheduling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Schedule roundtable
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
