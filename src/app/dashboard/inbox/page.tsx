'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
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
  channel: 'WhatsApp' | 'Email' | 'SMS';
  avatar: string;
  lastMessage: string;
  time: string;
  activeDeal: boolean;
  health: number;
  dealValue: string;
  dealStage: string;
  dealProgress: number;
  activity: { title: string; time: string; type: 'doc' | 'call' | 'mail' }[];
  messages: Message[];
}

export default function CRMInboxPage() {
  const router = useRouter();
  
  const [threads, setThreads] = useState<Thread[]>([
    {
      id: 'sarah-chen',
      name: 'Sarah Chen',
      role: 'Head of Procurement',
      company: 'BrightSun Energy',
      channel: 'WhatsApp',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPY5vSn_FvdEde74muckLrKIx5xi5-JgRJCtikl-hOBjp-IO7DYJzvn-BWAD4n5cXl7UzJvRpVZ6XmVhukviw_dEsMPqM-IaTPpuCALNuNi4YZTG9AsyC3j-md7lzHhiCqqlX2_0oTAR4jc156yif2Q3eIYN0JefJ2Kkb3TJZ5Lrc_t3piWYIU3KObswtiJ-4tUaXg8MFPWIj1Wm_7zjPPe-0pU5epdjq90xc9cPZnD6rG1oH2l5Fxhp-QlN9BNi1k4XY39PdFoSEk',
      lastMessage: 'Looking forward to the contract...',
      time: '12:45 PM',
      activeDeal: true,
      health: 94,
      dealValue: '$124,500',
      dealStage: 'Proposal',
      dealProgress: 70,
      activity: [
        { title: 'Proposal Sent', time: 'Today, 09:12 AM', type: 'doc' },
        { title: 'Discovery Call', time: 'Oct 24, 02:30 PM', type: 'call' },
        { title: 'Email Follow-up', time: 'Oct 22, 11:45 AM', type: 'mail' },
      ],
      messages: [
        { id: '1', sender: 'contact', text: "Hi Alex, I've had a chance to review the proposal you sent over this morning. The terms for the multi-unit installation look much better than the previous draft.", time: '12:42 PM' },
        { id: '2', sender: 'contact', text: "Could we jump on a quick call tomorrow to finalize the delivery schedule? Looking forward to the contract! 🚀", time: '12:45 PM' }
      ]
    },
    {
      id: 'marcus-wright',
      name: 'Marcus Wright',
      role: 'VP of Strategic Operations',
      company: 'Global Tech Solutions',
      channel: 'Email',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLcCVx5qzFNSkPv_1CC8i67twPzXs7pTmjWmajxlaWlWh82lBvSJuu7QuyND6LPhZKIssmqq4dLPnG5F8ANEkG1HLPOBL33ck7MCpJYq5X1DzHFMmU0SnQqJBzALDaP8_0rkEXt6JwwLtjKaHlsCGZX60mmIHqJJ2A4MfDVFiqHCZqCwSN507CeL1H4Zso-fgWMfO3tUGbysc3p8AMTojqPAyRIvI9TptcAP4psgDC4hlRVTj63MQtjTPdW8Xu_246lOaKHYSq2r7v',
      lastMessage: 'Re: Q3 Project Roadmap Review',
      time: '10:20 AM',
      activeDeal: true,
      health: 88,
      dealValue: '$210,000',
      dealStage: 'Discovery',
      dealProgress: 40,
      activity: [
        { title: 'Roadmap Document Shared', time: 'Yesterday, 04:15 PM', type: 'doc' },
        { title: 'Introductory Presentation', time: 'Oct 20, 10:00 AM', type: 'call' }
      ],
      messages: [
        { id: '1', sender: 'contact', text: 'Hi Alex, thanks for sending the roadmap slide deck. I will share it internally with our executives.', time: '10:15 AM' },
        { id: '2', sender: 'user', text: 'Excellent! Let me know if you would like me to jump on a quick explanatory call.', time: '10:18 AM' },
        { id: '3', sender: 'contact', text: 'That would be helpful. Let\'s tentatively coordinate for Thursday morning.', time: '10:20 AM' }
      ]
    },
    {
      id: 'janet-lee',
      name: 'Janet Lee',
      role: 'Principal Engineer',
      company: 'Apex Robotics',
      channel: 'SMS',
      avatar: '',
      lastMessage: "Just arrived at the site. Let's call later.",
      time: 'Yesterday',
      activeDeal: false,
      health: 79,
      dealValue: '$48,000',
      dealStage: 'Qualification',
      dealProgress: 15,
      activity: [
        { title: 'Technical Questionnaire Received', time: 'Oct 18, 01:10 PM', type: 'doc' }
      ],
      messages: [
        { id: '1', sender: 'contact', text: "Just arrived at the site. Let's call later.", time: 'Yesterday' }
      ]
    }
  ]);

  const [selectedThreadId, setSelectedThreadId] = useState('sarah-chen');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    "Sounds great, Sarah! Does 10:00 AM work for you?",
    "I'll have my team draft the schedule now. Talk tomorrow."
  ]);

  const currentThread = threads.find(t => t.id === selectedThreadId) || threads[0];

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: inputText,
      time: 'Just now'
    };

    setThreads(prev => prev.map(t => {
      if (t.id === selectedThreadId) {
        return {
          ...t,
          lastMessage: inputText,
          time: 'Just now',
          messages: [...t.messages, newMessage]
        };
      }
      return t;
    }));

    setInputText('');
    toast.success('Message dispatched successfully');
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
      setInputText(prev => `Hi ${currentThread.name}, ${prev} I want to ensure we align perfectly with your timelines. Let's touch base to finalize this.`);
      toast.success('AI refined draft loaded', { id: 'ai-loading' });
    }, 800);
  };

  const filteredThreads = threads.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden bg-slate-50 text-slate-900">
      {/* Left Thread List Sidebar */}
      <section className="w-80 border-r border-slate-200 bg-white flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-800">Unified Inbox</h2>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 rounded-full hover:bg-slate-100">
              <Sliders className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50/50 border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredThreads.map(t => {
            const isActive = t.id === selectedThreadId;
            const channelColors = {
              WhatsApp: 'bg-emerald-500 text-white',
              Email: 'bg-indigo-500 text-white',
              SMS: 'bg-amber-500 text-white'
            };
            
            return (
              <div 
                key={t.id} 
                onClick={() => setSelectedThreadId(t.id)}
                className={`p-4 cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-indigo-50/40 border-l-4 border-indigo-600' 
                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative shrink-0">
                    {t.avatar ? (
                      <img 
                        src={t.avatar} 
                        alt={t.name} 
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] ${channelColors[t.channel]}`}>
                      {t.channel === 'WhatsApp' && <MessageSquare className="h-2 w-2" />}
                      {t.channel === 'Email' && <Mail className="h-2 w-2" />}
                      {t.channel === 'SMS' && <MessageSquare className="h-2 w-2" />}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {t.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{t.time}</span>
                    </div>
                    <p className={`text-xs mt-1 truncate ${isActive ? 'text-indigo-800/80 font-medium' : 'text-slate-500'}`}>
                      {t.lastMessage}
                    </p>
                    {t.activeDeal && (
                      <div className="mt-2 flex">
                        <Badge variant="secondary" className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-1.5 py-0.5 rounded-full font-bold">
                          Active Deal
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredThreads.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No conversations found
            </div>
          )}
        </div>
        
        {/* Composer Direct Action Link */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <Button 
            onClick={() => router.push('/dashboard/inbox/composer')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            <Sparkles className="h-4.5 w-4.5" />
            Launch AI Email Composer
          </Button>
        </div>
      </section>

      {/* Active Conversation Panel */}
      <section className="flex-1 flex flex-col h-full bg-slate-50 border-r border-slate-200">
        {/* Chat Header */}
        <div className="h-14 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              {currentThread.avatar ? (
                <img 
                  src={currentThread.avatar} 
                  alt={currentThread.name} 
                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                  {currentThread.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm leading-tight">{currentThread.name}</p>
              <p className="text-[10px] text-slate-400">{currentThread.channel} • Active now</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100">
              <Video className="h-4.5 w-4.5 text-indigo-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100">
              <Phone className="h-4.5 w-4.5 text-indigo-600" />
            </Button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100">
              <MoreVertical className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>

        {/* Message Canvas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-end">
          <div className="space-y-4">
            {currentThread.messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div 
                  key={m.id} 
                  className={`flex gap-3 items-end max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {!isUser && (
                    currentThread.avatar ? (
                      <img 
                        src={currentThread.avatar} 
                        alt={currentThread.name} 
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[10px] shrink-0">
                        {currentThread.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )
                  )}
                  
                  <div>
                    <div className={`p-3 rounded-2xl shadow-sm text-sm border ${
                      isUser 
                        ? 'bg-indigo-600 text-white rounded-br-none border-indigo-700' 
                        : 'bg-white text-slate-800 rounded-bl-none border-slate-100'
                    }`}>
                      <p className="leading-relaxed">{m.text}</p>
                    </div>
                    <span className={`text-[9px] text-slate-400 mt-1 block ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Suggested Response Box */}
          {aiSuggestions.length > 0 && selectedThreadId === 'sarah-chen' && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mt-6 max-w-lg mx-auto w-full">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">AI Suggested Replies</span>
              </div>
              <div className="space-y-2">
                {aiSuggestions.map((s, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleAiSuggestedReply(s)}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex justify-between items-center group shadow-sm"
                  >
                    <span className="text-xs text-slate-700 font-medium">"{s}"</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..." 
              className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none focus:outline-none p-1 placeholder:text-slate-400"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <div className="flex gap-3 text-slate-400">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full">
                  <Smile className="h-4.5 w-4.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full">
                  <Paperclip className="h-4.5 w-4.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full">
                  <ImageIcon className="h-4.5 w-4.5" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleDraftWithAi}
                  className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-xl transition-all font-bold text-xs border border-indigo-100"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Draft with AI
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                >
                  Send
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contextual Sidebar */}
      <section className="w-80 bg-white flex flex-col overflow-y-auto shrink-0">
        <div className="p-6 border-b border-slate-100 text-center flex flex-col items-center">
          <div className="relative mb-3">
            {currentThread.avatar ? (
              <img 
                src={currentThread.avatar} 
                alt={currentThread.name} 
                className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xl border-4 border-slate-100 shadow-sm">
                {currentThread.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
          <h3 
            onClick={() => router.push(`/dashboard/inbox/contact/${currentThread.id}`)}
            className="text-base font-bold text-slate-800 hover:text-indigo-600 cursor-pointer transition-colors"
          >
            {currentThread.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{currentThread.role}</p>
          <p className="text-xs text-indigo-600 font-semibold mt-1">{currentThread.company}</p>
          
          <div className="mt-4 flex gap-2 justify-center">
            <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700">
              <Mail className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700">
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Relationship Health */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Relationship Health</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 fill-emerald-500 stroke-none" />
              {currentThread.health}/100
            </span>
          </div>
          <Progress value={currentThread.health} className="h-2 bg-slate-100 [&>div]:bg-emerald-500 rounded-full" />
          <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
            Health score is high due to rapid response times and high engagement parameters.
          </p>
        </div>

        {/* Active Deals */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Active Deals</span>
            <span className="text-xs font-bold text-slate-800">{currentThread.dealValue}</span>
          </div>
          <div 
            onClick={() => router.push(`/dashboard/inbox/deal/${currentThread.id === 'sarah-chen' ? 'skyline-ventures' : currentThread.id}`)}
            className="p-3 rounded-xl border border-slate-150 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/10 cursor-pointer transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-xs text-slate-700 truncate w-32">Phase 2 Installation</span>
              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded-full uppercase">
                {currentThread.dealStage}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={currentThread.dealProgress} className="h-1 flex-1 bg-slate-200 [&>div]:bg-indigo-600 rounded-full" />
              <span className="text-[9px] text-slate-400 font-bold shrink-0">{currentThread.dealProgress}%</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 flex-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-4">Recent Activity</span>
          <div className="space-y-4 relative pl-3 border-l border-slate-200 ml-1.5">
            {currentThread.activity.map((a, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[18px] top-0.5 w-2 h-2 bg-indigo-600 rounded-full ring-4 ring-white"></div>
                <div className="flex items-center gap-1.5">
                  {a.type === 'doc' && <FileText className="h-3 w-3 text-slate-400" />}
                  {a.type === 'call' && <Phone className="h-3 w-3 text-slate-400" />}
                  {a.type === 'mail' && <Mail className="h-3 w-3 text-slate-400" />}
                  <p className="text-xs font-bold text-slate-700">{a.title}</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
